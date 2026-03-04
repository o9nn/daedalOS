// Virtual Endocrine System — 16-channel hormone bus with 10 virtual glands
// Biologically-inspired emotional architecture for cognitive avatars

export type HormoneId =
  | "acth"
  | "anandamide"
  | "cortisol"
  | "crh"
  | "dopamine_phasic"
  | "dopamine_tonic"
  | "glucagon"
  | "il6"
  | "insulin"
  | "melatonin"
  | "norepinephrine"
  | "oxytocin"
  | "reserved_14"
  | "reserved_15"
  | "serotonin"
  | "t3_t4";

export type CognitiveMode =
  | "EXPLORATORY"
  | "FOCUSED"
  | "MAINTENANCE"
  | "REFLECTIVE"
  | "RESTING"
  | "REWARD"
  | "SOCIAL"
  | "STRESSED"
  | "THREAT"
  | "VIGILANT";

export type EndocrineEvent =
  | "CONFLICT_DETECTED"
  | "ERROR_DETECTED"
  | "GOAL_ACHIEVED"
  | "LIGHT_SIGNAL"
  | "NOISE_EXCESSIVE"
  | "NOVELTY_ENCOUNTERED"
  | "RESOURCE_DEPLETED"
  | "REWARD_RECEIVED"
  | "SOCIAL_BOND_SIGNAL"
  | "THREAT_DETECTED";

export interface HormoneConfig {
  baseline: number;
  halfLife: number;
}

export interface EndocrineState {
  concentrations: Record<string, number>;
}

export interface SensitivityConfig {
  novelty: number;
  reward: number;
  social: number;
  threat: number;
}

const DEFAULT_HORMONE_CONFIG: Record<HormoneId, HormoneConfig> = {
  acth: { baseline: 0.05, halfLife: 10 },
  anandamide: { baseline: 0.1, halfLife: 6 },
  cortisol: { baseline: 0.15, halfLife: 30 },
  crh: { baseline: 0.05, halfLife: 5 },
  dopamine_phasic: { baseline: 0, halfLife: 3 },
  dopamine_tonic: { baseline: 0.3, halfLife: 20 },
  glucagon: { baseline: 0.1, halfLife: 8 },
  il6: { baseline: 0.05, halfLife: 20 },
  insulin: { baseline: 0.2, halfLife: 10 },
  melatonin: { baseline: 0, halfLife: 12 },
  norepinephrine: { baseline: 0.1, halfLife: 8 },
  oxytocin: { baseline: 0.1, halfLife: 15 },
  reserved_14: { baseline: 0, halfLife: 10 },
  reserved_15: { baseline: 0, halfLife: 10 },
  serotonin: { baseline: 0.4, halfLife: 50 },
  t3_t4: { baseline: 0.5, halfLife: 100 },
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
  EXPLORATORY: {
    dopamine_phasic: 0.3,
    norepinephrine: 0.4,
    t3_t4: 0.6,
  },
  FOCUSED: { norepinephrine: 0.4, serotonin: 0.3, t3_t4: 0.7 },
  MAINTENANCE: { glucagon: 0.2, insulin: 0.3 },
  REFLECTIVE: { anandamide: 0.2, serotonin: 0.5, t3_t4: 0.5 },
  RESTING: { anandamide: 0.3, cortisol: 0.1, serotonin: 0.5 },
  REWARD: { dopamine_phasic: 0.4, dopamine_tonic: 0.6, serotonin: 0.5 },
  SOCIAL: { dopamine_tonic: 0.4, oxytocin: 0.5, serotonin: 0.4 },
  STRESSED: { cortisol: 0.6, crh: 0.3, norepinephrine: 0.5 },
  THREAT: { cortisol: 0.7, crh: 0.4, norepinephrine: 0.6 },
  VIGILANT: { cortisol: 0.3, norepinephrine: 0.6 },
};

const CHANNEL_COUNT = 16;
const CRH_IDX = 0;
const ACTH_IDX = 1;
const CORTISOL_IDX = 2;
const CRH_THRESHOLD = 0.1;
const ACTH_THRESHOLD = 0.1;
const CRH_TO_ACTH_RATE = 0.1;
const ACTH_TO_CORTISOL_RATE = 0.08;

export class VirtualEndocrineSystem {
  private readonly baselines: Float64Array;

  private concentrations: Float64Array;

  private currentModeValue: CognitiveMode = "RESTING";

  private readonly halfLives: Float64Array;

