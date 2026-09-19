import { FlaggedItem, SimplifiedTerm, SeverityLevel, FlagStatus } from '../../src/types';

/**
 * @tool record_simplification_and_flagger
 * 
 * DESCRIPTION:
 * Runs automatically the moment a patient record (lab report, discharge summary, or prescription)
 * is ingested. Parses clinical metrics, compares numerical and qualitative values deterministically
 * against verified medical reference ranges, flags abnormal values and urgent instructions, and
 * translates medical jargon into plain, patient-accessible language.
 * 
 * PARAMETERS:
 * - documentContent (string): The raw text of the patient medical document.
 * - documentType (string, optional): 'lab_report' | 'discharge_summary' | 'prescription' | 'auto'.
 * 
 * RETURNS:
 * An object containing:
 * - flaggedItems: Array of out-of-range lab findings, critical thresholds, or clinical alerts.
 * - simplifiedTerms: Array of medical jargon terms detected in the text mapped to plain English translations.
 * - summaryTakeaways: High-level deterministic summary points.
 */

// Comprehensive Medical Vocabulary Translation Dictionary
export const MEDICAL_DICTIONARY: Record<string, string> = {
  // Common symptoms & physical findings
  'dyspnea': 'shortness of breath or difficulty breathing',
  'erythema': 'redness of the skin or surgical incision site',
  'edema': 'swelling caused by fluid trapped in body tissues',
  'pruritus': 'severe itching',
  'syncope': 'fainting or temporary loss of consciousness',
  'vertigo': 'a sensation of spinning dizziness',
  'emesis': 'vomiting',
  'nausea': 'feeling sick to the stomach',
  'diaphoresis': 'excessive, heavy sweating',
  'hematuria': 'blood in the urine',
  'tachycardia': 'abnormally fast resting heart rate (over 100 beats per minute)',
  'bradycardia': 'abnormally slow resting heart rate (under 60 beats per minute)',
  'hypertension': 'high blood pressure',
  'hypotension': 'low blood pressure',
  'hypoxemia': 'low level of oxygen in the blood',
  'pyrexia': 'fever or elevated body temperature',
  'febrile': 'having a fever',
  'afebrile': 'having no fever (normal body temperature)',
  'jaundice': 'yellowing of the skin or whites of the eyes, often linked to liver function',
  'dehiscence': 'separation or reopening of surgical incision edges',
  'purulent': 'pus-like drainage, often indicating potential infection',
  'serosanguinous': 'clear, pink, or yellowish watery fluid with a slight blood tinge from a wound',

  // Lab and clinical terms
  'hyperglycemia': 'high blood sugar level',
  'hypoglycemia': 'low blood sugar level',
  'glycosuria': 'sugar present in the urine',
  'proteinuria': 'protein present in the urine, indicating kidney strain',
  'creatinine': 'a waste product filtered by your kidneys; higher levels mean kidneys are filtering more slowly',
  'egfr': 'estimated glomerular filtration rate: your kidneys filtration score (higher is healthier)',
  'bun': 'blood urea nitrogen: waste from protein breakdown filtered by kidneys',
  'hemoglobin a1c': 'a blood test reflecting your average blood sugar level over the past 2 to 3 months',
  'hba1c': 'a blood test reflecting your average blood sugar level over the past 2 to 3 months',
  'alt': 'alanine aminotransferase: an enzyme found mainly in liver cells; elevated when the liver is irritated',
  'ast': 'aspartate aminotransferase: an enzyme found in liver and heart tissues',
  'bilirubin': 'a yellowish pigment made during the normal breakdown of red blood cells; processed by liver',
  'alkaline phosphatase': 'an enzyme related to bile ducts and bone turnover',
  'alk phos': 'an enzyme related to bile ducts and bone turnover',
  'troponin': 'a protein released into the bloodstream only when heart muscle cells are stressed or injured',
  'tsh': 'thyroid-stimulating hormone: controls how much thyroid hormone your body produces',
  'platelets': 'tiny blood cells that stick together to form clots and stop bleeding',
  'thrombocytopenia': 'abnormally low platelet count, which can increase bleeding or bruising risk',
  'leukocytosis': 'elevated white blood cell count, usually responding to infection or inflammation',
  'neutrophils': 'the most common type of white blood cell, first responders against bacterial infections',
  'hematocrit': 'the proportion of your blood made up of oxygen-carrying red blood cells',
  'potassium': 'an essential mineral and electrolyte that keeps your heart rhythm steady and muscles functioning',
  'hyperkalemia': 'high potassium level in the blood, which requires attention because it affects heart rhythm',
  'hypokalemia': 'low potassium level in the blood, which can cause muscle cramps or weakness',
  'sodium': 'an essential electrolyte balancing fluids, blood pressure, and nerves',
  'hyponatremia': 'low sodium level in the blood',
  'hypernatremia': 'high sodium level in the blood',

  // Prescription abbreviations & clinical instructions
  'bid': 'twice daily (roughly every 12 hours)',
  'tid': 'three times daily (roughly every 8 hours)',
  'qid': 'four times daily (roughly every 6 hours)',
  'qhs': 'every night at bedtime',
  'prn': 'as needed for specific symptoms',
  'po': 'by mouth (orally)',
  'npo': 'nothing by mouth (do not eat or drink anything)',
  'stat': 'immediately without delay',
  'titrate': 'gradually adjust the medicine dose under clinical guidance',
  'contraindicated': 'not safe to take or perform due to a conflicting health condition or drug interaction',
  'prophylaxis': 'preventive treatment to stop an illness or complication before it happens',
  'cholecystectomy': 'surgical removal of the gallbladder',
  'laparoscopic': 'minimally invasive surgery performed through small keyhole incisions using a camera'
};

