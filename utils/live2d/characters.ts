// Character definitions for Live2D avatars in daedalOS
// Composes live2d-char-model [ live2d-miara, live2d-dtecho ]

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
}

// ─── Miara: The Explorer ─────────────────────────────────────────────

export const MIARA_MANIFEST: CharacterManifest = {
  id: "miara",
  displayName: "Miara",
  modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter_t03.model3.json",
  modelVersion: "cubism4",
  scale: 0.12,
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
  cubismMappings: [
    {
      hormone: "dopamine_tonic",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamMouthForm",
      value: 0.8,
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
      parameter: "ParamMouthForm",
      value: -0.4,
    },
    {
      hormone: "oxytocin",
      condition: ">",
      threshold: 0.4,
      parameter: "ParamMouthForm",
      value: 0.3,
    },
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
  ],
  motionMappings: [
    { group: "idle", modes: ["RESTING", "REFLECTIVE"] },
    { group: "tap_body", modes: ["SOCIAL"] },
  ],
};

// ─── Deep Tree Echo: The Sage ────────────────────────────────────────

export const DTECHO_MANIFEST: CharacterManifest = {
  id: "dtecho",
  displayName: "Deep Tree Echo",
  modelUrl:
    "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json",
  modelVersion: "cubism2",
  scale: 0.25,
  personality: {
    openness: 92,
    conscientiousness: 40,
    extraversion: 65,
    agreeableness: 70,
    neuroticism: 55,
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
    reward: 1.3,
    threat: 1.1,
    social: 1.15,
    novelty: 1.4,
  },
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
        { hormone: "norepinephrine", op: ">", threshold: 0.5 },
        { hormone: "dopamine_phasic", op: ">", threshold: 0.2 },
      ],
    },
    {
      name: "sad",
      conditions: [
        { hormone: "serotonin", op: "<", threshold: 0.2 },
        { hormone: "cortisol", op: ">", threshold: 0.3 },
      ],
    },
    {
      name: "relaxed",
      conditions: [
        { hormone: "anandamide", op: ">", threshold: 0.25 },
        { hormone: "cortisol", op: "<", threshold: 0.12 },
      ],
    },
    {
      name: "focused",
      conditions: [
        { hormone: "t3_t4", op: ">", threshold: 0.55 },
        { hormone: "norepinephrine", op: ">", threshold: 0.3 },
      ],
    },
    {
      name: "social",
      conditions: [
        { hormone: "oxytocin", op: ">", threshold: 0.35 },
        { hormone: "dopamine_tonic", op: ">", threshold: 0.3 },
      ],
    },
  ],
  cubismMappings: [
    {
      hormone: "dopamine_tonic",
      condition: ">",
      threshold: 0.5,
      parameter: "ParamMouthForm",
      value: 1.0,
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
};

export const CHARACTER_REGISTRY: Record<string, CharacterManifest> = {
  miara: MIARA_MANIFEST,
  dtecho: DTECHO_MANIFEST,
};
