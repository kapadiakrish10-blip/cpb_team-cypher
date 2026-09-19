import { DocumentChunk, RetrievalResult } from '../../src/types';

/**
 * Section-Aware Clinical Text Splitter & In-Memory Session Vector Store
 * 
 * Specifically keeps tabular lab metrics, medication instructions, and warning criteria
 * attached to their contextual reference ranges rather than splitting across lines arbitrarily.
 */

export class SessionVectorStore {
  private chunks: DocumentChunk[] = [];
  private chunkEmbeddings: Map<string, number[]> = new Map();
  private vocabulary: Map<string, number> = new Map();

  constructor() {}

  /**
   * Split clinical text into section-aware chunks.
   * Recognizes standard medical section headers:
   * - LAB REPORT / COMPREHENSIVE METABOLIC PANEL / CBC
   * - DISCHARGE DIAGNOSIS / HOSPITAL COURSE / CLINICAL SUMMARY
   * - DISCHARGE MEDICATIONS / ACTIVE MEDICATIONS / PHARMACY
   * - INSTRUCTIONS / WOUND CARE / DIET
   * - RED FLAGS / WARNING SIGNS / WHEN TO CALL
   */
  public chunkDocument(rawText: string): DocumentChunk[] {
    const lines = rawText.split('\n');
    const chunks: DocumentChunk[] = [];

    // Header patterns commonly found in EHR / medical summaries
    const sectionHeaderRegex = /^(?:[A-Z0-9\s/&()-]{3,40}:|[#]{1,4}\s+[A-Za-z0-9\s/&()-]{3,40}|(?:SECTION|PART|PANEL)\s+[0-9IVX]+|\b(?:LABORATORY FINDINGS|METABOLIC PANEL|COMPLETE BLOOD COUNT|LIPID PROFILE|DISCHARGE SUMMARY|HOSPITAL COURSE|MEDICATIONS|PRESCRIPTION DETAILS|WARNING SIGNS|FOLLOW-UP INSTRUCTIONS|VITAL SIGNS|PHYSICAL EXAMINATION|ALLERGIES|CLINICAL IMPRESSION|PATIENT EDUCATION)\b)/i;

    let currentSection = 'General Record Overview';
    let currentLines: string[] = [];
    let startLine = 1;

    const flushChunk = (endLine: number) => {
      const textContent = currentLines.join('\n').trim();
      if (textContent.length > 20) {
        // If the chunk is extremely large (> 1200 characters), we sub-chunk preserving full lines
        if (textContent.length > 1200) {
          const subLines = textContent.split('\n');
          let subBuffer: string[] = [];
          let subIndex = 1;

          for (const sLine of subLines) {
            subBuffer.push(sLine);
            if (subBuffer.join('\n').length >= 600) {
              chunks.push({
                id: `chunk-${chunks.length + 1}`,
                section: `${currentSection} (Part ${subIndex})`,
                content: subBuffer.join('\n'),
                startLine,
                endLine
              });
              subIndex++;
              subBuffer = [];
            }
          }
          if (subBuffer.length > 0) {
            chunks.push({
              id: `chunk-${chunks.length + 1}`,
              section: `${currentSection} (Part ${subIndex})`,
              content: subBuffer.join('\n'),
              startLine,
              endLine
            });
          }
        } else {
          chunks.push({
            id: `chunk-${chunks.length + 1}`,
            section: currentSection,
            content: textContent,
            startLine,
            endLine
          });
        }
      }
      currentLines = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // If line looks like a major section boundary
      if (trimmed.length > 0 && sectionHeaderRegex.test(trimmed) && currentLines.length >= 3) {
        flushChunk(i);
        currentSection = trimmed.replace(/^#+\s*/, '').replace(/:$/, '').trim();
        startLine = i + 1;
      }
      currentLines.push(line);
    }

    if (currentLines.length > 0) {
      flushChunk(lines.length);
    }

    // If no distinct sections matched, fallback to chunking every ~15 lines with overlap
    if (chunks.length <= 1 && rawText.length > 600) {
      chunks.length = 0;
      const step = 12;
      for (let i = 0; i < lines.length; i += step) {
        const slice = lines.slice(i, i + step + 3);
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          section: `Record Section ${chunks.length + 1}`,
          content: slice.join('\n'),
          startLine: i + 1,
          endLine: Math.min(i + step + 3, lines.length)
        });
      }
    }

    this.chunks = chunks;
    this.buildTFIDFEmbeddings();
    return chunks;
  }

  /**
   * Tokenize text into normalized clinical n-grams and keywords
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s/.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  /**
   * Build TF-IDF vector embeddings for all section chunks
   */
  private buildTFIDFEmbeddings(): void {
    this.vocabulary.clear();
    this.chunkEmbeddings.clear();

    const docFreq: Map<string, number> = new Map();
    const tokenizedChunks: string[][] = [];

    // 1. Build term frequency and vocabulary
    for (const chunk of this.chunks) {
      const tokens = this.tokenize(chunk.section + ' ' + chunk.content);
      tokenizedChunks.push(tokens);

      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, this.vocabulary.size);
        }
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    const totalDocs = this.chunks.length;
    const vocabSize = this.vocabulary.size;

    // 2. Compute TF-IDF vectors
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const tokens = tokenizedChunks[i];
      const vector = new Array(vocabSize).fill(0);

      // Term frequency
      const tf: Map<string, number> = new Map();
      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
      }

