// Virtual Endocrine System — 16-channel hormone bus with 10 virtual glands
// Biologically-inspired emotional architecture for cognitive avatars

export type HormoneId =
  | "crh"
  | "acth"
  | "cortisol"
  | "dopamine_tonic"
  | "dopamine_phasic"
  | "serotonin"
  | "norepinephrine"
  | "oxytocin"
  | "t3_t4"
  | "melatonin"
  | "insulin"
  | "glucagon"
  | "il6"
  | "anandamide"
  | "reserved_14"
  | "reserved_15";

export type CognitiveMode =
  | "RESTING"
  | "EXPLORATORY"
  | "FOCUSED"
  | "STRESSED"
  | "SOCIAL"
  | "REFLECTIVE"
  | "VIGILANT"
  | "MAINTENANCE"
  | "REWARD"
  | "THREAT";

export type EndocrineEvent =
  | "THREAT_DETECTED"
  | "CONFLICT_DETECTED"
  | "REWARD_RECEIVED"
  | "GOAL_ACHIEVED"
  | "NOVELTY_ENCOUNTERED"
  | "SOCIAL_BOND_SIGNAL"
  | "LIGHT_SIGNAL"
  | "RESOURCE_DEPLETED"
  | "ERROR_DETECTED"
  | "NOISE_EXCESSIVE";

export interface HormoneConfig {
  halfLife: number;
  baseline: number;
}

export interface EndocrineState {
  concentrations: Record<string, number>;
}

export interface SensitivityConfig {
  reward: number;
  threat: number;
  social: number;
  novelty: number;
}

const DEFAULT_HORMONE_CONFIG: Record<HormoneId, HormoneConfig> = {
  crh: { halfLife: 5, baseline: 0.05 },
  acth: { halfLife: 10, baseline: 0.05 },
  cortisol: { halfLife: 30, baseline: 0.15 },
  dopamine_tonic: { halfLife: 20, baseline: 0.3 },
  dopamine_phasic: { halfLife: 3, baseline: 0.0 },
  serotonin: { halfLife: 50, baseline: 0.4 },
  norepinephrine: { halfLife: 8, baseline: 0.1 },
  oxytocin: { halfLife: 15, baseline: 0.1 },
  t3_t4: { halfLife: 100, baseline: 0.5 },
  melatonin: { halfLife: 12, baseline: 0.0 },
  insulin: { halfLife: 10, baseline: 0.2 },
  glucagon: { halfLife: 8, baseline: 0.1 },
  il6: { halfLife: 20, baseline: 0.05 },
  anandamide: { halfLife: 6, baseline: 0.1 },
  reserved_14: { halfLife: 10, baseline: 0.0 },
  reserved_15: { halfLife: 10, baseline: 0.0 },
};

const HORMONE_IDS: HormoneId[] = [
  "crh",
  "acth",
  "cortisol",
  "dopamine_tonic",
  "dopamine_phasic",
  "serotonin",
  "norepinephrine",
  "oxytocin",
  "t3_t4",
  "melatonin",
  "insulin",
  "glucagon",
  "il6",
  "anandamide",
  "reserved_14",
  "reserved_15",
];

// Cognitive mode centroids in 16D hormone space (simplified to key hormones)
const MODE_CENTROIDS: Record<
  CognitiveMode,
  Partial<Record<HormoneId, number>>
> = {
  RESTING: { cortisol: 0.1, serotonin: 0.5, anandamide: 0.3 },
  EXPLORATORY: {
    norepinephrine: 0.4,
    dopamine_phasic: 0.3,
    t3_t4: 0.6,
  },
  FOCUSED: { norepinephrine: 0.4, t3_t4: 0.7, serotonin: 0.3 },
  STRESSED: { cortisol: 0.6, crh: 0.3, norepinephrine: 0.5 },
  SOCIAL: { oxytocin: 0.5, dopamine_tonic: 0.4, serotonin: 0.4 },
  REFLECTIVE: { serotonin: 0.5, t3_t4: 0.5, anandamide: 0.2 },
  VIGILANT: { norepinephrine: 0.6, cortisol: 0.3 },
  MAINTENANCE: { insulin: 0.3, glucagon: 0.2 },
  REWARD: { dopamine_tonic: 0.6, dopamine_phasic: 0.4, serotonin: 0.5 },
  THREAT: { cortisol: 0.7, norepinephrine: 0.6, crh: 0.4 },
};

export class VirtualEndocrineSystem {
  private concentrations: Float64Array;
  private baselines: Float64Array;
  private halfLives: Float64Array;
  private sensitivity: SensitivityConfig;
  private modeChangeCallbacks: Array<
    (oldMode: CognitiveMode, newMode: CognitiveMode) => void
  > = [];
  private currentModeValue: CognitiveMode = "RESTING";
  private history: Array<{ time: number; mode: CognitiveMode }> = [];
  private tickCount = 0;

  public constructor(
    baselineOverrides?: Partial<Record<string, number>>,
    sensitivityOverrides?: Partial<SensitivityConfig>
  ) {
    this.concentrations = new Float64Array(16);
    this.baselines = new Float64Array(16);
    this.halfLives = new Float64Array(16);
    this.sensitivity = {
      reward: 1.0,
      threat: 1.0,
      social: 1.0,
      novelty: 1.0,
      ...sensitivityOverrides,
    };

    for (let i = 0; i < HORMONE_IDS.length; i++) {
      const id = HORMONE_IDS[i];
      const config = DEFAULT_HORMONE_CONFIG[id];
      const baseline = baselineOverrides?.[id] ?? config.baseline;
      this.baselines[i] = baseline;
      this.concentrations[i] = baseline;
      this.halfLives[i] = config.halfLife;
    }
  }