  private history: { mode: CognitiveMode; time: number }[] = [];

  private modeChangeCallbacks: ((
    oldMode: CognitiveMode,
    newMode: CognitiveMode
  ) => void)[] = [];

  private readonly sensitivity: SensitivityConfig;

  private tickCount = 0;

  public constructor(
    baselineOverrides?: Partial<Record<string, number>>,
    sensitivityOverrides?: Partial<SensitivityConfig>
  ) {
    this.concentrations = new Float64Array(CHANNEL_COUNT);
    this.baselines = new Float64Array(CHANNEL_COUNT);
    this.halfLives = new Float64Array(CHANNEL_COUNT);
    this.sensitivity = {
      novelty: 1,
      reward: 1,
      social: 1,
      threat: 1,
      ...sensitivityOverrides,
    };

    for (const [i, id] of HORMONE_IDS.entries()) {
      const config = DEFAULT_HORMONE_CONFIG[id];
      const baseline = baselineOverrides?.[id] ?? config.baseline;

      this.baselines[i] = baseline;
      this.concentrations[i] = baseline;
      this.halfLives[i] = config.halfLife;
    }
  }

  /** Get concentration of a specific hormone */
  public concentration(id: HormoneId): number {
    const idx = HORMONE_IDS.indexOf(id);

    return idx === -1 ? 0 : this.concentrations[idx];
  }

  /** Get current cognitive mode */
  public currentMode(): CognitiveMode {
    return this.currentModeValue;
  }

  /** Get mode history */
  public getHistory(): { mode: CognitiveMode; time: number }[] {
    return [...this.history];
  }

  /** Register mode change callback */
  public onModeChange(
    cb: (oldMode: CognitiveMode, newMode: CognitiveMode) => void
  ): void {
    this.modeChangeCallbacks.push(cb);
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
        this.inject("melatonin", -0.2 * clampedIntensity);
        break;

      default:
        break;
    }
  }

  /** Get current hormone state */
  public state(): EndocrineState {
    const concentrations: Record<string, number> = {};

    for (const [i, hormoneId] of HORMONE_IDS.entries()) {
      concentrations[hormoneId] = this.concentrations[i];
    }

    return { concentrations };
  }

  /** Advance the endocrine system by dt seconds */
  public tick(dt: number): void {
    this.tickCount += 1;

    // Exponential decay toward baselines
    for (let i = 0; i < CHANNEL_COUNT; i += 1) {
      const decayRate = Math.LN2 / this.halfLives[i];
      const diff = this.concentrations[i] - this.baselines[i];

      this.concentrations[i] -= diff * decayRate * dt;
      this.concentrations[i] = Math.max(
        0,
        Math.min(1, this.concentrations[i])
      );
    }

    // HPA axis cascade: CRH → ACTH → Cortisol
    if (this.concentrations[CRH_IDX] > CRH_THRESHOLD) {
      this.concentrations[ACTH_IDX] +=
        this.concentrations[CRH_IDX] * CRH_TO_ACTH_RATE * dt;
    }

    if (this.concentrations[ACTH_IDX] > ACTH_THRESHOLD) {
      this.concentrations[CORTISOL_IDX] +=
        this.concentrations[ACTH_IDX] * ACTH_TO_CORTISOL_RATE * dt;
    }

    // Clamp all
    for (let i = 0; i < CHANNEL_COUNT; i += 1) {
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
      this.history.push({ mode: newMode, time: this.tickCount });

      for (const cb of this.modeChangeCallbacks) {
        cb(oldMode, newMode);
      }
    }
  }

  private detectMode(): CognitiveMode {
    let bestMode: CognitiveMode = "RESTING";
    let bestDist = Number.POSITIVE_INFINITY;

    const modes = Object.keys(MODE_CENTROIDS) as CognitiveMode[];

    for (const mode of modes) {
      const centroid = MODE_CENTROIDS[mode];
      let dist = 0;

      for (const [hormone, target] of Object.entries(centroid)) {
        const idx = HORMONE_IDS.indexOf(hormone as HormoneId);

        if (idx !== -1) {
          const diff = this.concentrations[idx] - target;

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

  private inject(id: HormoneId, amount: number): void {
    const idx = HORMONE_IDS.indexOf(id);

    if (idx !== -1) {
      this.concentrations[idx] = Math.max(
        0,
        Math.min(1, this.concentrations[idx] + amount)
      );
    }
  }
}
