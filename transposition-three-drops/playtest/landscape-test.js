const http = require("http");
const fs = require("fs");
const path = require("path");

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on("error", reject);
  });
}

async function main() {
  const targets = await getJson("http://127.0.0.1:9223/json");
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("No page target");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let nextId = 1;
  const pending = new Map();
  const exceptions = [];
  const consoleErrors = [];
  const results = [];
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.text + " " + (message.params.exceptionDetails.exception?.description || ""));
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description || "").join(" "));
    }
  };
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  function send(method, params) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function shot(name) {
    const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    const dir = path.join(__dirname, "evidence");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.png`), Buffer.from(result.data, "base64"));
  }
  function check(name, condition, detail) {
    results.push({ name, pass: Boolean(condition), detail });
  }

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await evaluate("localStorage.clear(); location.reload(); true");
  await wait(1300);
  await evaluate("document.getElementById('start-btn').click(); document.getElementById('intro-btn').click(); true");
  await wait(400);

  const layout = JSON.parse(await evaluate(`JSON.stringify({
    scene: TD.state.scene,
    rotateShown: document.getElementById('rotate').classList.contains('show'),
    controlsHidden: document.getElementById('mobile-controls').classList.contains('hidden'),
    hudHidden: document.getElementById('hud').classList.contains('hidden'),
    canvasRect: (() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })(),
    viewport: [innerWidth, innerHeight]
  })`));
  check("landscape play is visible without rotate prompt", layout.scene === "play" && !layout.rotateShown && !layout.controlsHidden && !layout.hudHidden, layout);
  await shot("15-mobile-landscape");

  const before = await evaluate("JSON.stringify([TD.state.player.x, TD.state.player.y])");
  await evaluate(`(() => {
    const button = document.querySelector('[data-move="up"]');
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch' }));
    return true;
  })()`);
  await wait(420);
  await evaluate(`(() => {
    const button = document.querySelector('[data-move="up"]');
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch' }));
    return true;
  })()`);
  await wait(150);
  const after = await evaluate("JSON.stringify([TD.state.player.x, TD.state.player.y])");
  check("touch dpad moves player", before !== after, { before: JSON.parse(before), after: JSON.parse(after) });

  await evaluate("TD.teleport(900, 492); true");
  await evaluate(`(() => {
    const button = document.querySelector('[data-action="interact"]');
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, pointerType: 'touch' }));
    return true;
  })()`);
  await wait(180);
  const touchChoice = JSON.parse(await evaluate(`JSON.stringify({
    scene: TD.state.scene,
    choiceId: TD.state.choiceId
  })`));
  check("touch interact opens station choice", touchChoice.scene === "choice" && touchChoice.choiceId === "pine", touchChoice);
  await shot("16-mobile-landscape-choice");

  check("no page exceptions", exceptions.length === 0, exceptions);
  check("no console errors", consoleErrors.length === 0, consoleErrors);

  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ results, failed, exceptions, consoleErrors }, null, 2));
  ws.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
