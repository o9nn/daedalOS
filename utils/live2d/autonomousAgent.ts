// Autonomous Agent Engine
// Drives the simulation tick loop: cognitive state → endocrine events → expression
// Implements the composition: SimulationEngine ⊗ EndocrineSystem ⊗ ExpressionBridge

import type { EndocrineEvent } from "utils/endocrine";
import { VirtualEndocrineSystem } from "utils/endocrine";
import type { CharacterManifest } from "utils/live2d/characters";
import { EndocrineExpressionBridge } from "utils/live2d/endocrineBridge";

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

// Miara state → endocrine event mapping
const MIARA_STATE_MAP: Record<
  string,
  { event: EndocrineEvent; intensity: number }
> = {
  Exploring: { event: "NOVELTY_ENCOUNTERED", intensity: 0.5 },
  Discovering: { event: "REWARD_RECEIVED", intensity: 0.6 },
  Resting: { event: "NOISE_EXCESSIVE", intensity: 0.3 },
  Socializing: { event: "SOCIAL_BOND_SIGNAL", intensity: 0.5 },
  Reflecting: { event: "NOVELTY_ENCOUNTERED", intensity: 0.3 },
  Playing: { event: "REWARD_RECEIVED", intensity: 0.4 },
  Observing: { event: "NOVELTY_ENCOUNTERED", intensity: 0.4 },
  Creating: { event: "GOAL_ACHIEVED", intensity: 0.5 },
};

export interface AgentState {
  characterId: string;
  cognitiveState: string;
  cognitiveMode: string;
  hormones: Record<string, number>;
  tickCount: number;
  modeHistory: Array<{ time: number; mode: string }>;
}

export class AutonomousAgent {
  public readonly manifest: CharacterManifest;
  public readonly endocrine: VirtualEndocrineSystem;
  public readonly bridge: EndocrineExpressionBridge;

  private cognitiveState: string;
  private stateIndex = 0;
  private tickCount = 0;
  private tickIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private model: any = null;
  private stateChangeCallbacks: Array<(state: AgentState) => void> = [];
  private cognitiveStates: readonly string[];
  private stateMap: Record<
    string,
    { event: EndocrineEvent; intensity: number }
  >;

  public constructor(manifest: CharacterManifest) {
    this.manifest = manifest;
    this.tickIntervalMs = 2000;

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

    this.cognitiveState = this.cognitiveStates[0];
  }

  /** Attach a Live2D model to this agent */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public attachModel(model: any): void {
    this.model = model;
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
      this.intervalId = null;
    }
  }

  /** Register a callback for state changes */
  public onStateChange(cb: (state: AgentState) => void): void {
    this.stateChangeCallbacks.push(cb);
  }

  /** Get current agent state snapshot */
  public getState(): AgentState {
    const endoState = this.endocrine.state();
    return {
      characterId: this.manifest.id,
      cognitiveState: this.cognitiveState,
      cognitiveMode: this.endocrine.currentMode(),
      hormones: endoState.concentrations,
      tickCount: this.tickCount,
      modeHistory: this.endocrine.getHistory(),
    };
  }

  /** Manually inject an event (e.g., from user interaction) */
  public injectEvent(event: EndocrineEvent, intensity: number): void {
    this.endocrine.signalEvent(event, intensity);
  }

  /** Single simulation tick */
  private tick(): void {
    this.tickCount++;

    // 1. Advance cognitive state (stochastic with weighted transitions)
    this.advanceCognitiveState();

    // 2. Fire endocrine event from cognitive state
    const mapping = this.stateMap[this.cognitiveState];
    if (mapping) {
      this.endocrine.signalEvent(mapping.event, mapping.intensity);
    }

    // 3. Add random micro-events for liveliness
    if (Math.random() < 0.15) {
      const microEvents: EndocrineEvent[] = [
        "NOVELTY_ENCOUNTERED",
        "SOCIAL_BOND_SIGNAL",
        "NOISE_EXCESSIVE",
      ];
      const randomEvent =
        microEvents[Math.floor(Math.random() * microEvents.length)];
      this.endocrine.signalEvent(randomEvent, 0.1 + Math.random() * 0.2);
    }

    // 4. Tick endocrine system (hormone decay/accumulation)
    this.endocrine.tick(this.tickIntervalMs / 1000);

    // 5. Apply expression bridge to Live2D model
    const mode = this.endocrine.currentMode();
    const state = this.endocrine.state();
    this.bridge.apply(state, mode, this.model);

    // 6. Notify state change callbacks
    const agentState = this.getState();
    for (const cb of this.stateChangeCallbacks) {
      cb(agentState);
    }
  }

  /** Advance to next cognitive state with some randomness */
  private advanceCognitiveState(): void {
    // 70% chance to advance sequentially, 30% chance to jump
    if (Math.random() < 0.7) {
      this.stateIndex =
        (this.stateIndex + 1) % this.cognitiveStates.length;
    } else {
      this.stateIndex = Math.floor(
        Math.random() * this.cognitiveStates.length
      );
    }
    this.cognitiveState = this.cognitiveStates[this.stateIndex];
  }
}