// Known Reference Range Database with Clinical Metadata
interface LabRule {
  name: string;
  aliases: string[];
  unit: string;
  category: string;
  minNormal: number;
  maxNormal: number;
  criticalLow?: number;
  criticalHigh?: number;
  plainMeaning: string;
}

const REFERENCE_RANGES: LabRule[] = [
  {
    name: 'Fasting Blood Glucose',
    aliases: ['glucose', 'fasting blood glucose', 'blood glucose', 'serum glucose', 'fbs'],
    unit: 'mg/dL',
    category: 'Metabolic & Blood Sugar',
    minNormal: 70,
    maxNormal: 99,
    criticalLow: 55,
    criticalHigh: 250,
    plainMeaning: 'Sugar level circulating in your bloodstream while fasting.'
  },
  {
    name: 'Hemoglobin A1c (HbA1c)',
    aliases: ['hba1c', 'hemoglobin a1c', 'glycated hemoglobin', 'a1c'],
    unit: '%',
    category: 'Metabolic & Blood Sugar',
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalHigh: 9.0,
    plainMeaning: 'Your estimated average blood sugar level over the past 2-3 months (under 5.7% is normal, 5.7-6.4% is prediabetes, 6.5%+ indicates diabetes).'
  },
  {
    name: 'Serum Creatinine',
    aliases: ['creatinine', 'serum creatinine'],
    unit: 'mg/dL',
    category: 'Kidney Health',
    minNormal: 0.6,
    maxNormal: 1.2,
    criticalHigh: 3.0,
    plainMeaning: 'Waste product filtered out by healthy kidneys. Higher numbers indicate reduced filtration.'
  },
  {
    name: 'eGFR (Kidney Filtration Rate)',
    aliases: ['egfr', 'estimated gfr', 'gfr'],
    unit: 'mL/min/1.73m²',
    category: 'Kidney Health',
    minNormal: 60,
    maxNormal: 130,
    criticalLow: 30,
    plainMeaning: 'Kidney efficiency score. 90+ is normal, 60-89 is mildly decreased, below 60 signals kidney stress needing medical review.'
  },
  {
    name: 'Blood Urea Nitrogen (BUN)',
    aliases: ['bun', 'blood urea nitrogen'],
    unit: 'mg/dL',
    category: 'Kidney Health',
    minNormal: 7,
    maxNormal: 20,
    criticalHigh: 50,
    plainMeaning: 'Protein breakdown waste in blood; rises when kidneys are strained or during dehydration.'
  },
  {
    name: 'Potassium (K+)',
    aliases: ['potassium', 'k+'],
    unit: 'mEq/L',
    category: 'Electrolytes',
    minNormal: 3.5,
    maxNormal: 5.0,
    criticalLow: 3.0,
    criticalHigh: 5.8,
    plainMeaning: 'Crucial mineral for heart rhythm and nerve/muscle signaling.'
  },
  {
    name: 'Sodium (Na+)',
    aliases: ['sodium', 'na+'],
    unit: 'mEq/L',
    category: 'Electrolytes',
    minNormal: 135,
    maxNormal: 145,
    criticalLow: 125,
    criticalHigh: 155,
    plainMeaning: 'Main electrolyte regulating fluid volume and cellular hydration.'
  },
  {
    name: 'ALT (Alanine Aminotransferase)',
    aliases: ['alt', 'sgpt', 'alanine aminotransferase'],
    unit: 'U/L',
    category: 'Liver Function',
    minNormal: 7,
    maxNormal: 56,
    criticalHigh: 200,
    plainMeaning: 'Liver enzyme that leaks into blood if liver cells are irritated or inflamed.'
  },
  {
    name: 'AST (Aspartate Aminotransferase)',
    aliases: ['ast', 'sgot', 'aspartate aminotransferase'],
    unit: 'U/L',
    category: 'Liver Function',
    minNormal: 10,
    maxNormal: 40,
    criticalHigh: 200,
    plainMeaning: 'Enzyme produced in liver and muscle cells.'
  },
  {
    name: 'Total Bilirubin',
    aliases: ['total bilirubin', 'bilirubin'],
    unit: 'mg/dL',
    category: 'Liver & Bile Health',
    minNormal: 0.2,
    maxNormal: 1.2,
    criticalHigh: 3.0,
    plainMeaning: 'Yellow pigment processed by the liver; elevated levels can lead to jaundice.'
  },
  {
    name: 'LDL Cholesterol (Bad Cholesterol)',
    aliases: ['ldl', 'ldl cholesterol', 'low density lipoprotein'],
    unit: 'mg/dL',
    category: 'Cardiovascular & Lipids',
    minNormal: 0,
    maxNormal: 99,
    criticalHigh: 190,
    plainMeaning: 'Cholesterol particle that can build plaque inside blood vessels if too high.'
  },
  {
    name: 'Total Cholesterol',
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    unit: 'mg/dL',
    category: 'Cardiovascular & Lipids',
    minNormal: 100,
    maxNormal: 199,
    criticalHigh: 300,
    plainMeaning: 'Total amount of circulating fats/cholesterol in blood.'
  },
  {
    name: 'Triglycerides',
    aliases: ['triglycerides'],
    unit: 'mg/dL',
    category: 'Cardiovascular & Lipids',
    minNormal: 0,
    maxNormal: 149,
    criticalHigh: 500,
    plainMeaning: 'Blood fat stored from unused calories.'
  },
  {
    name: 'White Blood Cell Count (WBC)',
    aliases: ['wbc', 'white blood cell count', 'leukocytes'],
    unit: 'x10^3/uL',
    category: 'Complete Blood Count (CBC)',
    minNormal: 4.5,
    maxNormal: 11.0,
    criticalLow: 2.0,
    criticalHigh: 20.0,
    plainMeaning: 'Immune defense cells that fight bacterial and viral infections.'
  },
  {
    name: 'Hemoglobin',
    aliases: ['hemoglobin', 'hgb'],
    unit: 'g/dL',
    category: 'Complete Blood Count (CBC)',
    minNormal: 12.0,
    maxNormal: 17.5,
    criticalLow: 7.0,
    plainMeaning: 'Protein inside red blood cells carrying oxygen from lungs to your organs.'
  },
  {
    name: 'Platelets',
    aliases: ['platelets', 'platelet count', 'plt'],
    unit: 'x10^3/uL',
    category: 'Complete Blood Count (CBC)',
    minNormal: 150,
    maxNormal: 450,
    criticalLow: 50,
    criticalHigh: 800,
    plainMeaning: 'Cell fragments essential for normal blood clotting and stopping bleeds.'
  },
  {
    name: 'TSH (Thyroid Stimulating Hormone)',
    aliases: ['tsh', 'thyroid stimulating hormone'],
    unit: 'uIU/mL',
    category: 'Thyroid & Endocrine',
    minNormal: 0.4,
    maxNormal: 4.5,
    criticalHigh: 15.0,
    plainMeaning: 'Hormone from pituitary gland telling thyroid how much hormone to create.'
  }
];

