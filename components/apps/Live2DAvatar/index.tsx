import { memo, useCallback, useEffect, useRef, useState } from "react";
import StyledLive2DAvatar from "components/apps/Live2DAvatar/StyledLive2DAvatar";
import  { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import  { type EndocrineEvent } from "utils/endocrine";
import  { type AgentState , AutonomousAgent } from "utils/live2d/autonomousAgent";
import {
  CHARACTER_REGISTRY,
  DTECHO_MANIFEST,
  MIARA_MANIFEST,
} from "utils/live2d/characters";

// CDN libraries for Live2D rendering
// pixi-live2d-display v0.5.0-beta requires PixiJS 6.x
// Cubism Core supports Cubism 3/4 models; live2d.min.js supports Cubism 2.1
const LIVE2D_LIBS = [
  // Cubism 4 Core (latest stable from Live2D official CDN)
  "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
  // Cubism 2.1 runtime (for legacy model support)
  "https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js",
  // PixiJS 6.5.10 (latest 6.x — required by pixi-live2d-display)
  "https://cdn.jsdelivr.net/npm/pixi.js-legacy@6.5.10/dist/browser/pixi-legacy.min.js",
  // pixi-live2d-display v0.5.0-beta (latest stable, supports Cubism 2.1/3/4)
  "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.5.0-beta/dist/index.min.js",
];

const KEY_HORMONES = [
  "cortisol",
  "dopamine_tonic",
  "dopamine_phasic",
  "serotonin",
  "norepinephrine",
  "oxytocin",
  "t3_t4",
  "anandamide",
];

// Minimal type declarations for external CDN-loaded PIXI + Live2D
interface PixiLive2DModel {
  height: number;
  on: (event: string, cb: (hitAreas: string[]) => void) => void;
  scale: { set: (s: number) => void };
  width: number;
  x: number;
  y: number;
}

interface PixiApp {
  destroy: (removeView: boolean) => void;
  renderer: { resize: (w: number, h: number) => void };
  stage: { addChild: (child: PixiLive2DModel) => void };
  view: HTMLCanvasElement;
}

interface PixiNamespace {
  Application: new (opts: Record<string, unknown>) => PixiApp;
  live2d: {
    Live2DModel: {
      from: (
        url: string,
        opts: Record<string, boolean>
      ) => Promise<PixiLive2DModel>;
    };
  };
}

const loadScript = (src: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () =>
      reject(new Error(`Failed to load: ${src}`))
    );
    document.head.append(script);
  });

const waitForCubismCore = async (): Promise<void> => {
  const start = Date.now();
  const globalWindow = window as unknown as Record<string, unknown>;

  while (!globalWindow.Live2DCubismCore) {
    if (Date.now() - start > 10_000) break;
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
  }
};

