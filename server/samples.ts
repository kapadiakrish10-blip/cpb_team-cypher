import { MedicalDocument } from '../src/types';

export const SAMPLE_DOCUMENTS: MedicalDocument[] = [
  {
    id: 'sample-lab-report',
    title: 'Comprehensive Metabolic & Lipid Lab Report',
    documentType: 'lab_report',
    encounterDate: '2026-08-14',
    patientNamePlaceholder: 'De-identified Patient #A-7492',
    rawText: `METROPOLITAN CLINICAL LABORATORIES
CLINICAL PATHOLOGY REPORT — DE-IDENTIFIED SPECIMEN #A-7492
Collection Date: 2026-08-14 07:30 AM | Fasting Status: YES (12 Hours)
Ordering Physician: Dr. Marcus Vance, MD | Requisition: REQ-88219

============================================================
SECTION 1: COMPREHENSIVE METABOLIC PANEL (CMP)
============================================================
Test Name                Patient Value    Standard Range      Unit        Status
--------------------------------------------------------------------------------
Fasting Blood Glucose:   188              70 - 99             mg/dL       [HIGH]
Serum Creatinine:        1.8              0.6 - 1.2           mg/dL       [HIGH]
eGFR (Non-African Amer): 52               > 60                mL/min      [LOW]
Blood Urea Nitrogen:     27               7 - 20              mg/dL       [HIGH]
Sodium (Na+):            139              135 - 145           mEq/L       NORMAL
Potassium (K+):          4.6              3.5 - 5.0           mEq/L       NORMAL
Chloride:                102              96 - 106            mEq/L       NORMAL
Carbon Dioxide (CO2):    24               22 - 29             mEq/L       NORMAL
Calcium:                 9.4              8.5 - 10.2          mg/dL       NORMAL
Total Protein:           7.1              6.0 - 8.3           g/dL        NORMAL
Serum Albumin:           4.0              3.5 - 5.0           g/dL        NORMAL
Total Bilirubin:         1.1              0.2 - 1.2           mg/dL       NORMAL
Alkaline Phosphatase:    88               44 - 147            U/L         NORMAL
AST (SGOT):              38               10 - 40             U/L         NORMAL
ALT (SGPT):              68               7 - 56              U/L         [HIGH]

============================================================
SECTION 2: GLYCATED HEMOGLOBIN & ENDOCRINE
============================================================
Test Name                Patient Value    Standard Range      Unit        Status
--------------------------------------------------------------------------------
Hemoglobin A1c (HbA1c):  8.6              4.0 - 5.6           %           [HIGH]
Estimated Average Glucose: 200            --                  mg/dL       ELEVATED
TSH (Thyroid):           2.4              0.4 - 4.5           uIU/mL      NORMAL

Clinical Note: HbA1c of 8.6% reflects sustained chronic hyperglycemia over the prior 90-day window.

============================================================
SECTION 3: LIPID PROFILE
============================================================
Test Name                Patient Value    Standard Range      Unit        Status
--------------------------------------------------------------------------------
Total Cholesterol:       228              100 - 199           mg/dL       [HIGH]
Triglycerides:           210              < 150               mg/dL       [HIGH]
HDL Cholesterol (Good):  38               > 40                mg/dL       [LOW]
LDL Cholesterol (Bad):   148              < 100               mg/dL       [HIGH]
Cholesterol / HDL Ratio: 6.0              < 5.0                           [HIGH]

============================================================
SECTION 4: COMPLETE BLOOD COUNT (CBC) WITH DIFFERENTIAL
============================================================
Test Name                Patient Value    Standard Range      Unit        Status
--------------------------------------------------------------------------------
White Blood Cell (WBC):  7.2              4.5 - 11.0          x10^3/uL    NORMAL
Red Blood Cell (RBC):    4.65             4.20 - 5.80         x10^6/uL    NORMAL
Hemoglobin:              14.2             13.0 - 17.5         g/dL        NORMAL
Hematocrit:              42.1             38.8 - 50.0         %           NORMAL
Platelets:               245              150 - 450           x10^3/uL    NORMAL
Neutrophils:             60.2             40.0 - 70.0         %           NORMAL

============================================================
LABORATORY DIRECTOR SUMMARY:
============================================================
Multiphasic profile notable for uncontrolled glycemic indices (elevated fasting glucose and HbA1c), mild hepatic transaminase irritation (elevated ALT), moderate dyslipidemia with atherogenic LDL predominance, and reduced renal filtration markers (elevated serum creatinine and reduced eGFR). Prompt outpatient clinical correlation recommended.`
  },
  {
    id: 'sample-discharge-summary',
    title: 'Hospital Discharge Summary — Laparoscopic Cholecystectomy',
    documentType: 'discharge_summary',
    encounterDate: '2026-09-02',
    patientNamePlaceholder: 'De-identified Patient #B-3108',
    rawText: `ST. JUDE REGIONAL MEDICAL CENTER
SURGICAL SERVICE DISCHARGE SUMMARY
Encounter ID: DIS-90312 | Attending Surgeon: Dr. Elena Rostova, MD, FACS
Admission Date: 2026-08-31 | Discharge Date: 2026-09-02

============================================================
HOSPITAL COURSE & PRIMARY PROCEDURE
============================================================
Primary Diagnosis: Acute symptomatic cholelithiasis with biliary colic.
Surgical Procedure: Uneventful elective Laparoscopic Cholecystectomy. Four sub-centimeter laparoscopic port sites closed with subcuticular Monocryl sutures and Dermabond skin adhesive.
Estimated Blood Loss: Minimal (< 25 mL).
Post-Operative Recovery: Patient tolerated clear liquids advancing to low-fat soft diet. Ambulating independently without syncope or ataxia. Voiding spontaneously without dysuria.

============================================================
DISCHARGE VITAL SIGNS
============================================================
Blood Pressure: 162/94 mmHg (Stage 2 Hypertension range at rest)
Heart Rate: 84 bpm (regular sinus rhythm)
Respiratory Rate: 16 breaths/min
Oxygen Saturation (SpO2): 96% on ambient room air
Temperature: 98.6 °F (afebrile)

============================================================
DISCHARGE MEDICATIONS & PHARMACY RECONCILIATION
============================================================
1. Acetaminophen 500 mg PO every 6 hours PRN mild-to-moderate pain.
2. Oxycodone 5 mg PO every 4 to 6 hours PRN severe breakthrough pain only (Dispense #12 tablets). Warning: May cause sedation, dizziness, and constipation. Do not drive or consume alcoholic beverages.
3. Docusate Sodium 100 mg PO BID to prevent opioid-induced constipation.
4. Lisinopril 20 mg PO daily in the morning for blood pressure.
5. Metformin 500 mg PO BID with meals. Resume home baseline.

============================================================
SURGICAL INCISION & WOUND CARE INSTRUCTIONS
============================================================
- Keep incision dressings clean and dry for the first 48 hours post-op.
- You may shower after 48 hours; gently pat the port incisions dry with a clean towel. Do not scrub or pick at Dermabond adhesive.
- Strict prohibition against tub baths, hot tubs, or swimming pools until cleared at post-op visit.
- Activity Restriction: Strictly avoid heavy lifting greater than 10 lbs (4.5 kg) for 4 weeks to prevent port-site incisional hernia dehiscence.

============================================================
RED FLAGS & WHEN TO SEEK IMMEDIATE EMERGENCY ATTENTION
============================================================
Contact the surgical clinic immediately or proceed to the Emergency Department if you experience any of the following:
- Body Temperature / Fever > 101.0 °F (38.3 °C) or persistent shaking chills.
- Spreading erythema (redness) greater than 1 inch around surgical incisions.
- Purulent (cloudy, thick yellow or green) drainage or active bleeding from wound edges.
- Uncontrolled abdominal distension, severe persistent emesis (vomiting), or inability to keep fluids down.
- Development of jaundice (yellowing of eyes or skin) or dark tea-colored urine.
- Sudden shortness of breath (dyspnea) or sharp pleuritic chest pain.

============================================================
SCHEDULED FOLLOW-UP APPOINTMENTS
============================================================
- General Surgery Post-Operative Clinic: 2 weeks (call 555-0192 to confirm).
- Primary Care Physician: Within 10-14 days for blood pressure re-evaluation and medication reconciliation.`
  },
  {
    id: 'sample-prescription-plan',
    title: 'Complex Multi-Drug Prescription & Titration Schedule',
    documentType: 'prescription',
    encounterDate: '2026-09-10',
    patientNamePlaceholder: 'De-identified Patient #C-1944',
    rawText: `HARBORVIEW HEALTH CLINIC — OUTPATIENT PHARMACY ORDERS
Patient ID: RX-449102 | Prescriber: Dr. Anthony Morales, MD (NPI: 1982736410)
Prescription Date: 2026-09-10 | Pharmacy Ref: PH-7712

============================================================
ACTIVE PRESCRIPTION DETAILS & INSTRUCTIONS
============================================================

1. METFORMIN HYDROCHLORIDE EXTENDED RELEASE
   Dose: 1000 mg Tablet
   Route: PO (By Mouth)
   Frequency: BID (Twice daily with morning and evening meals)
   Indication: Glycemic regulation / Type 2 Diabetes management.
   Special Instruction: Swallow whole with meals to minimize gastrointestinal discomfort.
   Safety Alert: If serum creatinine is elevated or eGFR is below 45 mL/min, dosage adjustment or temporary discontinuation is required.

2. LISINOPRIL
   Dose: 20 mg Tablet
   Route: PO (By Mouth)
   Frequency: Daily in the morning
   Indication: Essential hypertension and renal protective therapy.
   Special Instruction: Monitor home blood pressure weekly. Report any dry persistent cough, lightheadedness, or facial swelling immediately.

3. ATORVASTATIN CALCIUM
   Dose: 40 mg Tablet
   Route: PO (By Mouth)
   Frequency: QHS (Once daily at bedtime)
   Indication: Hyperlipidemia / Atherosclerotic cardiovascular disease prevention.
   Special Instruction: Avoid grapefruit or grapefruit juice, which can increase drug blood concentration. Report unexplained muscle soreness or dark urine.

4. OMEPRAZOLE DELAYED RELEASE
   Dose: 20 mg Capsule
   Route: PO (By Mouth)
   Frequency: Once daily 30 to 60 minutes prior to first meal of the day.
   Indication: Gastroesophageal reflux prophylaxis.

============================================================
DRUG-DRUG INTERACTION & OVER-THE-COUNTER CAUTIONS
============================================================
- CAUTION: Concurrent use of Over-The-Counter NSAIDs (such as Ibuprofen / Motrin / Advil or Naproxen / Aleve) with Lisinopril is strongly discouraged. Combining NSAIDs with ACE-inhibitors reduces blood pressure medication efficacy and markedly increases acute kidney injury risk.
- Use Acetaminophen (Tylenol) for mild aches or headaches unless contraindicated by liver function tests.
- DO NOT abruptly discontinue Lisinopril or Metformin without physician supervision.

============================================================
REQUIRED CLINICAL FOLLOW-UP & MONITORING SCHEDULE
============================================================
- Repeat Basic Metabolic Panel (BMP) and Potassium check in 4 weeks to evaluate kidney response to Lisinopril.
- Repeat Comprehensive Metabolic Panel & HbA1c in 90 days.
- Schedule Medication Therapy Management (MTM) consultation with clinical pharmacist if questions arise regarding dosing schedules.`
  }
];