export interface SimplificationAndFlaggingResult {
  flaggedItems: FlaggedItem[];
  simplifiedTerms: SimplifiedTerm[];
  summaryTakeaways: string[];
  metricsEvaluatedCount: number;
}

/**
 * Deterministic Record Simplification & Flagging Tool
 * Evaluates raw document text against deterministic medical thresholds and dictionary rules.
 */
export function recordSimplificationAndFlagger(
  documentContent: string,
  _documentType?: string
): SimplificationAndFlaggingResult {
  const contentLower = documentContent.toLowerCase();
  const flaggedItems: FlaggedItem[] = [];
  const simplifiedTerms: SimplifiedTerm[] = [];
  const summaryTakeaways: string[] = [];
  let metricsEvaluatedCount = 0;

  // 1. Identify Simplified Medical Terms present in document
  const foundTerms = new Set<string>();
  for (const [term, plainDefinition] of Object.entries(MEDICAL_DICTIONARY)) {
    // Regex matching whole word
    const termRegex = new RegExp(`\\b${term}\\b`, 'i');
    if (termRegex.test(documentContent)) {
      if (!foundTerms.has(term)) {
        foundTerms.add(term);
        simplifiedTerms.push({
          term: term.toUpperCase(),
          plainDefinition,
          category: 'Medical Vocabulary'
        });
      }
    }
  }

  // 2. Deterministic Lab Rule Matching from Reference Range Table
  const lines = documentContent.split('\n');

  for (const rule of REFERENCE_RANGES) {
    for (const alias of rule.aliases) {
      // Look for lines matching alias followed by a number
      // e.g., "Glucose: 188 mg/dL (70-99)" or "HbA1c 8.6 %" or "Creatinine 1.8"
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `(?:^|[^a-zA-Z0-9])${escapedAlias}\\b[:\\s\\t]*([<>]?\\s*\\d+(?:\\.\\d+)?)`,
        'i'
      );

      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) {
          metricsEvaluatedCount++;
          const rawValStr = match[1].trim().replace(/^[<>]\s*/, '');
          const numVal = parseFloat(rawValStr);

          if (!isNaN(numVal)) {
            let status: FlagStatus = 'NORMAL';
            let severity: SeverityLevel = 'low';
            let plainExplanation = '';

            // Evaluate against deterministic thresholds
            if (rule.criticalHigh !== undefined && numVal >= rule.criticalHigh) {
              status = 'CRITICAL';
              severity = 'critical';
              plainExplanation = `Significantly elevated above safety cut-off (${numVal} ${rule.unit}, normal is ${rule.minNormal}–${rule.maxNormal}). Requires prompt clinical follow-up.`;
            } else if (rule.criticalLow !== undefined && numVal <= rule.criticalLow) {
              status = 'CRITICAL';
              severity = 'critical';
              plainExplanation = `Significantly below safety cut-off (${numVal} ${rule.unit}, normal is ${rule.minNormal}–${rule.maxNormal}). Requires immediate clinical attention.`;
            } else if (numVal > rule.maxNormal) {
              status = 'HIGH';
              severity = numVal > rule.maxNormal * 1.3 ? 'high' : 'moderate';
              plainExplanation = `Higher than typical reference range (${numVal} ${rule.unit} vs normal ${rule.minNormal}–${rule.maxNormal} ${rule.unit}). ${rule.plainMeaning}`;
            } else if (numVal < rule.minNormal) {
              status = 'LOW';
              severity = numVal < rule.minNormal * 0.7 ? 'high' : 'moderate';
              plainExplanation = `Lower than typical reference range (${numVal} ${rule.unit} vs normal ${rule.minNormal}–${rule.maxNormal} ${rule.unit}). ${rule.plainMeaning}`;
            }

            if (status !== 'NORMAL') {
              // Avoid duplicate flags for same test
              if (!flaggedItems.some((f) => f.name === rule.name)) {
                flaggedItems.push({
                  id: `flag-${rule.name.toLowerCase().replace(/\s+/g, '-')}`,
                  name: rule.name,
                  value: `${numVal}`,
                  unit: rule.unit,
                  referenceRange: `${rule.minNormal} – ${rule.maxNormal} ${rule.unit}`,
                  status,
                  severity,
                  category: rule.category,
                  plainExplanation,
                  potentialConcern: `Out-of-range ${rule.name} can impact ${rule.category.toLowerCase()}.`
                });
              }
            }
          }
          break; // Found value for this rule, move to next
        }
      }
    }
  }

  // 3. Deterministic Vital Signs Checking (Blood Pressure, SpO2, Heart Rate, Fever)
  // Blood Pressure: e.g. "BP: 162/94", "168/98 mmHg"
  const bpMatch = documentContent.match(/(?:bp|blood pressure)[:\s\t]*(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bpMatch) {
    metricsEvaluatedCount++;
    const systolic = parseInt(bpMatch[1], 10);
    const diastolic = parseInt(bpMatch[2], 10);
    if (systolic >= 180 || diastolic >= 120) {
      flaggedItems.push({
        id: 'flag-bp-crisis',
        name: 'Blood Pressure (Hypertensive Crisis range)',
        value: `${systolic}/${diastolic}`,
        unit: 'mmHg',
        referenceRange: '< 120/80 mmHg',
        status: 'CRITICAL',
        severity: 'critical',
        category: 'Vital Signs',
        plainExplanation: `Blood pressure reading is significantly elevated (${systolic}/${diastolic} mmHg). In medical guidelines, systolic ≥180 or diastolic ≥120 is considered a hypertensive emergency threshold needing urgent evaluation.`,
        potentialConcern: 'Severe stress on cardiovascular and cerebrovascular systems.'
      });
    } else if (systolic >= 140 || diastolic >= 90) {
      flaggedItems.push({
        id: 'flag-bp-stage2',
        name: 'Blood Pressure (Stage 2 Hypertension range)',
        value: `${systolic}/${diastolic}`,
        unit: 'mmHg',
        referenceRange: '< 120/80 mmHg',
        status: 'HIGH',
        severity: 'high',
        category: 'Vital Signs',
        plainExplanation: `Elevated blood pressure (${systolic}/${diastolic} mmHg). Standard healthy resting target is generally below 120/80 mmHg.`,
        potentialConcern: 'Ongoing arterial resistance requiring blood pressure management.'
      });
    }
  }

  // Oxygen Saturation (SpO2): e.g. "SpO2: 91%", "O2 Sat 92%"
  const spo2Match = documentContent.match(/(?:spo2|o2 sat(?:uration)?|oxygen sat(?:uration)?)[^\d]{0,10}(\d{2,3})\s*%/i);
  if (spo2Match) {
    metricsEvaluatedCount++;
    const spo2 = parseInt(spo2Match[1], 10);
    if (spo2 < 95) {
      flaggedItems.push({
        id: 'flag-spo2-low',
        name: 'Blood Oxygen Saturation (SpO2)',
        value: `${spo2}`,
        unit: '%',
        referenceRange: '95 – 100 %',
        status: spo2 < 90 ? 'CRITICAL' : 'LOW',
        severity: spo2 < 90 ? 'critical' : 'high',
        category: 'Pulmonary / Respiratory',
        plainExplanation: `Blood oxygen level is ${spo2}%, which is lower than the typical room-air baseline of 95–100%.`,
        potentialConcern: 'Decreased arterial oxygenation needing respiratory assessment.'
      });
    }
  }

  // Body Temperature / Fever check: e.g. "Temp: 101.4 F" or "Fever > 101.0"
  const tempMatch = documentContent.match(/(?:temp(?:erature)?|fever)[:\s\t]*(\d{2,3}(?:\.\d+)?)\s*(?:°?\s*[Ff])/i);
  if (tempMatch) {
    metricsEvaluatedCount++;
    const temp = parseFloat(tempMatch[1]);
    if (temp >= 101.0) {
      flaggedItems.push({
        id: 'flag-fever-alert',
        name: 'Body Temperature (Fever Alert)',
        value: `${temp}`,
        unit: '°F',
        referenceRange: '97.0 – 99.5 °F',
        status: 'WARNING',
        severity: temp >= 102.5 ? 'critical' : 'high',
        category: 'Post-Op / Infection Signs',
        plainExplanation: `Fever recorded at ${temp}°F. Temperatures over 101.0°F are standard warning signs in post-discharge instructions to check for post-procedure infection.`,
        potentialConcern: 'Possible developing infection or inflammatory response.'
      });
    }
  }

  // 4. Clinical Red Flags & Safety Warnings (Discharge Instructions & Prescriptions)
  // Check for surgical wound warnings in discharge notes
  if (contentLower.includes('purulent') || contentLower.includes('pus') || contentLower.includes('wound drainage')) {
    flaggedItems.push({
      id: 'flag-wound-drainage',
      name: 'Surgical Incision / Wound Drainage Alert',
      value: 'Purulent/Drainage noted',
      referenceRange: 'Clean, dry, intact without pus',
      status: 'WARNING',
      severity: 'high',
      category: 'Surgical / Wound Care',
      plainExplanation: 'Document mentions cloudy, yellow, or pus-like wound discharge. This is an explicit red flag requiring immediate provider inspection.',
      potentialConcern: 'Early surgical site infection.'
    });
  }

  // Check for Medication interactions / alerts (e.g. Lisinopril + NSAID/Ibuprofen or renal risk)
  if (
    (contentLower.includes('lisinopril') || contentLower.includes('losartan') || contentLower.includes('enalapril')) &&
    (contentLower.includes('ibuprofen') || contentLower.includes('advil') || contentLower.includes('aleve') || contentLower.includes('naproxen') || contentLower.includes('nsaid'))
  ) {
    flaggedItems.push({
      id: 'flag-drug-interaction-nsaid',
      name: 'Medication Caution: Blood Pressure Med (ACEi/ARB) + NSAID Pain Reliever',
      value: 'Concurrent use detected / queried',
      referenceRange: 'Avoid combining without doctor approval',
      status: 'WARNING',
      severity: 'high',
      category: 'Prescription & Drug Safety',
      plainExplanation: 'Taking non-steroidal anti-inflammatory drugs (NSAIDs like Ibuprofen/Advil) with blood pressure medications like Lisinopril can diminish blood pressure control and significantly increase kidney strain.',
      potentialConcern: 'Blunted hypertensive control and acute kidney stress.'
    });
  }

  // Check for Metformin with reduced kidney filtration (eGFR < 45 or elevated creatinine)
  if (contentLower.includes('metformin')) {
    const egfrFlag = flaggedItems.find((f) => f.name.includes('eGFR'));
    if (egfrFlag && parseFloat(egfrFlag.value) < 60) {
      flaggedItems.push({
        id: 'flag-metformin-renal-caution',
        name: 'Prescription Follow-Up: Metformin & Kidney Filtration',
        value: `eGFR ${egfrFlag.value}`,
        referenceRange: 'eGFR > 60 mL/min for full standard dosage',
        status: 'WARNING',
        severity: parseFloat(egfrFlag.value) < 45 ? 'high' : 'moderate',
        category: 'Prescription & Drug Safety',
        plainExplanation: 'Metformin is cleared primarily through the kidneys. Because your kidney filtration rate (eGFR) is mildly reduced, your doctor should verify if a dose adjustment is needed.',
        potentialConcern: 'Metformin clearance rate and safety monitoring.'
      });
    }
  }

  // Check for opioid warning (Oxycodone, Hydrocodone, Tramadol)
  if (contentLower.includes('oxycodone') || contentLower.includes('hydrocodone') || contentLower.includes('tramadol')) {
    flaggedItems.push({
      id: 'flag-opioid-caution',
      name: 'Controlled Medication Alert: Opioid Pain Medication',
      value: 'Prescribed as needed (PRN)',
      referenceRange: 'Shortest duration necessary; do not combine with alcohol or sedatives',
      status: 'WARNING',
      severity: 'moderate',
      category: 'Prescription & Drug Safety',
      plainExplanation: 'Prescribed for acute post-surgical pain only. Causes drowsiness, constipation, and carries dependence risk. Do not drive or drink alcohol while taking this medicine.',
      potentialConcern: 'Sedation, respiratory depression risk with other depressants, bowel motility slowdown.'
    });
  }

  // Build summary takeaways
  if (flaggedItems.length === 0) {
    summaryTakeaways.push('All evaluated clinical values and instructions fall within standard normal ranges.');
  } else {
    const criticals = flaggedItems.filter((f) => f.status === 'CRITICAL');
    const highs = flaggedItems.filter((f) => f.status === 'HIGH' || f.status === 'LOW');
    const warnings = flaggedItems.filter((f) => f.status === 'WARNING');

    if (criticals.length > 0) {
      summaryTakeaways.push(`Urgent review recommended: ${criticals.length} metric(s) fall into critical alert thresholds.`);
    }
    if (highs.length > 0) {
      summaryTakeaways.push(`${highs.length} test result(s) are outside the standard reference range.`);
    }
    if (warnings.length > 0) {
      summaryTakeaways.push(`${warnings.length} specific clinical instruction(s) or medication cautions require direct follow-up.`);
    }
  }

  return {
    flaggedItems,
    simplifiedTerms,
    summaryTakeaways,
    metricsEvaluatedCount
  };
}
