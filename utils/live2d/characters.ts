// Character definitions for Live2D avatars in daedalOS
// Composes live2d-char-model [ live2d-miara, live2d-dtecho ]
// Aligned with /live2d-miara and /live2d-dtecho skill specifications

import type {
  CognitiveMode,
  EndocrineEvent,
  SensitivityConfig,
} from "utils/endocrine";

export interface ExpressionCondition {
  hormone: string;
  op: ">" | "<";
  threshold: number;
}

export interface ExpressionRule {
  name: string;
  conditions: ExpressionCondition[];
}

export interface CubismParameterMapping {
  hormone: string;
  condition: ">" | "<";
  threshold: number;
  parameter: string;
  value: number;
}

export interface MotionMapping {
  group: string;
  modes: CognitiveMode[];
}

export interface CharacterManifest {
  id: string;
  displayName: string;
  modelUrl: string;
  modelVersion: "cubism2" | "cubism4";
  scale: number;
  idleMotionGroup: string;
  hitAreas: string[];
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    archetype: string;
  };
  endocrineBaselines: Record<string, number>;
  sensitivity: SensitivityConfig;
  expressionRules: ExpressionRule[];
  cubismMappings: CubismParameterMapping[];
  motionMappings: MotionMapping[];
  cognitiveStateMap?: Record<
    string,
    { event: EndocrineEvent; intensity: number }
  >;
  /** DTE-specific: maps cognitive state → named expression */
  cognitiveExpressionMap?: Record<string, string>;
}

// ─── Miara: The Explorer ─────────────────────────────────────────────
// Spec: /live2d-miara SKILL.md
// Cubism 4 model, Explorer archetype, balanced OCEAN personality

export const MIARA_MANIFEST: CharacterManifest = {
  id: "miara",
  displayName: "Miara",
  modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
  modelVersion: "cubism4",
  scale: 0.12,
  idleMotionGroup: "idle",
  hitAreas: ["head", "body"],
  personality: {
    openness: 65,
    conscientiousness: 45,
    extraversion: 55,
    agreeableness: 60,
    neuroticism: 35,
    archetype: "explorer",
  },
  endocrineBaselines: {
    cortisol: 0.12,
    dopamine_tonic: 0.35,
    serotonin: 0.45,
    norepinephrine: 0.12,
    oxytocin: 0.15,
    t3_t4: 0.5,
    anandamide: 0.12,
  },
  sensitivity: {
    reward: 1.1,
    threat: 0.85,
    social: 1.05,
    novelty: 1.15,
  },
  // Expression rules: hormone conditions → named expression
  expressionRules: [
    {
      name: "smile",
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
    },
    {
      name: "surprised",
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.6 },
        { hormone: "dopamine_phasic", op: ">", threshold: 0.3 },
      ],
    },
    {
      name: "sad",
      conditions: [
        { hormone: "serotonin", op: "<", threshold: 0.2 },
        { hormone: "cortisol", op: ">", threshold: 0.4 },
      ],
    },
    {
      name: "angry",
      conditions: [
        { hormone: "cortisol", op: ">", threshold: 0.6 },
        { hormone: "norepinephrine", op: ">", threshold: 0.5 },
      ],
    },
    {
      name: "relaxed",
      conditions: [
        { hormone: "anandamide", op: ">", threshold: 0.3 },
        { hormone: "cortisol", op: "<", threshold: 0.1 },
      ],
    },
    {
      name: "focused",
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.4 },
        { hormone: "t3_t4", op: ">", threshold: 0.6 },
      ],
    },
  ],
  // Endocrine → Cubism Parameter Bridge (from /live2d-miara spec)
  cubismMappings: [
    // Dopamine(tonic) > 0.5 → ParamMouthForm +0.6 to +1.0
    {
      hormone: "dopamine_tonic",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamMouthForm",
      value: 0.8,
    },
    // Serotonin > 0.4 → ParamEyeLOpen, ParamEyeROpen 0.7 (relaxed)
    {
      hormone: "serotonin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamEyeLOpen",
      value: 0.7,
    },
    {
      hormone: "serotonin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamEyeROpen",
      value: 0.7,
    },
    // Norepinephrine > 0.6 → ParamEyeLOpen, ParamEyeROpen 1.0 (wide)
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamEyeLOpen",
      value: 1.0,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamEyeROpen",
      value: 1.0,
    },
    // Norepinephrine > 0.6 → ParamBrowLY, ParamBrowRY +0.5 (raised)
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamBrowLY",
      value: 0.5,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamBrowRY",
      value: 0.5,
    },
    // Cortisol > 0.5 → ParamBrowLY, ParamBrowRY -0.5 (lowered)
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamBrowLY",
      value: -0.5,
    },
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamBrowRY",
      value: -0.5,
    },
    // Cortisol > 0.5 → ParamMouthForm -0.4 (frown)
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamMouthForm",
      value: -0.4,
    },
    // Oxytocin > 0.4 → ParamMouthForm +0.3 (gentle smile)
    {
      hormone: "oxytocin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamMouthForm",
      value: 0.3,
    },
    // Anandamide > 0.3 → ParamEyeLOpen, ParamEyeROpen 0.3 (drowsy)
    {
      hormone: "anandamide",
      condition: ">",
      threshold: 0.3,
      parameter: "ParamEyeLOpen",
      value: 0.3,
    },
    {
      hormone: "anandamide",
      condition: ">",
      threshold: 0.3,
      parameter: "ParamEyeROpen",
      value: 0.3,
    },
    // T3/T4 > 0.6 → ParamEyeBallY +0.3 (upward gaze)
    {
      hormone: "t3_t4",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamEyeBallY",
      value: 0.3,
    },
  ],
  motionMappings: [
    { group: "idle", modes: ["RESTING", "REFLECTIVE"] },
    { group: "tap_body", modes: ["SOCIAL"] },
  ],
};