const Live2DAvatar: FC<ComponentProcessProps> = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PixiApp | undefined>(undefined);
  const modelRef = useRef<PixiLive2DModel | undefined>(undefined);
  const agentRef = useRef<AutonomousAgent | undefined>(undefined);
  const [activeCharacter, setActiveCharacter] = useState<string>("miara");
  const [agentState, setAgentState] = useState<AgentState | undefined>(
    
  );
  const [libsLoaded, setLibsLoaded] = useState<boolean>(false);

  // Load CDN scripts sequentially (order matters for dependencies)
  useEffect(() => {
    let cancelled = false;

    const loadScripts = async (): Promise<void> => {
      // Scripts must load sequentially — each depends on the previous
      for (const src of LIVE2D_LIBS) {
        // eslint-disable-next-line no-await-in-loop
        await loadScript(src);
      }

      await waitForCubismCore();

      if (!cancelled) setLibsLoaded(true);
    };

    loadScripts().catch(() => {
      // Silently handle CDN failures
    });

    return (): void => {
      cancelled = true;
    };
  }, []);

  // Initialize PIXI app and load model
  const initializeAvatar = useCallback(
    async (characterId: string): Promise<void> => {
      const globalWindow = window as unknown as Record<string, unknown>;
      const PIXI = globalWindow.PIXI as PixiNamespace | undefined;

      if (!PIXI || !canvasContainerRef.current) return;

      // Clean up previous
      if (agentRef.current) {
        agentRef.current.stop();
        agentRef.current = undefined;
      }

      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
        pixiAppRef.current = undefined;
        modelRef.current = undefined;
      }

      const container = canvasContainerRef.current;
      const { clientHeight: height, clientWidth: width } = container;

      // Create PIXI Application
      const app = new PIXI.Application({
        antialias: true,
        autoStart: true,
        backgroundAlpha: 0,
        height,
        width,
      });

      container.innerHTML = "";
      container.append(app.view);
      pixiAppRef.current = app;

      // Get character manifest
      const manifest =
        CHARACTER_REGISTRY[characterId] ??
        (characterId === "dtecho" ? DTECHO_MANIFEST : MIARA_MANIFEST);

      // Load Live2D model
      try {
        const model = await PIXI.live2d.Live2DModel.from(manifest.modelUrl, {
          autoInteract: true,
          autoUpdate: true,
        });

        // Scale and position
        const scaleFactor =
          manifest.modelVersion === "cubism4" ? 0.7 : 0.5;
        const scale =
          Math.min(width / model.width, height / model.height) * scaleFactor;

        model.scale.set(scale);
        model.x = (width - model.width * scale) / 2;
        model.y = (height - model.height * scale) / 2;

        app.stage.addChild(model);
        modelRef.current = model;

        // Hit area interaction → inject endocrine events
        model.on("hit", (hitAreas: string[]) => {
          if (agentRef.current) {
            if (hitAreas.includes("head")) {
              agentRef.current.injectEvent("SOCIAL_BOND_SIGNAL", 0.6);
            } else if (hitAreas.includes("body")) {
              agentRef.current.injectEvent("REWARD_RECEIVED", 0.5);
            }
          }
        });

        // Create autonomous agent
        const agent = new AutonomousAgent(manifest);

        agent.attachModel(model);
        agent.onStateChange((state: AgentState) => {
          setAgentState({ ...state });
        });
        agent.start();
        agentRef.current = agent;

        // Set initial state
        setAgentState(agent.getState());
      } catch {
        // Model load failed — show error state
      }

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (!container || !pixiAppRef.current || !modelRef.current) return;

        const { clientHeight: h, clientWidth: w } = container;

        pixiAppRef.current.renderer.resize(w, h);

        const m = modelRef.current;
        const sf = manifest.modelVersion === "cubism4" ? 0.7 : 0.5;
        const s = Math.min(w / m.width, h / m.height) * sf;

        m.scale.set(s);
        m.x = (w - m.width * s) / 2;
        m.y = (h - m.height * s) / 2;
      });

      resizeObserver.observe(container);
    },
    []
  );

  // Initialize when libs are loaded or character changes
  useEffect(() => {
    if (!libsLoaded) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return (): void => {};
    }

    initializeAvatar(activeCharacter);

    return (): void => {
      if (agentRef.current) {
        agentRef.current.stop();
      }
    };
  }, [activeCharacter, initializeAvatar, libsLoaded]);

  // Cleanup on unmount
  useEffect(
    () => (): void => {
      if (agentRef.current) {
        agentRef.current.stop();
      }

      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
      }
    },
    []
  );

  const handleCharacterSwitch = useCallback((charId: string): void => {
    setActiveCharacter(charId);
  }, []);

  const handleInjectEvent = useCallback(
    (event: EndocrineEvent, intensity: number): void => {
      if (agentRef.current) {
        agentRef.current.injectEvent(event, intensity);
      }
    },
    []
  );

  return (
    <StyledLive2DAvatar>
      {/* Character Selector */}
      <div className="character-selector">
        <button
          className={activeCharacter === "miara" ? "active" : ""}
          onClick={(): void => handleCharacterSwitch("miara")}
          type="button"
        >
          Miara (Explorer)
        </button>
        <button
          className={activeCharacter === "dtecho" ? "active" : ""}
          onClick={(): void => handleCharacterSwitch("dtecho")}
          type="button"
        >
          Deep Tree Echo (Sage)
        </button>
        <button
          onClick={(): void =>
            handleInjectEvent("NOVELTY_ENCOUNTERED", 0.7)
          }
          title="Inject novelty event"
          type="button"
        >
          Novelty
        </button>
        <button
          onClick={(): void => handleInjectEvent("REWARD_RECEIVED", 0.6)}
          title="Inject reward event"
          type="button"
        >
          Reward
        </button>
        <button
          onClick={(): void => handleInjectEvent("THREAT_DETECTED", 0.5)}
          title="Inject threat event"
          type="button"
        >
          Threat
        </button>
        <button
          onClick={(): void =>
            handleInjectEvent("SOCIAL_BOND_SIGNAL", 0.6)
          }
          title="Inject social event"
          type="button"
        >
          Social
        </button>
      </div>

      {/* Avatar Canvas */}
      <div ref={canvasContainerRef} className="avatar-canvas-container">
        {!libsLoaded && (
          <div
            style={{
              alignItems: "center",
              color: "#64c8ff",
              display: "flex",
              height: "100%",
              justifyContent: "center",
            }}
          >
            Loading Live2D runtime...
          </div>
        )}
      </div>

      <div className="interaction-hint">
        Click the avatar to interact - Endocrine events shape expressions
      </div>

      {/* Endocrine System Panel */}
      <div className="endocrine-panel">
        <div className="panel-header">
          <span className="character-name">
            {agentState?.characterId === "dtecho"
              ? "Deep Tree Echo"
              : "Miara"}
          </span>
          <span className="cognitive-state">
            {agentState?.cognitiveState ?? "Initializing..."}
          </span>
          <span
            className={`cognitive-mode ${agentState?.cognitiveMode ?? "RESTING"}`}
          >
            {agentState?.cognitiveMode ?? "RESTING"}
          </span>
          {agentState?.activeExpression ? (
            <span style={{ color: "#a4f", fontSize: "10px" }}>
              {agentState.activeExpression}
            </span>
          ) : undefined}
          <span style={{ color: "#666" }}>
            tick #{agentState?.tickCount ?? 0}
          </span>
        </div>
        <div className="hormone-grid">
          {KEY_HORMONES.map((hormone) => {
            const value = agentState?.hormones[hormone] ?? 0;

            return (
              <div key={hormone} className="hormone-row">
                <span className="hormone-name">
                  {hormone.replaceAll("_", " ")}
                </span>
                <div className="hormone-bar">
                  <div
                    className={`hormone-fill ${hormone}`}
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
                <span className="hormone-value">{value.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </StyledLive2DAvatar>
  );
};

export default memo(Live2DAvatar);
