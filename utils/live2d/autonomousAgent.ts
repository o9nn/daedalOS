// Autonomous Agent Engine
// Drives the simulation tick loop: cognitive state -> endocrine events -> expression
// Implements the composition: SimulationEngine x EndocrineSystem x ExpressionBridge
//
// Pipeline per tick (aligned with /live2d-dtecho dtechoExpressionTick spec):
//   1. Get cognitive state
//   2. Fire endocrine event from cognitive state
//   3. Tick endocrine system (hormone decay/accumulation)
//   4. Evaluate expression rules from hormones
//   5. Apply Cubism parameter mappings
//   6. Apply cognitive mode motion/pose
//   7. Apply to Live2D model

import  { type EndocrineEvent , VirtualEndocrineSystem } from "utils/endocrine";
import  { type CharacterManifest } from "utils/live2d/characters";
import { EndocrineExpressionBridge } from "utils/live2d/endocrineBridge";

// Minimal type for the Live2D model interface we interact with
interface Live2DModelAgent {
  expression?: (name: string) => void;
  internalModel?: {
    coreModel?: {
      getParameterIndex: (name: string) => number;
      setParameterValueById: (name: string, value: number) => void;
    };
  };
  motion?: (group: string, index: number, priority: number) => void;
  on?: (event: string, cb: (hitAreas: string[]) => void) => void;
}

// DTE cognitive states for the autonomous exploration cycle
const DTE_COGNITIVE_STATES = [
  "Recursive Expansion",
  "Novel Insights",
  "Pattern Recognition",
  "Synthesis Phase",
  "Knowledge Integration",
  "Self-Reference Point",
  "Evolutionary Pruning",
  "External Validation",
  "Entropy Threshold",
  "Self-Sealing Loop",
] as const;

// Miara exploration states
const MIARA_COGNITIVE_STATES = [
  "Exploring",
  "Discovering",
  "Resting",
  "Socializing",
  "Reflecting",
  "Playing",
  "Observing",
  "Creating",
] as const;

// Miara state -> endocrine event mapping
const MIARA_STATE_MAP: Record<
  string,
  { event: EndocrineEvent; intensity: number }
> = {
  Creating: { event: "GOAL_ACHIEVED", intensity: 0.5 },
  Discovering: { event: "REWARD_RECEIVED", intensity: 0.6 },
  Exploring: { event: "NOVELTY_ENCOUNTERED", intensity: 0.5 },
  Observing: { event: "NOVELTY_ENCOUNTERED", intensity: 0.4 },
  Playing: { event: "REWARD_RECEIVED", intensity: 0.4 },
  Reflecting: { event: "NOVELTY_ENCOUNTERED", intensity: 0.3 },
  Resting: { event: "NOISE_EXCESSIVE", intensity: 0.3 },
  Socializing: { event: "SOCIAL_BOND_SIGNAL", intensity: 0.5 },
};

// Cognitive mode -> head/gaze pose (from /live2d-dtecho spec step 6)
const MODE_POSE: Partial<Record<string, Record<string, number>>> = {
  EXPLORATORY: { ParamAngleX: 8, ParamAngleY: 5, ParamEyeBallX: 0.3 },
  FOCUSED: { ParamAngleX: 0, ParamAngleY: 0, ParamEyeBallY: -0.2 },
  REFLECTIVE: { ParamAngleX: -5, ParamAngleY: 8, ParamEyeBallY: 0.3 },
  RESTING: { ParamAngleX: 0, ParamAngleY: -5 },
  REWARD: { ParamAngleX: 0, ParamAngleY: 5 },
  SOCIAL: { ParamAngleX: 5, ParamAngleY: 3 },
  STRESSED: { ParamAngleX: -3, ParamAngleY: -8 },
  THREAT: { ParamAngleX: 0, ParamAngleY: -10 },
  VIGILANT: { ParamAngleX: 0, ParamAngleY: 0, ParamEyeBallX: 0.4 },
};

const SEQUENTIAL_CHANCE = 0.7;
const MICRO_EVENT_CHANCE = 0.15;
const MICRO_EVENT_BASE = 0.1;
const MICRO_EVENT_RANGE = 0.2;
const MS_PER_SECOND = 1000;
const TICK_INTERVAL_MS = 2000;

export interface AgentState {
  activeExpression: string | undefined;
  characterId: string;
  cognitiveMode: string;
  cognitiveState: string;
  hormones: Record<string, number>;
  modeHistory: { mode: string; time: number }[];
  tickCount: number;
}

export class AutonomousAgent {
  public readonly bridge: EndocrineExpressionBridge;

  public readonly endocrine: VirtualEndocrineSystem;

  public readonly manifest: CharacterManifest;

  private activeExpression: string | undefined;

  private cognitiveState: string;

  private readonly cognitiveStates: readonly string[];

  private intervalId: ReturnType<typeof setInterval> | undefined;

  private model: Live2DModelAgent | undefined;

  private stateChangeCallbacks: ((state: AgentState) => void)[] = [];

  private stateIndex = 0;

  private readonly stateMap: Record<
    string,
    { event: EndocrineEvent; intensity: number }
  >;

  private tickCount = 0;