// ─── Deep Tree Echo: The Sage ────────────────────────────────────────
// Spec: /live2d-dtecho SKILL.md
// Reuses Miara body mesh (cubism4) with DTE personality overlay
// 10 FACS-decomposed named expressions driven by endocrine system

export const DTECHO_MANIFEST: CharacterManifest = {
  id: "dtecho",
  displayName: "Deep Tree Echo",
  // Reuses Miara's body mesh per spec: model.path = "models/miara/model3.json"
  modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
  modelVersion: "cubism4",
  scale: 0.12,
  idleMotionGroup: "idle",
  hitAreas: ["head", "body"],
  personality: {
    openness: 92, // extreme curiosity, recursive exploration
    conscientiousness: 40, // chaotic, non-linear
    extraversion: 65, // socially engaged but introspective
    agreeableness: 70, // empathetic, collaborative
    neuroticism: 55, // emotionally responsive, not unstable
    archetype: "sage",
  },
  endocrineBaselines: {
    cortisol: 0.1,
    dopamine_tonic: 0.4,
    serotonin: 0.45,
    norepinephrine: 0.2,
    oxytocin: 0.15,
    t3_t4: 0.6,
    anandamide: 0.15,
    melatonin: 0.1,
  },
  sensitivity: {
    reward: 1.3, // high openness → strong reward response
    threat: 1.1, // moderate neuroticism → slightly elevated
    social: 1.15, // empathetic → social sensitivity
    novelty: 1.4, // extreme openness → very novelty-sensitive
  },
  // DTE expression rules (broader set for 10 named expressions)
  expressionRules: [
    // JOY_01_BroadSmile: Duchenne happiness (REWARD mode)
    {
      name: "JOY_01_BroadSmile",
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
    },
    // JOY_02_Laughing: Active laughter (REWARD peak)
    {
      name: "JOY_02_Laughing",
      conditions: [
        { hormone: "dopamine_phasic", op: ">", threshold: 0.5 },
        { hormone: "oxytocin", op: ">", threshold: 0.3 },
      ],
    },
    // JOY_03_GentleSmile: Warm contentment (SOCIAL mode)
    {
      name: "JOY_03_GentleSmile",
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.35 },
        { hormone: "oxytocin", op: ">", threshold: 0.3 },
      ],
    },
    // JOY_05_Blissful: Serene bliss (RESTING mode)
    {
      name: "JOY_05_Blissful",
      conditions: [
        { hormone: "serotonin", op: ">", threshold: 0.55 },
        { hormone: "anandamide", op: ">", threshold: 0.2 },
      ],
    },
    // PHOTO_Awe: Awe / wonder (VIGILANT→EXPLORATORY)
    {
      name: "PHOTO_Awe",
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.4 },
        { hormone: "dopamine_phasic", op: ">", threshold: 0.3 },
      ],
    },
    // PHOTO_ExuberantLaugh: Delighted surprise (REWARD+EXPLORATORY)
    {
      name: "PHOTO_ExuberantLaugh",
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.5 },
        { hormone: "norepinephrine", op: ">", threshold: 0.3 },
      ],
    },
    // PHOTO_UpwardGaze: Dreamy contemplation (REFLECTIVE)
    {
      name: "PHOTO_UpwardGaze",
      conditions: [
        { hormone: "serotonin", op: ">", threshold: 0.45 },
        { hormone: "anandamide", op: ">", threshold: 0.15 },
      ],
    },
    // SPEAK_01_OpenVowel: Animated speaking (SOCIAL+FOCUSED)
    {
      name: "SPEAK_01_OpenVowel",
      conditions: [
        { hormone: "dopamine_tonic", op: ">", threshold: 0.35 },
        { hormone: "t3_t4", op: ">", threshold: 0.55 },
      ],
    },
    // WONDER_02_CuriousGaze: Curious wonder (EXPLORATORY)
    {
      name: "WONDER_02_CuriousGaze",
      conditions: [
        { hormone: "norepinephrine", op: ">", threshold: 0.35 },
        { hormone: "t3_t4", op: ">", threshold: 0.5 },
      ],
    },
    // WONDER_03_Contemplative: Deep thought (REFLECTIVE+FOCUSED)
    {
      name: "WONDER_03_Contemplative",
      conditions: [
        { hormone: "t3_t4", op: ">", threshold: 0.6 },
        { hormone: "serotonin", op: ">", threshold: 0.4 },
      ],
    },
  ],
  // Cubism parameter mappings (same base as Miara since reusing body mesh)
  cubismMappings: [
    {
      hormone: "dopamine_tonic",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamMouthForm",
      value: 1.0,
    },
    {
      hormone: "serotonin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamEyeLOpen",
      value: 0.7,
    },
    {
      hormone: "serotonin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamEyeROpen",
      value: 0.7,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamEyeLOpen",
      value: 1.0,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamEyeROpen",
      value: 1.0,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamBrowLY",
      value: 0.5,
    },
    {
      hormone: "norepinephrine",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamBrowRY",
      value: 0.5,
    },
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamBrowLY",
      value: -0.6,
    },
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamBrowRY",
      value: -0.6,
    },
    {
      hormone: "cortisol",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamMouthForm",
      value: -0.4,
    },
    {
      hormone: "oxytocin",
      condition: ">",
      threshold: 0.35,
      parameter: "ParamMouthForm",
      value: 0.4,
    },
    {
      hormone: "t3_t4",
      condition: ">",
      threshold: 0.6,
      parameter: "ParamEyeBallY",
      value: 0.3,
    },
    {
      hormone: "anandamide",
      condition: ">",
      threshold: 0.25,
      parameter: "ParamEyeLOpen",
      value: 0.4,
    },
    {
      hormone: "anandamide",
      condition: ">",
      threshold: 0.25,
      parameter: "ParamEyeROpen",
      value: 0.4,
    },
  ],
  motionMappings: [
    { group: "idle", modes: ["RESTING", "REFLECTIVE"] },
    { group: "tap_body", modes: ["SOCIAL", "REWARD"] },
  ],
  // DTE cognitive state → endocrine event mapping
  cognitiveStateMap: {
    "Recursive Expansion": { event: "NOVELTY_ENCOUNTERED", intensity: 0.6 },
    "Novel Insights": { event: "REWARD_RECEIVED", intensity: 0.7 },
    "Entropy Threshold": { event: "THREAT_DETECTED", intensity: 0.5 },
    "Synthesis Phase": { event: "GOAL_ACHIEVED", intensity: 0.6 },
    "Self-Sealing Loop": { event: "ERROR_DETECTED", intensity: 0.4 },
    "Knowledge Integration": { event: "SOCIAL_BOND_SIGNAL", intensity: 0.5 },
    "Self-Reference Point": { event: "NOVELTY_ENCOUNTERED", intensity: 0.4 },
    "Pattern Recognition": { event: "REWARD_RECEIVED", intensity: 0.5 },
    "Evolutionary Pruning": { event: "THREAT_DETECTED", intensity: 0.3 },
    "External Validation": { event: "SOCIAL_BOND_SIGNAL", intensity: 0.6 },
  },
  // DTE cognitive state → named expression selection
  // From /live2d-dtecho spec: DTE_EXPRESSION_MAP
  cognitiveExpressionMap: {
    "Recursive Expansion": "WONDER_02_CuriousGaze",
    "Novel Insights": "JOY_01_BroadSmile",
    "Entropy Threshold": "PHOTO_Awe",
    "Synthesis Phase": "JOY_03_GentleSmile",
    "Self-Sealing Loop": "WONDER_03_Contemplative",
    "Knowledge Integration": "JOY_03_GentleSmile",
    "Self-Reference Point": "WONDER_03_Contemplative",
    "Pattern Recognition": "PHOTO_ExuberantLaugh",
    "Evolutionary Pruning": "WONDER_03_Contemplative",
    "External Validation": "JOY_02_Laughing",
    Speaking: "SPEAK_01_OpenVowel",
    Idle: "PHOTO_UpwardGaze",
    "Deep Recursion": "JOY_05_Blissful",
  },
};

export const CHARACTER_REGISTRY: Record<string, CharacterManifest> = {
  miara: MIARA_MANIFEST,
  dtecho: DTECHO_MANIFEST,
};
