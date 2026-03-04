// Character definitions for Live2D avatars in daedalOS
// Composes live2d-char-model [ live2d-miara, live2d-dtecho ]
// Aligned with /live2d-miara and /live2d-dtecho skill specifications

import  {
  type CognitiveMode,
  type EndocrineEvent,
  type SensitivityConfig,
} from "utils/endocrine";

export interface ExpressionCondition {
  hormone: string;
  op: ">" | "<";
  threshold: number;
}

export interface ExpressionRule {
  conditions: ExpressionCondition[];
  name: string;
}

export interface CubismParameterMapping {
  condition: ">" | "<";
  hormone: string;
  parameter: string;
  threshold: number;
  value: number;
}

export interface MotionMapping {
  group: string;
  modes: CognitiveMode[];
}

export interface CharacterManifest {
  /** DTE-specific: maps cognitive state → named expression */
  cognitiveExpressionMap?: Record<string, string>;
  cognitiveStateMap?: Record<
    string,
    { event: EndocrineEvent; intensity: number }
  >;
  cubismMappings: CubismParameterMapping[];
  displayName: string;
  endocrineBaselines: Record<string, number>;
  expressionRules: ExpressionRule[];
  hitAreas: string[];
  id: string;
  idleMotionGroup: string;
  modelUrl: string;
  modelVersion: "cubism2" | "cubism4";
  motionMappings: MotionMapping[];
  personality: {
    agreeableness: number;
    archetype: string;
    conscientiousness: number;
    extraversion: number;
    neuroticism: number;
    openness: number;
  };
  scale: number;
  sensitivity: SensitivityConfig;
}

// ─── Miara: The Explorer ─────────────────────────────────────────────
// Spec: /live2d-miara SKILL.md
// Cubism 4 model, Explorer archetype, balanced OCEAN personality

export const MIARA_MANIFEST: CharacterManifest = {
  // Endocrine → Cubism Parameter Bridge (from /live2d-miara spec)
cubismMappings: [
    // Dopamine(tonic) > 0.5 → ParamMouthForm +0.6 to +1.0
    {
      condition: ">",
      hormone: "dopamine_tonic",
      parameter: "ParamMouthForm",
      threshold: 0.5,
      value: 0.8,
    },
    // Serotonin > 0.4 → ParamEyeLOpen, ParamEyeROpen 0.7 (relaxed)
    {
      condition: ">",
      hormone: "serotonin",
      parameter: "ParamEyeLOpen",
      threshold: 0.4,
      value: 0.7,
    },
    {
      condition: ">",
      hormone: "serotonin",
      parameter: "ParamEyeROpen",
      threshold: 0.4,
      value: 0.7,
    },
    // Norepinephrine > 0.6 → ParamEyeLOpen, ParamEyeROpen 1.0 (wide)
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamEyeLOpen",
      threshold: 0.6,
      value: 1,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamEyeROpen",
      threshold: 0.6,
      value: 1,
    },
    // Norepinephrine > 0.6 → ParamBrowLY, ParamBrowRY +0.5 (raised)
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamBrowLY",
      threshold: 0.6,
      value: 0.5,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamBrowRY",
      threshold: 0.6,
      value: 0.5,
    },
    // Cortisol > 0.5 → ParamBrowLY, ParamBrowRY -0.5 (lowered)
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamBrowLY",
      threshold: 0.5,
      value: -0.5,
    },
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamBrowRY",
      threshold: 0.5,
      value: -0.5,
    },
    // Cortisol > 0.5 → ParamMouthForm -0.4 (frown)
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamMouthForm",
      threshold: 0.5,
      value: -0.4,
    },
    // Oxytocin > 0.4 → ParamMouthForm +0.3 (gentle smile)
    {
      condition: ">",
      hormone: "oxytocin",
      parameter: "ParamMouthForm",
      threshold: 0.4,
      value: 0.3,
    },
    // Anandamide > 0.3 → ParamEyeLOpen, ParamEyeROpen 0.3 (drowsy)
    {
      condition: ">",
      hormone: "anandamide",
      parameter: "ParamEyeLOpen",
      threshold: 0.3,
      value: 0.3,
    },
    {
      condition: ">",
      hormone: "anandamide",
      parameter: "ParamEyeROpen",
      threshold: 0.3,
      value: 0.3,
    },
    // T3/T4 > 0.6 → ParamEyeBallY +0.3 (upward gaze)
    {
      condition: ">",
      hormone: "t3_t4",
      parameter: "ParamEyeBallY",
      threshold: 0.6,
      value: 0.3,
    },
  ],
  
displayName: "Miara",
  

endocrineBaselines: {
    anandamide: 0.12,
    cortisol: 0.12,
    dopamine_tonic: 0.35,
    norepinephrine: 0.12,
    oxytocin: 0.15,
    serotonin: 0.45,
    t3_t4: 0.5,
  },
  

