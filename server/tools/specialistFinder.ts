import { FlaggedItem, SpecialistRecommendation, UrgencyLevel } from '../../src/types';

/**
 * @tool specialist_department_finder
 * 
 * DESCRIPTION:
 * Takes the flagged abnormal values, out-of-range lab findings, and clinical red flags
 * surfaced by the simplification & flagging tool, and deterministically maps them using
 * a clinical routing lookup table to the appropriate medical specialist and hospital department.
 * 
 * PARAMETERS:
 * - flaggedItems (FlaggedItem[]): The list of flagged items identified in the patient record.
 * 
 * RETURNS:
 * An array of SpecialistRecommendation objects containing:
 * - specialistType: The title of the doctor (e.g., Endocrinologist, Nephrologist, Cardiologist).
 * - department: The hospital or clinical division to contact.
 * - urgency: 'routine' | 'soon' | 'urgent' | 'immediate'.
 * - matchedFlags: Which specific abnormal flags triggered this referral.
 * - rationale: Clear patient-accessible medical reasoning for why this specialist is recommended.
 * - suggestedQuestionsToAsk: Actionable questions the patient can ask during their visit.
 */

interface SpecialistRoutingRule {
  specialistType: string;
  department: string;
  triggerCategories: string[];
  triggerKeywords: string[];
  defaultUrgency: UrgencyLevel;
  rationaleTemplate: string;
  questionsTemplate: string[];
}

