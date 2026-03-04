import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledLive2DAvatar from "components/apps/Live2DAvatar/StyledLive2DAvatar";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { AgentState } from "utils/live2d/autonomousAgent";
import { AutonomousAgent } from "utils/live2d/autonomousAgent";
import {
  CHARACTER_REGISTRY,
  DTECHO_MANIFEST,
  MIARA_MANIFEST,
} from "utils/live2d/characters";
import type { EndocrineEvent } from "utils/endocrine";

const LIVE2D_LIBS = [
  "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
  "https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js",
  "https://cdn.jsdelivr.net/npm/pixi.js-legacy@6.5.2/dist/browser/pixi-legacy.min.js",
  "https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/index.min.js",
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

const Live2DAvatar: FC<ComponentProcessProps> = ({ id }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<unknown>(null);
  const modelRef = useRef<unknown>(null);
  const agentRef = useRef<AutonomousAgent | null>(null);
  const [activeCharacter, setActiveCharacter] = useState<string>("miara");
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [libsLoaded, setLibsLoaded] = useState<boolean>(false);

  // Load CDN scripts
  useEffect(() => {
    let cancelled = false;

    const loadScripts = async (): Promise<void> => {
      for (const src of LIVE2D_LIBS) {
        if (document.querySelector(`script[src="${src}"]`)) continue;

        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = (): void => resolve();
          script.onerror = (): void =>
            reject(new Error(`Failed to load: ${src}`));
          document.head.appendChild(script);
        });
      }

      // Wait for Cubism Core WASM
      const start = Date.now();
      while (!(window as Record<string, unknown>).Live2DCubismCore) {
        if (Date.now() - start > 10_000) break;
        await new Promise((r) => setTimeout(r, 100));
      }

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
      const PIXI = (window as Record<string, unknown>).PIXI as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >;
      if (!PIXI || !canvasContainerRef.current) return;

      // Clean up previous
      if (agentRef.current) {
        agentRef.current.stop();
        agentRef.current = null;
      }
      if (pixiAppRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pixiAppRef.current as any).destroy(true);
        pixiAppRef.current = null;
        modelRef.current = null;
      }

      const container = canvasContainerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Create PIXI Application
      const app = new PIXI.Application({
        autoStart: true,
        backgroundAlpha: 0,
        width,
        height,
        antialias: true,
      });

      container.innerHTML = "";
      container.appendChild(app.view);
      pixiAppRef.current = app;

      // Get character manifest
      const manifest =
        CHARACTER_REGISTRY[characterId] ||
        (characterId === "dtecho" ? DTECHO_MANIFEST : MIARA_MANIFEST);

      // Load Live2D model
      try {
        const model = await PIXI.live2d.Live2DModel.from(manifest.modelUrl, {
          autoInteract: true,
          autoUpdate: true,
        });

        // Scale and position
        const scale =
          Math.min(width / model.width, height / model.height) *
          (manifest.modelVersion === "cubism4" ? 0.7 : 0.5);
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
        if (!container || !app || !modelRef.current) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        app.renderer.resize(w, h);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = modelRef.current as any;
        const s =
          Math.min(w / m.width, h / m.height) *
          (manifest.modelVersion === "cubism4" ? 0.7 : 0.5);
        m.scale.set(s);
        m.x = (w - m.width * s) / 2;
        m.y = (h - m.height * s) / 2;
      });
      resizeObserver.observe(container);

      return (): void => {
        resizeObserver.disconnect();
      };
    },
    []
  );

  // Initialize when libs are loaded or character changes
  useEffect(() => {
    if (!libsLoaded) return;

    initializeAvatar(activeCharacter);

    return (): void => {
      if (agentRef.current) {
        agentRef.current.stop();
      }
    };
  }, [libsLoaded, activeCharacter, initializeAvatar]);

  // Cleanup on unmount
  useEffect(
    () => (): void => {
      if (agentRef.current) {
        agentRef.current.stop();
      }
      if (pixiAppRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pixiAppRef.current as any).destroy(true);
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
          ✦ Novelty
        </button>
        <button
          onClick={(): void => handleInjectEvent("REWARD_RECEIVED", 0.6)}
          title="Inject reward event"
          type="button"
        >
          ★ Reward
        </button>
        <button
          onClick={(): void => handleInjectEvent("THREAT_DETECTED", 0.5)}
          title="Inject threat event"
          type="button"
        >
          ⚠ Threat
        </button>
        <button
          onClick={(): void =>
            handleInjectEvent("SOCIAL_BOND_SIGNAL", 0.6)
          }
          title="Inject social event"
          type="button"
        >
          ♥ Social
        </button>
      </div>

      {/* Avatar Canvas */}
      <div className="avatar-canvas-container" ref={canvasContainerRef}>
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
        Click the avatar to interact • Endocrine events shape expressions
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
            {agentState?.cognitiveState || "Initializing..."}
          </span>
          <span
            className={`cognitive-mode ${agentState?.cognitiveMode || "RESTING"}`}
          >
            {agentState?.cognitiveMode || "RESTING"}
          </span>
          {agentState?.activeExpression && (
            <span style={{ color: "#a4f", fontSize: "10px" }}>
              {agentState.activeExpression}
            </span>
          )}
          <span style={{ color: "#666" }}>
            tick #{agentState?.tickCount || 0}
          </span>
        </div>
        <div className="hormone-grid">
          {KEY_HORMONES.map((hormone) => {
            const value = agentState?.hormones[hormone] ?? 0;
            return (
              <div className="hormone-row" key={hormone}>
                <span className="hormone-name">
                  {hormone.replace(/_/g, " ")}
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