  private readonly tickIntervalMs: number;

  public constructor(manifest: CharacterManifest) {
    this.manifest = manifest;
    this.tickIntervalMs = TICK_INTERVAL_MS;

    // Initialize endocrine system with character baselines and sensitivity
    this.endocrine = new VirtualEndocrineSystem(
      manifest.endocrineBaselines,
      manifest.sensitivity
    );

    // Initialize expression bridge
    this.bridge = new EndocrineExpressionBridge(manifest);

    // Select cognitive states and mapping based on character
    if (manifest.id === "dtecho" && manifest.cognitiveStateMap) {
      this.cognitiveStates = DTE_COGNITIVE_STATES;
      this.stateMap = manifest.cognitiveStateMap;
    } else {
      this.cognitiveStates = MIARA_COGNITIVE_STATES;
      this.stateMap = MIARA_STATE_MAP;
    }

    [this.cognitiveState] = this.cognitiveStates;
  }

  /** Get current agent state snapshot */
  public getState(): AgentState {
    const endoState = this.endocrine.state();

    return {
      activeExpression: this.activeExpression,
      characterId: this.manifest.id,
      cognitiveMode: this.endocrine.currentMode(),
      cognitiveState: this.cognitiveState,
      hormones: endoState.concentrations,
      modeHistory: this.endocrine.getHistory(),
      tickCount: this.tickCount,
    };
  }

  /** Manually inject an event (e.g., from user interaction) */
  public injectEvent(event: EndocrineEvent, intensity: number): void {
    this.endocrine.signalEvent(event, intensity);
  }

  /** Register a callback for state changes */
  public onStateChange(cb: (state: AgentState) => void): void {
    this.stateChangeCallbacks.push(cb);
  }

  /** Start the autonomous tick loop */
  public start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickIntervalMs);
  }

  /** Stop the autonomous tick loop */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /** Attach a Live2D model to this agent */
  public attachModel(model: Live2DModelAgent): void {
    this.model = model;
  }

  /** Advance to next cognitive state with some randomness */
  private advanceCognitiveState(): void {
    // 70% chance to advance sequentially, 30% chance to jump
    this.stateIndex =
      Math.random() < SEQUENTIAL_CHANCE
        ? (this.stateIndex + 1) % this.cognitiveStates.length
        : Math.floor(Math.random() * this.cognitiveStates.length);
    this.cognitiveState = this.cognitiveStates[this.stateIndex];
  }

  /**
   * Single simulation tick — implements the dtechoExpressionTick pipeline:
   *   1. Get cognitive state
   *   2. Fire endocrine event from cognitive state
   *   3. Tick endocrine system (hormone decay/accumulation)
   *   4. Evaluate expression rules from hormones (or use cognitiveExpressionMap)
   *   5. Apply Cubism parameter mappings
   *   6. Apply cognitive mode head/gaze pose
   *   7. Apply to Live2D model
   */
  private tick(): void {
    this.tickCount += 1;

    // Step 1: Advance cognitive state (stochastic with weighted transitions)
    this.advanceCognitiveState();

    // Step 2: Fire endocrine event from cognitive state
    const mapping = this.stateMap[this.cognitiveState];

    if (mapping) {
      this.endocrine.signalEvent(mapping.event, mapping.intensity);
    }

    // Add random micro-events for liveliness
    if (Math.random() < MICRO_EVENT_CHANCE) {
      const microEvents: EndocrineEvent[] = [
        "NOVELTY_ENCOUNTERED",
        "SOCIAL_BOND_SIGNAL",
        "NOISE_EXCESSIVE",
      ];
      const randomEvent =
        microEvents[Math.floor(Math.random() * microEvents.length)];

      this.endocrine.signalEvent(
        randomEvent,
        MICRO_EVENT_BASE + Math.random() * MICRO_EVENT_RANGE
      );
    }

    // Step 3: Tick endocrine system (hormone decay/accumulation)
    this.endocrine.tick(this.tickIntervalMs / MS_PER_SECOND);

    // Steps 4-6: Apply expression bridge to Live2D model
    const mode = this.endocrine.currentMode();
    const state = this.endocrine.state();

    // For DTE: also use cognitiveExpressionMap for direct state->expression
    if (this.manifest.cognitiveExpressionMap && this.model) {
      const directExpression =
        this.manifest.cognitiveExpressionMap[this.cognitiveState];

      if (directExpression) {
        this.activeExpression = directExpression;
      }
    }

    // Apply the bridge (expression rules, Cubism params, motion)
    this.bridge.apply(state, mode, this.model);

    // Step 6: Apply cognitive mode head/gaze pose
    const coreModel = this.model?.internalModel?.coreModel;

    if (coreModel) {
      const pose = MODE_POSE[mode];

      if (pose) {
        for (const [paramName, paramValue] of Object.entries(pose)) {
          try {
            coreModel.setParameterValueById(paramName, paramValue);
          } catch {
            // Parameter may not exist — silently skip
          }
        }
      }
    }

    // Step 7: Notify state change callbacks
    const agentState = this.getState();

    for (const cb of this.stateChangeCallbacks) {
      cb(agentState);
    }
  }
}
