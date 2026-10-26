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
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
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
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
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
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("localStorage.clear(); location.reload(); true");
  await wait(1400);
  await shot("08-mobile-menu");
  await evaluate("document.getElementById('start-btn').click(); document.getElementById('intro-btn').click(); true");
  await wait(350);
  await shot("09-mobile-play");
  const overlayBefore = JSON.parse(await evaluate("JSON.stringify({shown:document.getElementById('rotate').classList.contains('show'),elapsed:TD.state.elapsed})"));
  await wait(500);
  const overlayAfter = await evaluate("TD.state.elapsed");
  await evaluate("document.getElementById('rotate-btn').click(); true");
  await wait(250);
  await shot("10-mobile-play-dismissed");
  const data = JSON.parse(await evaluate("JSON.stringify({scene:TD.state.scene,rotateShown:document.getElementById('rotate').classList.contains('show'),elapsed:TD.state.elapsed,controlsHidden:document.getElementById('mobile-controls').classList.contains('hidden'),hudHidden:document.getElementById('hud').classList.contains('hidden'),canvasRect:(()=>{const r=document.getElementById('game').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})(),viewport:[innerWidth,innerHeight]})"));
  data.overlayBefore = overlayBefore;
  data.overlayAfter = overlayAfter;
  console.log(JSON.stringify(data));
  ws.close();
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
