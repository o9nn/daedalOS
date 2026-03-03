import styled from "styled-components";

const StyledLive2DAvatar = styled.div`
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;

  .avatar-canvas-container {
    flex: 1;
    min-height: 0;
    position: relative;

    canvas {
      display: block;
      height: 100%;
      width: 100%;
    }
  }

  .endocrine-panel {
    background: rgba(0, 0, 0, 0.85);
    border-top: 1px solid rgba(100, 200, 255, 0.2);
    color: #e0e0e0;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 11px;
    height: 180px;
    overflow-y: auto;
    padding: 8px 12px;

    .panel-header {
      align-items: center;
      border-bottom: 1px solid rgba(100, 200, 255, 0.15);
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 6px;
      padding-bottom: 4px;

      .character-name {
        color: #64c8ff;
        font-size: 13px;
        font-weight: bold;
      }

      .cognitive-state {
        color: #ff9f43;
        font-size: 11px;
      }

      .cognitive-mode {
        border: 1px solid;
        border-radius: 3px;
        font-size: 10px;
        padding: 1px 6px;

        &.RESTING { border-color: #4a9; color: #4a9; }
        &.EXPLORATORY { border-color: #49f; color: #49f; }
        &.FOCUSED { border-color: #f94; color: #f94; }
        &.STRESSED { border-color: #f44; color: #f44; }
        &.SOCIAL { border-color: #f4a; color: #f4a; }
        &.REFLECTIVE { border-color: #a4f; color: #a4f; }
        &.VIGILANT { border-color: #fa4; color: #fa4; }
        &.MAINTENANCE { border-color: #888; color: #888; }
        &.REWARD { border-color: #4f4; color: #4f4; }
        &.THREAT { border-color: #f22; color: #f22; }
      }
    }

    .hormone-grid {
      display: grid;
      gap: 2px 8px;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

      .hormone-row {
        align-items: center;
        display: flex;
        gap: 6px;

        .hormone-name {
          color: #aaa;
          min-width: 90px;
          text-transform: uppercase;
        }

        .hormone-bar {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          flex: 1;
          height: 8px;
          overflow: hidden;
          position: relative;

          .hormone-fill {
            border-radius: 2px;
            height: 100%;
            transition: width 0.5s ease;

            &.cortisol { background: #f44; }
            &.dopamine_tonic { background: #4f4; }
            &.dopamine_phasic { background: #8f8; }
            &.serotonin { background: #49f; }
            &.norepinephrine { background: #fa4; }
            &.oxytocin { background: #f4a; }
            &.t3_t4 { background: #ff4; }
            &.anandamide { background: #4fa; }
            &.crh { background: #f66; }
            &.acth { background: #f88; }
            &.melatonin { background: #66f; }
            &.insulin { background: #a8f; }
            &.glucagon { background: #fa8; }
            &.il6 { background: #f8a; }
          }
        }

        .hormone-value {
          color: #888;
          min-width: 32px;
          text-align: right;
        }
      }
    }
  }

  .character-selector {
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    gap: 8px;
    justify-content: center;
    padding: 6px;

    button {
      background: rgba(100, 200, 255, 0.1);
      border: 1px solid rgba(100, 200, 255, 0.3);
      border-radius: 4px;
      color: #e0e0e0;
      cursor: pointer;
      font-size: 12px;
      padding: 4px 16px;
      transition: all 0.2s;

      &:hover {
        background: rgba(100, 200, 255, 0.2);
        border-color: rgba(100, 200, 255, 0.5);
      }

      &.active {
        background: rgba(100, 200, 255, 0.3);
        border-color: #64c8ff;
        color: #fff;
      }
    }
  }

  .interaction-hint {
    bottom: 190px;
    color: rgba(255, 255, 255, 0.3);
    font-size: 10px;
    left: 50%;
    position: absolute;
    text-align: center;
    transform: translateX(-50%);
  }
`;

export default StyledLive2DAvatar;