const SPECIALIST_ROUTING_TABLE: SpecialistRoutingRule[] = [
  {
    specialistType: 'Endocrinologist',
    department: 'Department of Endocrinology, Diabetes & Metabolism',
    triggerCategories: ['Metabolic & Blood Sugar', 'Thyroid & Endocrine'],
    triggerKeywords: ['glucose', 'hba1c', 'hemoglobin a1c', 'tsh', 'thyroid', 'hyperglycemia'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Your blood sugar markers (HbA1c / fasting glucose) or thyroid metrics are outside target ranges. An endocrinologist specializes in hormonal regulation, diabetes management, and metabolic health optimization.',
    questionsTemplate: [
      'What is my personalized target HbA1c and daily fasting glucose range?',
      'Do you recommend adjusting my current diet, exercise regimen, or oral medications?',
      'How frequently should we re-check my metabolic panel to track improvement?'
    ]
  },
  {
    specialistType: 'Nephrologist',
    department: 'Department of Nephrology & Kidney Health',
    triggerCategories: ['Kidney Health'],
    triggerKeywords: ['creatinine', 'egfr', 'bun', 'filtration rate', 'proteinuria'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Your kidney filtration indicators (creatinine and/or eGFR) show reduced waste filtration or increased strain. A nephrologist specializes in preserving kidney function and preventing progressive renal decline.',
    questionsTemplate: [
      'What stage of kidney function does my eGFR score represent, and is it reversible?',
      'Are any of my current medications (like blood pressure drugs or NSAID pain relievers) straining my kidneys?',
      'What dietary changes (hydration, protein, sodium, or potassium intake) should I follow?'
    ]
  },
  {
    specialistType: 'Cardiologist',
    department: 'Department of Cardiovascular Medicine & Preventive Cardiology',
    triggerCategories: ['Cardiovascular & Lipids', 'Vital Signs'],
    triggerKeywords: ['cholesterol', 'ldl', 'triglycerides', 'blood pressure', 'hypertension', 'troponin', 'bp'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Elevated blood pressure and/or lipid levels (LDL cholesterol, triglycerides) accelerate plaque accumulation inside arterial walls. A cardiologist evaluates cardiovascular risk and adjusts blood pressure or lipid-lowering therapies.',
    questionsTemplate: [
      'What is my overall 10-year cardiovascular risk score based on my numbers?',
      'Is my current blood pressure target adequately controlled, or should medication be adjusted?',
      'Would you recommend initiating or optimizing a statin for my cholesterol?'
    ]
  },
  {
    specialistType: 'Gastroenterologist / Hepatologist',
    department: 'Digestive Health & Liver Disease Center',
    triggerCategories: ['Liver Function', 'Liver & Bile Health'],
    triggerKeywords: ['alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'sgpt', 'sgot', 'jaundice'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Your liver enzymes (ALT/AST) or bilirubin are above standard reference limits. A hepatologist or gastroenterologist assesses hepatic inflammation, fatty liver changes, or gallbladder/bile duct pathways.',
    questionsTemplate: [
      'What is the most likely cause of my elevated liver enzymes (medications, fatty liver, or metabolic factors)?',
      'Do I need an abdominal ultrasound or further liver imaging?',
      'Are there specific over-the-counter medications, alcohol, or supplements I should strictly avoid?'
    ]
  },
  {
    specialistType: 'Attending Surgeon / Surgical Wound Clinic',
    department: 'Department of General Surgery / Post-Operative Care Clinic',
    triggerCategories: ['Surgical / Wound Care', 'Post-Op / Infection Signs'],
    triggerKeywords: ['incision', 'wound', 'purulent', 'drainage', 'dehiscence', 'fever', 'temperature', 'cholecystectomy'],
    defaultUrgency: 'urgent',
    rationaleTemplate: 'Post-operative symptoms such as fever, persistent pain, or abnormal incision drainage warrant direct evaluation by your surgical team to rule out surgical site infections or localized wound healing issues.',
    questionsTemplate: [
      'Is my incision healing as expected for this post-operative timeframe?',
      'Are the current symptoms indicative of an early infection needing antibiotic therapy?',
      'When can I safely resume lifting, bathing, and standard physical activities?'
    ]
  },
  {
    specialistType: 'Pulmonologist',
    department: 'Department of Pulmonary & Respiratory Medicine',
    triggerCategories: ['Pulmonary / Respiratory'],
    triggerKeywords: ['spo2', 'oxygen', 'dyspnea', 'shortness of breath', 'hypoxemia'],
    defaultUrgency: 'urgent',
    rationaleTemplate: 'Your blood oxygen saturation (SpO2) fell below the standard 95% threshold. A pulmonologist evaluates gas exchange, airway inflammation, and respiratory function.',
    questionsTemplate: [
      'Is my oxygen desaturation situational or persistent across rest and activity?',
      'Do I need pulmonary function testing or a chest X-ray?',
      'Are there inhalers or breathing exercises that can help keep my airways open?'
    ]
  },
  {
    specialistType: 'Hematologist',
    department: 'Center for Hematology & Blood Disorders',
    triggerCategories: ['Complete Blood Count (CBC)'],
    triggerKeywords: ['wbc', 'white blood cell', 'hemoglobin', 'platelets', 'plt', 'thrombocytopenia', 'leukocytosis'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Your blood cell counts (white blood cells, hemoglobin, or platelets) deviated from normal baselines. A hematologist evaluates bone marrow production and immune or clotting parameters.',
    questionsTemplate: [
      'Is my abnormal blood count related to an acute infection, nutritional deficiency, or an ongoing condition?',
      'Are my platelets high or low enough to affect clotting or increase bruising?',
      'When should a follow-up Complete Blood Count be drawn?'
    ]
  },
  {
    specialistType: 'Clinical Pharmacist / Primary Care Physician',
    department: 'Department of Internal Medicine / Medication Therapy Management (MTM)',
    triggerCategories: ['Prescription & Drug Safety'],
    triggerKeywords: ['nsaid', 'interaction', 'caution', 'metformin', 'opioid', 'lisinopril', 'titrate'],
    defaultUrgency: 'soon',
    rationaleTemplate: 'Potential medication interactions, dosage precautions related to organ function, or controlled pain medication regimens were flagged. A comprehensive medication reconciliation ensures safe drug combinations.',
    questionsTemplate: [
      'Can you review all my prescribed medications alongside my over-the-counter supplements for interactions?',
      'Should any of my doses be adjusted in light of my recent lab findings (e.g. kidney or liver levels)?',
      'What is the planned timeline to taper or discontinue temporary post-acute medications?'
    ]
  },
  {
    specialistType: 'Emergency Department / Urgent Care Physician',
    department: 'Emergency Medicine & Acute Care',
    triggerCategories: ['Critical Alert'],
    triggerKeywords: ['crisis', 'critical', 'severe chest pain', 'syncope'],
    defaultUrgency: 'immediate',
    rationaleTemplate: 'A critical vital sign or severe acute marker was identified. Immediate medical evaluation in an emergency or urgent care setting is required to protect against acute complications.',
    questionsTemplate: [
      'What immediate stabilization or diagnostic tests are required right now?',
      'Are there acute interventions needed before I return home?'
    ]
  }
];

/**
 * Deterministic Specialist & Department Finder
 * Maps flagged medical items to specialist recommendations using rule-based lookup.
 */
export function specialistDepartmentFinder(
  flaggedItems: FlaggedItem[]
): SpecialistRecommendation[] {
  if (!flaggedItems || flaggedItems.length === 0) {
    return [
      {
        id: 'spec-pcp-routine',
        specialistType: 'Primary Care Physician (PCP)',
        department: 'Department of Family & Internal Medicine',
        urgency: 'routine',
        matchedFlags: ['Standard Wellness Review'],
        rationale: 'No acute abnormal flags or critical out-of-range markers were detected. Maintain your routine preventive health visits with your primary doctor.',
        suggestedQuestionsToAsk: [
          'Are there any age-appropriate preventive screenings or vaccine boosters I am due for?',
          'How frequently should we repeat routine baseline lab tests?'
        ]
      }
    ];
  }

  const recommendations: SpecialistRecommendation[] = [];
  const assignedSpecialists = new Set<string>();

  for (const rule of SPECIALIST_ROUTING_TABLE) {
    const matchedFlags: string[] = [];
    let hasCritical = false;
    let hasHigh = false;

    for (const flag of flaggedItems) {
      const flagNameLower = (flag.name || '').toLowerCase();
      const flagCategoryLower = (flag.category || '').toLowerCase();
      const flagExpLower = (flag.plainExplanation || '').toLowerCase();

      // Check if category matches
      const categoryMatch = rule.triggerCategories.some((cat) =>
        flagCategoryLower.includes(cat.toLowerCase())
      );

      // Check if keywords match
      const keywordMatch = rule.triggerKeywords.some((kw) =>
        flagNameLower.includes(kw) || flagExpLower.includes(kw)
      );

      if (categoryMatch || keywordMatch) {
        matchedFlags.push(`${flag.name} (${flag.value} ${flag.unit || ''} [${flag.status}])`);
        if (flag.severity === 'critical') hasCritical = true;
        if (flag.severity === 'high') hasHigh = true;
      }
    }

    if (matchedFlags.length > 0 && !assignedSpecialists.has(rule.specialistType)) {
      assignedSpecialists.add(rule.specialistType);

      // Compute urgency dynamically based on severity of matching flags
      let urgency: UrgencyLevel = rule.defaultUrgency;
      if (hasCritical) {
        urgency = 'immediate';
      } else if (hasHigh && urgency === 'routine') {
        urgency = 'soon';
      }

      recommendations.push({
        id: `spec-${rule.specialistType.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        specialistType: rule.specialistType,
        department: rule.department,
        urgency,
        matchedFlags,
        rationale: rule.rationaleTemplate,
        suggestedQuestionsToAsk: rule.questionsTemplate
      });
    }
  }

  // If some flags didn't match any specific subspecialty, default to PCP
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'spec-pcp-followup',
      specialistType: 'Primary Care Physician (PCP)',
      department: 'Department of Internal Medicine',
      urgency: 'soon',
      matchedFlags: flaggedItems.map((f) => f.name),
      rationale: 'Reviewing these findings with your primary doctor will help determine if further diagnostic tests or lifestyle interventions are recommended.',
      suggestedQuestionsToAsk: [
        'How do these results compare with my previous baseline labs?',
        'What steps can we take over the next 3 to 6 months to guide these numbers back into target ranges?'
      ]
    });
  }

  // Sort by urgency: immediate first, then urgent, then soon, then routine
  const urgencyWeight: Record<UrgencyLevel, number> = {
    immediate: 4,
    urgent: 3,
    soon: 2,
    routine: 1
  };
  recommendations.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);

  return recommendations;
}
