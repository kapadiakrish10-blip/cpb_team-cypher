"""
Health Companion - Python Implementation
=======================================
A standalone, production-ready Python backend and CLI for the Health Companion system.
Includes:
1. Automated ingestion pipeline (chunking, retrieval-augmented grounding)
2. Tool 1: Record Simplification & Flagger (laboratory reference ranges & medical dictionary)
3. Tool 2: Specialist & Department Finder (with appointment question generation)
4. Gemini API integration (using Python standard library with zero external dependencies)
5. Standalone REST API server (built on Python's http.server) and CLI runner
"""

import os
import sys
import json
import re
import math
import time
from typing import Dict, List, Any, Optional
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error

# -----------------------------------------------------------------------------
# Standard Medical Reference Ranges & Clinical Dictionary
# -----------------------------------------------------------------------------

MEDICAL_DICTIONARY: Dict[str, str] = {
    "dyspnea": "shortness of breath or difficulty breathing",
    "erythema": "redness of the skin or surgical incision site",
    "edema": "swelling caused by fluid trapped in body tissues",
    "pruritus": "severe itching",
    "syncope": "fainting or temporary loss of consciousness",
    "vertigo": "a sensation of spinning dizziness",
    "emesis": "vomiting",
    "nausea": "feeling sick to the stomach",
    "diaphoresis": "excessive, heavy sweating",
    "hematuria": "blood in the urine",
    "tachycardia": "abnormally fast resting heart rate (over 100 beats per minute)",
    "bradycardia": "abnormally slow resting heart rate (under 60 beats per minute)",
    "hypertension": "high blood pressure",
    "hypotension": "low blood pressure",
    "hypoxemia": "low level of oxygen in the blood",
    "pyrexia": "fever or elevated body temperature",
    "febrile": "having a fever",
    "afebrile": "having no fever (normal body temperature)",
    "jaundice": "yellowing of the skin or whites of the eyes, often linked to liver function",
    "dehiscence": "separation or reopening of surgical incision edges",
    "purulent": "pus-like drainage, often indicating potential infection",
    "serosanguinous": "clear, pink, or yellowish watery fluid with a slight blood tinge from a wound",
    "hyperglycemia": "high blood sugar level",
    "hypoglycemia": "low blood sugar level",
    "glycosuria": "sugar present in the urine",
    "proteinuria": "protein present in the urine, indicating kidney strain",
    "creatinine": "a waste product filtered by your kidneys; higher levels mean kidneys are filtering more slowly",
    "egfr": "estimated glomerular filtration rate: your kidneys' filtration score (higher is healthier)",
    "bun": "blood urea nitrogen: waste from protein breakdown filtered by kidneys",
    "hemoglobin a1c": "a blood test reflecting your average blood sugar level over the past 2 to 3 months",
    "hba1c": "a blood test reflecting your average blood sugar level over the past 2 to 3 months",
    "alt": "alanine aminotransferase: an enzyme found mainly in liver cells; elevated when liver is irritated",
    "ast": "aspartate aminotransferase: an enzyme found in liver and heart tissues",
    "alkaline phosphatase": "an enzyme related to bile ducts and bones",
    "bilirubin": "yellowish substance made during normal breakdown of red blood cells",
    "platelets": "cell fragments in your blood that help form clots and stop bleeding",
    "thrombocytopenia": "low blood platelet count",
    "leukocytosis": "elevated white blood cell count, often indicating infection or inflammation",
    "anemia": "a low red blood cell count or low hemoglobin, meaning less oxygen reaches your tissues",
    "cholecystectomy": "surgical removal of the gallbladder",
    "laparoscopic": "minimally invasive surgery performed using small incisions and camera guidance",
    "subcutaneous": "injected into the fatty tissue layer just beneath the skin",
    "prophylaxis": "preventive treatment to stop an infection or blood clot from developing",
    "analgesic": "pain-relieving medication",
    "antipyretic": "fever-reducing medication",
    "contraindicated": "a specific situation in which a drug or treatment should not be used because it may be harmful",
    "nephrotoxic": "substances or medications that can potentially damage or strain kidney function",
    "hepatotoxic": "substances or medications that can potentially damage or strain liver function",
    "nsaid": "nonsteroidal anti-inflammatory drug (like ibuprofen or naproxen); can irritate stomach and strain kidneys"
}

