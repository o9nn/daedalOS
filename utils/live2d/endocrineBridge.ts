// Endocrine-Expression Bridge
// Maps 16-channel hormone state to Live2D Cubism expressions and parameters
// This is the ⊗ composition point: VirtualEndocrineSystem ⊗ Live2DRenderer

import type {
  CognitiveMode,
  EndocrineState,
} from "utils/endocrine";
import type {
  CharacterManifest,
  CubismParameterMapping,
  ExpressionRule,
} from "utils/live2d/characters";

/**
 * Evaluate expression rules against current hormone state.
 * Returns the best-matching expression name or null.
 */
export const evaluateExpression = (
  rules: ExpressionRule[],
  state: EndocrineState
): string | null => {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const rule of rules) {
    let allMet = true;
    let score = 0;

    for (const cond of rule.conditions) {
      const value = state.concentrations[cond.hormone] ?? 0;
      const met =
        cond.op === ">" ? value > cond.threshold : value < cond.threshold;

      if (!met) {
        allMet = false;
        break;
      }

      score += Math.abs(value - cond.threshold);
    }

    if (allMet && score > bestScore) {
      bestScore = score;
      bestMatch = rule.name;
    }
  }

  return bestMatch;
};

/**
 * Compute Cubism parameter values from hormone state using direct mappings.
 * Returns a map of parameter name → value.
 */
export const computeCubismParameters = (
  mappings: CubismParameterMapping[],
  state: EndocrineState
): Record<string, number> => {
  const params: Record<string, number> = {};

  for (const mapping of mappings) {
    const value = state.concentrations[mapping.hormone] ?? 0;
    const met =
      mapping.condition === ">"
        ? value > mapping.threshold
        : value < mapping.threshold;

    if (met) {
      // If multiple mappings target the same parameter, last wins
      // (could be improved with weighted blending)
      params[mapping.parameter] = mapping.value;
    }
  }

  return params;
};

/**
 * Find the motion group matching the current cognitive mode.
 */
export const findMotionForMode = (
  manifest: CharacterManifest,
  mode: CognitiveMode
): string | null => {
  for (const mapping of manifest.motionMappings) {
    if (mapping.modes.includes(mode)) {
      return mapping.group;
    }
  }
  return null;
};

/**
 * EndocrineExpressionBridge class — stateful bridge that debounces
 * expression and motion changes on a Live2D model.
 */
export class EndocrineExpressionBridge {
  private lastExpression: string | null = null;
  private lastMotion: string | null = null;
  private manifest: CharacterManifest;

  public constructor(manifest: CharacterManifest) {
    this.manifest = manifest;
  }

  /**
   * Apply endocrine state to the Live2D model.
   * Sets Cubism parameters directly and triggers expression/motion changes.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public apply(state: EndocrineState, mode: CognitiveMode, model: any): void {
    if (!model) return;

    // 1. Evaluate best expression from rules
    const expr = evaluateExpression(this.manifest.expressionRules, state);
    if (expr && expr !== this.lastExpression) {
      try {
        model.expression(expr);
      } catch {
        // Expression may not exist in model — silently skip
      }
      this.lastExpression = expr;
    }

    // 2. Apply direct Cubism parameter mappings
    const params = computeCubismParameters(this.manifest.cubismMappings, state);
    if (model.internalModel?.coreModel) {
      const coreModel = model.internalModel.coreModel;
      for (const [paramName, paramValue] of Object.entries(params)) {
        try {
          const paramIndex = coreModel.getParameterIndex(paramName);
          if (paramIndex >= 0) {
            coreModel.setParameterValueById(paramName, paramValue);
          }
        } catch {
          // Parameter may not exist — silently skip
        }
      }
    }

    // 3. Apply motion for cognitive mode
    const motionGroup = findMotionForMode(this.manifest, mode);
    if (motionGroup && motionGroup !== this.lastMotion) {
      try {
        model.motion(motionGroup, 0, 1); // priority 1 = idle
      } catch {
        // Motion group may not exist — silently skip
      }
      this.lastMotion = motionGroup;
    }
  }

  /** Reset bridge state (e.g., on character switch) */
  public reset(): void {
    this.lastExpression = null;
    this.lastMotion = null;
  }
}