      for (const [token, count] of tf.entries()) {
        const vocabIdx = this.vocabulary.get(token);
        if (vocabIdx !== undefined) {
          const df = docFreq.get(token) || 1;
          const idf = Math.log(1 + totalDocs / df);
          vector[vocabIdx] = (count / tokens.length) * idf;
        }
      }

      // Normalize vector
      const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
      const normalizedVector = vector.map((v) => v / norm);

      this.chunkEmbeddings.set(chunk.id, normalizedVector);
    }
  }

  /**
   * Cosine similarity between two normalized vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct;
  }

  /**
   * Retrieve top-k relevant chunks for a user follow-up query.
   * Wraps vector store as retriever(k=3).
   */
  public retrieve(query: string, k = 3): RetrievalResult[] {
    if (this.chunks.length === 0) {
      return [];
    }

    const queryTokens = this.tokenize(query);
    const vocabSize = this.vocabulary.size;
    const queryVector = new Array(vocabSize).fill(0);

    const queryTf: Map<string, number> = new Map();
    for (const t of queryTokens) {
      queryTf.set(t, (queryTf.get(t) || 0) + 1);
    }

    for (const [token, count] of queryTf.entries()) {
      const vocabIdx = this.vocabulary.get(token);
      if (vocabIdx !== undefined) {
        queryVector[vocabIdx] = count / queryTokens.length;
      }
    }

    const qNorm = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0)) || 1;
    const normQueryVector = queryVector.map((v) => v / qNorm);

    // Compute similarity for each chunk
    const scoredChunks: { chunk: DocumentChunk; score: number }[] = [];

    for (const chunk of this.chunks) {
      const chunkVec = this.chunkEmbeddings.get(chunk.id);
      let sim = 0;
      if (chunkVec) {
        sim = this.cosineSimilarity(normQueryVector, chunkVec);
      }

      // Boost score if section header explicitly matches query words
      const sectionLower = chunk.section.toLowerCase();
      for (const qt of queryTokens) {
        if (sectionLower.includes(qt)) {
          sim += 0.25;
        }
      }

      // Boost score if exact medical terms match
      const contentLower = chunk.content.toLowerCase();
      for (const qt of queryTokens) {
        if (contentLower.includes(qt)) {
          sim += 0.1;
        }
      }

      scoredChunks.push({ chunk, score: Math.min(1.0, sim) });
    }

    // Sort descending by relevance
    scoredChunks.sort((a, b) => b.score - a.score);

    // Take top k
    const topResults = scoredChunks.slice(0, k).map(({ chunk, score }) => ({
      chunkId: chunk.id,
      section: chunk.section,
      snippet: chunk.content,
      score: Math.round(score * 100) / 100
    }));

    return topResults;
  }

  public getAllChunks(): DocumentChunk[] {
    return this.chunks;
  }
}