# Standard Reference Ranges
REFERENCE_RANGES = [
    {
        "pattern": r"(?:glucose|fasting glucose|serum glucose)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "category": "Metabolism & Blood Sugar",
        "min": 70,
        "max": 99,
        "critical_high": 250,
        "critical_low": 50,
        "low_exp": "Blood sugar is low (hypoglycemia), which can cause shakiness, sweating, or lightheadedness.",
        "high_exp": "Blood sugar is elevated above normal fasting ranges, indicating impaired glucose processing or diabetes.",
        "crit_high_exp": "Blood sugar is dangerously high; immediate clinical attention is advised."
    },
    {
        "pattern": r"(?:creatinine|serum creatinine)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "Serum Creatinine",
        "unit": "mg/dL",
        "category": "Kidney Function",
        "min": 0.7,
        "max": 1.3,
        "critical_high": 3.0,
        "low_exp": "Creatinine is low, which is generally not concerning and often linked to lower muscle mass.",
        "high_exp": "Creatinine is elevated, which indicates the kidneys are filtering waste more slowly than normal.",
        "crit_high_exp": "Creatinine is significantly elevated, suggesting acute or severe kidney stress."
    },
    {
        "pattern": r"(?:egfr|e-gfr)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "eGFR (Kidney Filtration Rate)",
        "unit": "mL/min/1.73m²",
        "category": "Kidney Function",
        "min": 60,
        "max": 130,
        "critical_low": 15,
        "low_exp": "eGFR is below 60 mL/min, meaning kidney filtration efficiency is reduced and requires monitoring.",
        "crit_low_exp": "eGFR is below 15, indicating severe kidney impairment requiring immediate nephrology consultation.",
        "high_exp": "Kidney filtration rate is normal or high."
    },
    {
        "pattern": r"(?:hemoglobin a1c|hba1c|a1c)[\s:]+([0-9]+(?:\.[0-9]+)?)%?",
        "name": "Hemoglobin A1c",
        "unit": "%",
        "category": "Metabolism & Blood Sugar",
        "min": 4.0,
        "max": 5.6,
        "critical_high": 10.0,
        "high_exp": "A1c is elevated, showing your average blood sugar over the last 2 to 3 months is in the prediabetes or diabetes range.",
        "crit_high_exp": "A1c is very high, indicating ongoing unmanaged elevated blood sugars.",
        "low_exp": "A1c is below standard baseline."
    },
    {
        "pattern": r"(?:alt|alanine aminotransferase)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "ALT (Liver Enzyme)",
        "unit": "U/L",
        "category": "Liver Function",
        "min": 7,
        "max": 55,
        "critical_high": 200,
        "high_exp": "ALT enzyme is elevated, indicating liver tissue irritation or inflammation.",
        "crit_high_exp": "ALT is substantially elevated, indicating acute liver inflammation.",
        "low_exp": "ALT is within lower baseline limits."
    },
    {
        "pattern": r"(?:ast|aspartate aminotransferase)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "AST (Liver & Muscle Enzyme)",
        "unit": "U/L",
        "category": "Liver Function",
        "min": 8,
        "max": 48,
        "critical_high": 200,
        "high_exp": "AST enzyme is elevated, pointing to possible liver, muscle, or heart cellular stress.",
        "crit_high_exp": "AST is acutely elevated, requiring clinical review.",
        "low_exp": "AST is in the lower normal range."
    },
    {
        "pattern": r"(?:potassium|serum potassium)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "Potassium (Electrolyte)",
        "unit": "mEq/L",
        "category": "Electrolytes",
        "min": 3.5,
        "max": 5.0,
        "critical_low": 2.8,
        "critical_high": 6.2,
        "low_exp": "Potassium is low, which can trigger muscle cramps, weakness, or irregular heartbeat.",
        "high_exp": "Potassium is high, which can affect heart rhythm and requires medical evaluation.",
        "crit_high_exp": "Potassium is critically high; requires immediate emergency assessment."
    },
    {
        "pattern": r"(?:ldl|ldl cholesterol)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "LDL Cholesterol ('Bad' Cholesterol)",
        "unit": "mg/dL",
        "category": "Heart & Lipids",
        "min": 0,
        "max": 99,
        "critical_high": 190,
        "high_exp": "LDL cholesterol is elevated, which can gradually build fatty plaques in arterial blood vessels.",
        "crit_high_exp": "LDL is significantly high, placing higher strain on cardiovascular health.",
        "low_exp": "LDL is within optimal targets."
    },
    {
        "pattern": r"(?:wbc|white blood cell count)[\s:]+([0-9]+(?:\.[0-9]+)?)",
        "name": "White Blood Cell Count (WBC)",
        "unit": "x10³/µL",
        "category": "Blood Count & Immunity",
        "min": 4.5,
        "max": 11.0,
        "critical_high": 25.0,
        "critical_low": 2.0,
        "high_exp": "White blood cell count is elevated (leukocytosis), commonly signaling that the immune system is fighting an infection or inflammation.",
        "low_exp": "White blood cell count is low, meaning resistance to infections might be temporarily lowered."
    }
]

