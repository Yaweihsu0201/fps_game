import { createScene } from "./createScene.js";

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true
});

const scene = createScene(engine, canvas);

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