  /** Advance the endocrine system by dt seconds */
  public tick(dt: number): void {
    this.tickCount++;

    // Exponential decay toward baselines
    for (let i = 0; i < 16; i++) {
      const decayRate = Math.LN2 / this.halfLives[i];
      const diff = this.concentrations[i] - this.baselines[i];
      this.concentrations[i] -= diff * decayRate * dt;
      this.concentrations[i] = Math.max(
        0,
        Math.min(1, this.concentrations[i])
      );
    }

    // HPA axis cascade: CRH → ACTH → Cortisol
    const crhIdx = 0;
    const acthIdx = 1;
    const cortisolIdx = 2;
    if (this.concentrations[crhIdx] > 0.1) {
      this.concentrations[acthIdx] += this.concentrations[crhIdx] * 0.1 * dt;
    }
    if (this.concentrations[acthIdx] > 0.1) {
      this.concentrations[cortisolIdx] +=
        this.concentrations[acthIdx] * 0.08 * dt;
    }

    // Clamp all
    for (let i = 0; i < 16; i++) {
      this.concentrations[i] = Math.max(
        0,
        Math.min(1, this.concentrations[i])
      );
    }

    // Detect cognitive mode
    const newMode = this.detectMode();
    if (newMode !== this.currentModeValue) {
      const oldMode = this.currentModeValue;
      this.currentModeValue = newMode;
      this.history.push({ time: this.tickCount, mode: newMode });
      for (const cb of this.modeChangeCallbacks) {
        cb(oldMode, newMode);
      }
    }
  }

  /** Signal a cognitive event */
  public signalEvent(event: EndocrineEvent, intensity: number): void {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    switch (event) {
      case "THREAT_DETECTED":
      case "CONFLICT_DETECTED": {
        const mult = this.sensitivity.threat;
        this.inject("crh", 0.3 * clampedIntensity * mult);
        this.inject("norepinephrine", 0.4 * clampedIntensity * mult);
        break;
      }
      case "REWARD_RECEIVED":
      case "GOAL_ACHIEVED": {
        const mult = this.sensitivity.reward;
        this.inject("dopamine_tonic", 0.3 * clampedIntensity * mult);
        this.inject("dopamine_phasic", 0.5 * clampedIntensity * mult);
        this.inject("serotonin", 0.15 * clampedIntensity * mult);
        break;
      }
      case "NOVELTY_ENCOUNTERED": {
        const mult = this.sensitivity.novelty;
        this.inject("norepinephrine", 0.3 * clampedIntensity * mult);
        this.inject("dopamine_phasic", 0.4 * clampedIntensity * mult);
        break;
      }
      case "SOCIAL_BOND_SIGNAL": {
        const mult = this.sensitivity.social;
        this.inject("oxytocin", 0.4 * clampedIntensity * mult);
        this.inject("serotonin", 0.1 * clampedIntensity * mult);
        break;
      }
      case "ERROR_DETECTED":
        this.inject("il6", 0.3 * clampedIntensity);
        this.inject("cortisol", 0.2 * clampedIntensity);
        break;
      case "NOISE_EXCESSIVE":
        this.inject("anandamide", 0.3 * clampedIntensity);
        break;
      case "RESOURCE_DEPLETED":
        this.inject("glucagon", 0.3 * clampedIntensity);
        break;
      case "LIGHT_SIGNAL":
        this.inject(
          "melatonin",
          -0.2 * clampedIntensity
        );
        break;
      default:
        break;
    }
  }

  /** Get current hormone state */
  public state(): EndocrineState {
    const concentrations: Record<string, number> = {};
    for (let i = 0; i < HORMONE_IDS.length; i++) {
      concentrations[HORMONE_IDS[i]] = this.concentrations[i];
    }
    return { concentrations };
  }

  /** Get concentration of a specific hormone */
  public concentration(id: HormoneId): number {
    const idx = HORMONE_IDS.indexOf(id);
    return idx >= 0 ? this.concentrations[idx] : 0;
  }

  /** Get current cognitive mode */
  public currentMode(): CognitiveMode {
    return this.currentModeValue;
  }

  /** Register mode change callback */
  public onModeChange(
    cb: (oldMode: CognitiveMode, newMode: CognitiveMode) => void
  ): void {
    this.modeChangeCallbacks.push(cb);
  }

  /** Get mode history */
  public getHistory(): Array<{ time: number; mode: CognitiveMode }> {
    return [...this.history];
  }

  private inject(id: HormoneId | string, amount: number): void {
    const idx = HORMONE_IDS.indexOf(id as HormoneId);
    if (idx >= 0) {
      this.concentrations[idx] = Math.max(
        0,
        Math.min(1, this.concentrations[idx] + amount)
      );
    }
  }

  private detectMode(): CognitiveMode {
    let bestMode: CognitiveMode = "RESTING";
    let bestDist = Infinity;

    const modes = Object.keys(MODE_CENTROIDS) as CognitiveMode[];
    for (const mode of modes) {
      const centroid = MODE_CENTROIDS[mode];
      let dist = 0;
      for (const [hormone, target] of Object.entries(centroid)) {
        const idx = HORMONE_IDS.indexOf(hormone as HormoneId);
        if (idx >= 0) {
          const diff = this.concentrations[idx] - (target as number);
          dist += diff * diff;
        }
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestMode = mode;
      }
    }
    return bestMode;
  }
}