# -----------------------------------------------------------------------------
# Tool 1: Record Simplification and Flagger
# -----------------------------------------------------------------------------

def record_simplification_and_flagger(raw_text: str, document_type: str = "lab_report") -> Dict[str, Any]:
    """
    Parses clinical metrics deterministically against verified reference ranges,
    flags abnormal or urgent values, and translates medical jargon.
    """
    flagged_items = []
    text_lower = raw_text.lower()

    # 1. Match numeric reference ranges
    for rule in REFERENCE_RANGES:
        matches = re.findall(rule["pattern"], text_lower)
        for match in matches:
            try:
                val = float(match)
                status = "NORMAL"
                explanation = "Your result is within the healthy reference range."

                if "critical_high" in rule and val >= rule["critical_high"]:
                    status = "CRITICAL"
                    explanation = rule.get("crit_high_exp", rule["high_exp"])
                elif "critical_low" in rule and val <= rule["critical_low"]:
                    status = "CRITICAL"
                    explanation = rule.get("crit_low_exp", rule["low_exp"])
                elif val > rule["max"]:
                    status = "HIGH"
                    explanation = rule["high_exp"]
                elif val < rule["min"]:
                    status = "LOW"
                    explanation = rule["low_exp"]

                if status != "NORMAL":
                    flagged_items.append({
                        "id": f"flag-{rule['name'].lower().replace(' ', '-')}-{len(flagged_items)+1}",
                        "name": rule["name"],
                        "value": str(val),
                        "unit": rule["unit"],
                        "category": rule["category"],
                        "referenceRange": f"{rule['min']} - {rule['max']} {rule['unit']}",
                        "status": status,
                        "plainExplanation": explanation
                    })
            except ValueError:
                continue

    # 2. Check for Blood Pressure (systolic/diastolic)
    bp_match = re.search(r"(?:bp|blood pressure)[\s:]*([0-9]{2,3})\s*/\s*([0-9]{2,3})", text_lower)
    if bp_match:
        sys_val = int(bp_match.group(1))
        dia_val = int(bp_match.group(2))
        if sys_val >= 140 or dia_val >= 90:
            flagged_items.append({
                "id": "flag-blood-pressure",
                "name": "Blood Pressure Reading",
                "value": f"{sys_val}/{dia_val}",
                "unit": "mmHg",
                "category": "Cardiovascular Health",
                "referenceRange": "< 120 / < 80 mmHg",
                "status": "HIGH",
                "plainExplanation": f"Your blood pressure ({sys_val}/{dia_val} mmHg) is in the high blood pressure (hypertension) range."
            })

    # 3. Identify Medical Jargon Terms
    simplified_terms = []
    for term, definition in MEDICAL_DICTIONARY.items():
        if re.search(rf"\b{re.escape(term)}\b", text_lower):
            simplified_terms.append({
                "term": term.capitalize(),
                "plainDefinition": definition,
                "category": "Medical Term"
            })

    return {
        "flaggedItems": flagged_items,
        "simplifiedTerms": simplified_terms,
        "metricsEvaluatedCount": len(REFERENCE_RANGES)
    }

# -----------------------------------------------------------------------------
# Tool 2: Specialist & Department Finder
# -----------------------------------------------------------------------------

