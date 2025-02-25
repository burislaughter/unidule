import PropTypes from "prop-types";
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./main";
import { EventBus } from "./EventBus";

export const PhaserGame = forwardRef(function PhaserGame({ currentActiveScene }, ref) {
  const game = useRef();

  // ゲームがDOMの外で作成されるのを避けるために、useLayoutEffectフック内でゲームを作成します。
  useLayoutEffect(() => {
    if (game.current === undefined) {
      game.current = StartGame("game-container");

      if (ref !== null) {
        ref.current = { game: game.current, scene: null };
      }
    }

    return () => {
      if (game.current) {
        game.current.destroy(true);
        game.current = undefined;
      }
    };
  }, [ref]);

  useEffect(() => {
    EventBus.on("current-scene-ready", (currentScene) => {
      if (currentActiveScene instanceof Function) {
        currentActiveScene(currentScene);
      }
      ref.current.scene = currentScene;
    });

    return () => {
      EventBus.removeListener("current-scene-ready");
    };
  }, [currentActiveScene, ref]);

  return <div id="game-container"></div>;
});

// Props definitions
PhaserGame.propTypes = {
  currentActiveScene: PropTypes.func,
};