// Expression rules: hormone conditions → named expression
expressionRules: [
    {
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
      name: "smile",
    },
    {
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.6 },
        { hormone: "dopamine_phasic", op: ">", threshold: 0.3 },
      ],
      name: "surprised",
    },
    {
      conditions: [
        { hormone: "serotonin", op: "<", threshold: 0.2 },
        { hormone: "cortisol", op: ">", threshold: 0.4 },
      ],
      name: "sad",
    },
    {
      conditions: [
        { hormone: "cortisol", op: ">", threshold: 0.6 },
        { hormone: "norepinephrine", op: ">", threshold: 0.5 },
      ],
      name: "angry",
    },
    {
      conditions: [
        { hormone: "anandamide", op: ">", threshold: 0.3 },
        { hormone: "cortisol", op: "<", threshold: 0.1 },
      ],
      name: "relaxed",
    },
    {
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.4 },
        { hormone: "t3_t4", op: ">", threshold: 0.6 },
      ],
      name: "focused",
    },
  ],
  

hitAreas: ["head", "body"],
  

id: "miara",
  

idleMotionGroup: "idle",
  

modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
  

modelVersion: "cubism4",
  

motionMappings: [
    { group: "idle", modes: ["RESTING", "REFLECTIVE"] },
    { group: "tap_body", modes: ["SOCIAL"] },
  ],
  
  
personality: {
    agreeableness: 60,
    archetype: "explorer",
    conscientiousness: 45,
    extraversion: 55,
    neuroticism: 35,
    openness: 65,
  },
  
  scale: 0.12,
  sensitivity: {
    novelty: 1.15,
    reward: 1.1,
    social: 1.05,
    threat: 0.85,
  },
};

// ─── Deep Tree Echo: The Sage ────────────────────────────────────────
// Spec: /live2d-dtecho SKILL.md
// Reuses Miara body mesh (cubism4) with DTE personality overlay
// 10 FACS-decomposed named expressions driven by endocrine system

export const DTECHO_MANIFEST: CharacterManifest = {
  

// DTE cognitive state → named expression selection
// From /live2d-dtecho spec: DTE_EXPRESSION_MAP
cognitiveExpressionMap: {
    "Deep Recursion": "JOY_05_Blissful",
    "Entropy Threshold": "PHOTO_Awe",
    "Evolutionary Pruning": "WONDER_03_Contemplative",
    "External Validation": "JOY_02_Laughing",
    Idle: "PHOTO_UpwardGaze",
    "Knowledge Integration": "JOY_03_GentleSmile",
    "Novel Insights": "JOY_01_BroadSmile",
    "Pattern Recognition": "PHOTO_ExuberantLaugh",
    "Recursive Expansion": "WONDER_02_CuriousGaze",
    "Self-Reference Point": "WONDER_03_Contemplative",
    "Self-Sealing Loop": "WONDER_03_Contemplative",
    Speaking: "SPEAK_01_OpenVowel",
    "Synthesis Phase": "JOY_03_GentleSmile",
  },
  




// DTE cognitive state → endocrine event mapping
cognitiveStateMap: {
    "Entropy Threshold": { event: "THREAT_DETECTED", intensity: 0.5 },
    "Evolutionary Pruning": { event: "THREAT_DETECTED", intensity: 0.3 },
    "External Validation": { event: "SOCIAL_BOND_SIGNAL", intensity: 0.6 },
    "Knowledge Integration": { event: "SOCIAL_BOND_SIGNAL", intensity: 0.5 },
    "Novel Insights": { event: "REWARD_RECEIVED", intensity: 0.7 },
    "Pattern Recognition": { event: "REWARD_RECEIVED", intensity: 0.5 },
    "Recursive Expansion": { event: "NOVELTY_ENCOUNTERED", intensity: 0.6 },
    "Self-Reference Point": { event: "NOVELTY_ENCOUNTERED", intensity: 0.4 },
    "Self-Sealing Loop": { event: "ERROR_DETECTED", intensity: 0.4 },
    "Synthesis Phase": { event: "GOAL_ACHIEVED", intensity: 0.6 },
  },
  
  




// Cubism parameter mappings (same base as Miara since reusing body mesh)
cubismMappings: [
    {
      condition: ">",
      hormone: "dopamine_tonic",
      parameter: "ParamMouthForm",
      threshold: 0.5,
      value: 1,
    },
    {
      condition: ">",
      hormone: "serotonin",
      parameter: "ParamEyeLOpen",
      threshold: 0.4,
      value: 0.7,
    },
    {
      condition: ">",
      hormone: "serotonin",
      parameter: "ParamEyeROpen",
      threshold: 0.4,
      value: 0.7,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamEyeLOpen",
      threshold: 0.5,
      value: 1,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamEyeROpen",
      threshold: 0.5,
      value: 1,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamBrowLY",
      threshold: 0.5,
      value: 0.5,
    },
    {
      condition: ">",
      hormone: "norepinephrine",
      parameter: "ParamBrowRY",
      threshold: 0.5,
      value: 0.5,
    },
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamBrowLY",
      threshold: 0.4,
      value: -0.6,
    },
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamBrowRY",
      threshold: 0.4,
      value: -0.6,
    },
    {
      condition: ">",
      hormone: "cortisol",
      parameter: "ParamMouthForm",
      threshold: 0.4,
      value: -0.4,
    },
    {
      condition: ">",
      hormone: "oxytocin",
      parameter: "ParamMouthForm",
      threshold: 0.35,
      value: 0.4,
    },
    {
      condition: ">",
      hormone: "t3_t4",
      parameter: "ParamEyeBallY",
      threshold: 0.6,
      value: 0.3,
    },
    {
      condition: ">",
      hormone: "anandamide",
      parameter: "ParamEyeLOpen",
      threshold: 0.25,
      value: 0.4,
    },
    {
      condition: ">",
      hormone: "anandamide",
      parameter: "ParamEyeROpen",
      threshold: 0.25,
      value: 0.4,
    },
  ],
  