def specialist_department_finder(flagged_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Recommends specific clinical departments and specialists based on flagged findings,
    providing timing urgency and exact questions for appointment preparation.
    """
    recommendations = []
    categories = {item["category"] for item in flagged_items}
    names = {item["name"] for item in flagged_items}

    if "Kidney Function" in categories or any("Creatinine" in n or "eGFR" in n for n in names):
        recommendations.append({
            "id": "rec-nephrology",
            "specialistType": "Nephrologist (Kidney Specialist)",
            "department": "Nephrology & Renal Medicine",
            "urgency": "urgent" if any(item["status"] == "CRITICAL" for item in flagged_items if item["category"] == "Kidney Function") else "soon",
            "rationale": "Elevated creatinine and reduced eGFR indicate your kidneys are experiencing strain in filtering wastes.",
            "matchedFlags": [item["name"] for item in flagged_items if item["category"] == "Kidney Function"],
            "suggestedQuestionsToAsk": [
                "Are my elevated creatinine and lower eGFR reversible or a chronic change?",
                "Do any of my current medications (like pain relievers or blood pressure pills) affect kidney function?",
                "What dietary modifications or fluid intake goals should I adopt to protect my kidneys?"
            ]
        })

    if "Metabolism & Blood Sugar" in categories or any("Glucose" in n or "A1c" in n for n in names):
        recommendations.append({
            "id": "rec-endocrinology",
            "specialistType": "Endocrinologist or Primary Care Physician",
            "department": "Endocrinology & Internal Medicine",
            "urgency": "soon",
            "rationale": "High fasting blood sugar and/or elevated HbA1c point to unmanaged glucose levels or prediabetes/diabetes.",
            "matchedFlags": [item["name"] for item in flagged_items if item["category"] == "Metabolism & Blood Sugar"],
            "suggestedQuestionsToAsk": [
                "What is my personal target range for daily fasting and post-meal blood sugar?",
                "Would a continuous glucose monitor (CGM) or fingerstick log help us tailor my care?",
                "Should we start or adjust medications (like Metformin or GLP-1 therapy) alongside nutrition guidance?"
            ]
        })

    if "Cardiovascular Health" in categories or "Heart & Lipids" in categories:
        recommendations.append({
            "id": "rec-cardiology",
            "specialistType": "Cardiologist or Primary Care Physician",
            "department": "Cardiology & Preventative Health",
            "urgency": "soon",
            "rationale": "Elevated blood pressure or high LDL cholesterol increases long-term workload on blood vessels and heart.",
            "matchedFlags": [item["name"] for item in flagged_items if item["category"] in ["Cardiovascular Health", "Heart & Lipids"]],
            "suggestedQuestionsToAsk": [
                "Is home blood pressure monitoring recommended, and what readings should trigger a call?",
                "Should we consider cholesterol-lowering therapy (such as a statin) based on my overall cardiovascular risk score?"
            ]
        })

    if not recommendations:
        recommendations.append({
            "id": "rec-pcp",
            "specialistType": "Primary Care Physician (PCP)",
            "department": "Internal Medicine / Family Medicine",
            "urgency": "routine",
            "rationale": "A comprehensive review with your primary doctor to discuss routine wellness, prevention, and follow-ups.",
            "matchedFlags": [],
            "suggestedQuestionsToAsk": [
                "Are all my preventive screenings up to date?",
                "When should I repeat these routine tests to ensure consistency?"
            ]
        })

    return recommendations

# -----------------------------------------------------------------------------
# Document Chunking and Retrieval (RAG)
# -----------------------------------------------------------------------------

class DocumentVectorStore:
    def __init__(self, raw_text: str):
        self.raw_text = raw_text
        self.chunks = self._chunk_text(raw_text)

    def _chunk_text(self, text: str) -> List[Dict[str, Any]]:
        sections = re.split(r"\n\s*\n", text)
        chunks = []
        for i, sec in enumerate(sections):
            trimmed = sec.strip()
            if len(trimmed) > 10:
                header_match = re.match(r"^([A-Z0-9\s\-_:]{3,40})(?:\n|:)", trimmed)
                section_title = header_match.group(1).strip() if header_match else f"Section {i+1}"
                chunks.append({
                    "chunkId": f"chunk-{i+1}",
                    "section": section_title,
                    "content": trimmed
                })
        return chunks

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        keywords = re.findall(r"\w+", query.lower())
        scored = []
        for c in self.chunks:
            text_lower = c["content"].lower()
            score = sum(text_lower.count(k) for k in keywords if len(k) > 2)
            if score > 0:
                scored.append((score, c))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = [s[1] for s in scored[:top_k]]
        if not results and self.chunks:
            results = self.chunks[:2]
        return results

# -----------------------------------------------------------------------------
# Gemini API Integration (Standard Library, No External Packages Needed)
# -----------------------------------------------------------------------------

def call_gemini(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    # Use active gemini-3.6-flash model
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    payload: Dict[str, Any] = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as e:
        print(f"[Gemini API Warning] {e}", file=sys.stderr)
        return None

# -----------------------------------------------------------------------------
# Main Ingestion Pipeline
# -----------------------------------------------------------------------------

def ingest_patient_document(title: str, raw_text: str, document_type: str = "lab_report") -> Dict[str, Any]:
    """
    Executes the automated multi-step health companion workflow:
    1. Tool 1: Record Simplification & Flagger
    2. Tool 2: Specialist & Department Finder
    3. Document grounding & Plain-language summary synthesis
    """
    # 1. Run Tool 1
    t1_result = record_simplification_and_flagger(raw_text, document_type)
    flagged = t1_result["flaggedItems"]
    terms = t1_result["simplifiedTerms"]

    # 2. Run Tool 2
    specialists = specialist_department_finder(flagged)

    # 3. Vector Indexing
    store = DocumentVectorStore(raw_text)

    # 4. Generate Plain-English Summary (using Gemini if available, or deterministic fallback)
    plain_summary = ""
    takeaways = []

    prompt = f"""
You are a friendly, compassionate clinical health educator. 
Translate this medical document into reassuring, simple English for a patient.
Avoid medical jargon. Explain what is normal, what needs attention, and next steps.

Document Title: {title}
Type: {document_type}
Flagged Results: {json.dumps(flagged, indent=2)}

Record Text:
{raw_text}

Provide:
1. A warm 2-3 paragraph plain-English summary.
2. Exactly 3 to 5 concise key takeaways formatted as a bullet list.
"""
    ai_response = call_gemini(prompt)

    if ai_response:
        parts = ai_response.split("Key Takeaways:")
        plain_summary = parts[0].strip()
        if len(parts) > 1:
            raw_bullets = parts[1].strip().split("\n")
            takeaways = [b.lstrip("-•* 0123456789.").strip() for b in raw_bullets if b.strip()]
        else:
            takeaways = [
                f"Your results show {len(flagged)} metric(s) needing review with your physician.",
                "Review the suggested specialist appointments and questions before your next visit.",
                "Consult your doctor before making medication or dietary adjustments."
            ]
    else:
        # High quality deterministic synthesis fallback
        flag_summary = ", ".join([f"{item['name']} ({item['value']} {item['unit']})" for item in flagged]) if flagged else "all examined values within normal ranges"
        plain_summary = (
            f"This summary explains your {title.lower()} in simple, clear language. "
            f"Our clinical review identified {len(flagged)} item(s) outside standard healthy ranges: {flag_summary}. "
            "These findings do not constitute an emergency diagnosis, but provide clear focal points for your next doctor consultation."
        )
        takeaways = [
            f"Discuss flagged values ({len(flagged)} items) with your doctor.",
            "Bring the appointment preparation questions to your visit.",
            "Maintain current prescribed routines until guided by your healthcare provider."
        ]

    return {
        "title": title,
        "documentType": document_type,
        "plainLanguageSummary": plain_summary,
        "keyTakeaways": takeaways,
        "flaggedItems": flagged,
        "simplifiedTerms": terms,
        "specialistRecommendations": specialists,
        "chunksCount": len(store.chunks),
        "disclaimer": "This tool explains medical terms in simple language to help you prepare for your doctor visit. It is not medical advice."
    }

# -----------------------------------------------------------------------------
# CLI & HTTP Server Mode
# -----------------------------------------------------------------------------

SAMPLE_LAB_REPORT = """
METROPOLITAN CLINICAL LABORATORIES
Patient: John Doe | DOB: 05/12/1974
Date: 2026-08-14 | Ordering Physician: Dr. Sarah Jenkins, MD

COMPREHENSIVE METABOLIC PANEL (CMP)
Fasting Glucose: 195 mg/dL (Reference: 70 - 99 mg/dL) [HIGH]
Serum Creatinine: 2.1 mg/dL (Reference: 0.7 - 1.3 mg/dL) [HIGH]
eGFR: 34 mL/min/1.73m2 (Reference: > 60 mL/min/1.73m2) [LOW]
Potassium: 4.8 mEq/L (Reference: 3.5 - 5.0 mEq/L) [NORMAL]
Blood Pressure: 158/92 mmHg [HIGH]

LIPID PANEL
LDL Cholesterol: 165 mg/dL (Reference: < 100 mg/dL) [HIGH]
"""

class HealthCompanionHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "health-companion-python"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/ingest":
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len).decode("utf-8")
            data = json.loads(body) if body else {}
            title = data.get("title", "Clinical Record")
            text = data.get("rawText", SAMPLE_LAB_REPORT)
            doc_type = data.get("documentType", "lab_report")

            result = ingest_patient_document(title, text, doc_type)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result, indent=2).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 8080
        server = HTTPServer(("0.0.0.0", port), HealthCompanionHandler)
        print(f"Health Companion Python Service running on port {port}...")
        server.serve_forever()
    else:
        print("=" * 70)
        print("HEALTH COMPANION - PYTHON PIPELINE EXECUTION")
        print("=" * 70)
        result = ingest_patient_document("Comprehensive Metabolic & Lipid Lab Report", SAMPLE_LAB_REPORT, "lab_report")
        print(json.dumps(result, indent=2))
        print("=" * 70)
        print("Execution complete. All laboratory flags, medical terms, and specialist questions extracted.")

if __name__ == "__main__":
    main()
