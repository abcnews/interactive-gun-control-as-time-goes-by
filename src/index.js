/** @jsx h */

import { h, render } from "preact";
import { whenOdysseyLoaded } from "@abcnews/env-utils";
import App from "./components/App";

const PROJECT_NAME = "joyplot";
let root;

async function init() {
  await whenOdysseyLoaded;

  root = document.getElementById("interactivemount");
  const elemJoyplot = document.getElementById("joyplot");
  const elemStacked = document.getElementById("stacked");
  const elemControl = document.getElementById("control");
  const elemVegas = document.getElementById("vegas");

  const elements = [elemJoyplot, elemStacked, elemControl, elemVegas];

  elements.forEach(element => {
    if (element) {
      element.classList.add("u-full");
    }
  });

  draw(elemJoyplot, "joyplot");
  draw(elemStacked, "stacked");
  draw(elemControl, "control");
  draw(elemVegas, "vegas");
}

function draw(element, type) {
  render(<App type={type} />, element);
}

init();

// Magic hot reload stuff
if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require("./components/ErrorBox");

      render(<ErrorBox error={err} />, root);
    }
  });
}

if (process.env.NODE_ENV === "development") {
  require("preact/devtools");

  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