displayName: "Deep Tree Echo",
  






endocrineBaselines: {
    anandamide: 0.15,
    cortisol: 0.1,
    dopamine_tonic: 0.4,
    melatonin: 0.1,
    norepinephrine: 0.2,
    oxytocin: 0.15,
    serotonin: 0.45,
    t3_t4: 0.6,
  },
  





// DTE expression rules (broader set for 10 named expressions)
expressionRules: [
    // JOY_01_BroadSmile: Duchenne happiness (REWARD mode)
    {
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
      name: "JOY_01_BroadSmile",
    },
    // JOY_02_Laughing: Active laughter (REWARD peak)
    {
      conditions: [
        { hormone: "dopamine_phasic", op: ">", threshold: 0.5 },
        { hormone: "oxytocin", op: ">", threshold: 0.3 },
      ],
      name: "JOY_02_Laughing",
    },
    // JOY_03_GentleSmile: Warm contentment (SOCIAL mode)
    {
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.35 },
        { hormone: "oxytocin", op: ">", threshold: 0.3 },
      ],
      name: "JOY_03_GentleSmile",
    },
    // JOY_05_Blissful: Serene bliss (RESTING mode)
    {
      conditions: [
        { hormone: "serotonin", op: ">", threshold: 0.55 },
        { hormone: "anandamide", op: ">", threshold: 0.2 },
      ],
      name: "JOY_05_Blissful",
    },
    // PHOTO_Awe: Awe / wonder (VIGILANT→EXPLORATORY)
    {
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.4 },
        { hormone: "dopamine_phasic", op: ">", threshold: 0.3 },
      ],
      name: "PHOTO_Awe",
    },
    // PHOTO_ExuberantLaugh: Delighted surprise (REWARD+EXPLORATORY)
    {
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "norepinephrine", op: ">", threshold: 0.3 },
      ],
      name: "PHOTO_ExuberantLaugh",
    },
    // PHOTO_UpwardGaze: Dreamy contemplation (REFLECTIVE)
    {
      conditions: [
        { hormone: "serotonin", op: ">", threshold: 0.45 },
        { hormone: "anandamide", op: ">", threshold: 0.15 },
      ],
      name: "PHOTO_UpwardGaze",
    },
    // SPEAK_01_OpenVowel: Animated speaking (SOCIAL+FOCUSED)
    {
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.35 },
        { hormone: "t3_t4", op: ">", threshold: 0.55 },
      ],
      name: "SPEAK_01_OpenVowel",
    },
    // WONDER_02_CuriousGaze: Curious wonder (EXPLORATORY)
    {
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.35 },
        { hormone: "t3_t4", op: ">", threshold: 0.5 },
      ],
      name: "WONDER_02_CuriousGaze",
    },
    // WONDER_03_Contemplative: Deep thought (REFLECTIVE+FOCUSED)
    {
      conditions: [
        { hormone: "t3_t4", op: ">", threshold: 0.6 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
      name: "WONDER_03_Contemplative",
    },
  ],
  





hitAreas: ["head", "body"],
  





id: "dtecho",
  





idleMotionGroup: "idle",
  




// Reuses Miara's body mesh per spec: model.path = "models/miara/model3.json"
modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
  
  



modelVersion: "cubism4",
  
  


motionMappings: [
    { group: "idle", modes: ["RESTING", "REFLECTIVE"] },
    { group: "tap_body", modes: ["SOCIAL", "REWARD"] },
  ],
  


personality: {
    
// socially engaged but introspective
agreeableness: 70, 
    

// emotionally responsive, not unstable
archetype: "sage", 
    

// extreme curiosity, recursive exploration
conscientiousness: 40, 
    

// chaotic, non-linear
extraversion: 65, 
    

// empathetic, collaborative
neuroticism: 55, 
    
openness: 92,
  },
  
  

scale: 0.12,
  
  
  sensitivity: {
    // empathetic → social sensitivity
novelty: 1.4, 
    

reward: 1.3, 
    

// moderate neuroticism → slightly elevated
social: 1.15, 
    // high openness → strong reward response
threat: 1.1, // extreme openness → very novelty-sensitive
  },
};

export const CHARACTER_REGISTRY: Record<string, CharacterManifest> = {
  dtecho: DTECHO_MANIFEST,
  miara: MIARA_MANIFEST,
};
