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
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate("localStorage.clear(); location.reload(); true");
  await wait(1300);

  const gate = JSON.parse(await evaluate(`(() => {
    document.getElementById('start-btn').click();
    document.getElementById('intro-btn').click();
    TD.openChoice('final');
    return JSON.stringify({
      scene: TD.state.scene,
      toastHidden: document.getElementById('toast').classList.contains('hidden'),
      toast: document.getElementById('toast').textContent
    });
  })()`));
  check("final choice is gated before all testimonies", gate.scene === "play" && !gate.toastHidden, gate);

  await evaluate(`(() => {
    TD.resolveChoice('pine', 'cat');
    TD.save();
    location.reload();
  })()`);
  await wait(1300);
  await evaluate("document.getElementById('continue-btn').click(); true");
  await wait(300);
  const persistedState = JSON.parse(await evaluate(`JSON.stringify({
    scene: TD.state.scene,
    pineDone: TD.state.stations.pine.done,
    pineValue: TD.state.stations.pine.value,
    final: TD.state.final
  })`));
  check("intermediate save restores testimony", persistedState.scene === "play" && persistedState.pineDone && persistedState.pineValue === "cat" && !persistedState.final, persistedState);

  const checkpoint = JSON.parse(await evaluate(`(() => {
    TD.state.player.x = 120;
    TD.state.player.y = 400;
    TD.caught();
    return JSON.stringify({
      x: TD.state.player.x,
      y: TD.state.player.y,
      checkpoint: TD.state.checkpoint,
      caughtCount: TD.state.caughtCount
    });
  })()`));
  check("caught returns player to checkpoint", checkpoint.x === checkpoint.checkpoint.x && checkpoint.y === checkpoint.checkpoint.y && checkpoint.caughtCount === 1, checkpoint);

  const mute = JSON.parse(await evaluate(`(() => {
    TD.setMuted(true);
    const muted = { state: TD.state.settings.muted, audio: TD.audio.muted };
    TD.setMuted(false);
    return JSON.stringify({ muted, restored: { state: TD.state.settings.muted, audio: TD.audio.muted } });
  })()`));
  check("mute toggles state and audio", mute.muted.state && mute.muted.audio && !mute.restored.state && !mute.restored.audio, mute);

  const rtl = JSON.parse(await evaluate(`JSON.stringify({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir
  })`));
  check("document is Persian RTL", rtl.lang === "fa" && rtl.dir === "rtl", rtl);

  const keys = ["cat", "hoopoe", "self", "silence"];
  const endings = [];
  for (const key of keys) {
    const data = JSON.parse(await evaluate(`(() => {
      TD.startNew();
      TD.beginPlay();
      TD.resolveChoice('pine', 'cat');
      TD.resolveChoice('wall', 'hoopoe');
      TD.resolveChoice('door', 'self');
      TD.openChoice('final');
      const options = Array.from(document.querySelectorAll('#choice-options button'));
      const index = TD.CHOICES.final.options.findIndex((option) => option.value === '${key}');
      options[index].click();
      return JSON.stringify({
        key: '${key}',
        expectedTitle: TD.ENDINGS['${key}'].title,
        scene: TD.state.scene,
        final: TD.state.final,
        title: document.getElementById('ending-title').textContent,
        text: document.getElementById('ending-text').textContent,
        stats: document.getElementById('ending-stats').textContent,
        visible: !document.getElementById('ending').classList.contains('hidden')
      });
    })()`));
    endings.push(data);
    await wait(220);
    await shot(`1${keys.indexOf(key) + 1}-ending-${key}`);
    check(`ending ${key} renders`, data.scene === "ending" && data.final === key && data.visible && data.title === data.expectedTitle && data.text.length > 40, data);
  }
  check("four endings have distinct titles", new Set(endings.map((ending) => ending.title)).size === 4, endings.map((ending) => ending.title));

  await evaluate("location.reload(); true");
  await wait(1300);
  await evaluate("document.getElementById('continue-btn').click(); true");
  await wait(250);
  const endingContinue = JSON.parse(await evaluate(`JSON.stringify({
    scene: TD.state.scene,
    final: TD.state.final,
    visible: !document.getElementById('ending').classList.contains('hidden')
  })`));
  check("ending continue restores final ending", endingContinue.scene === "ending" && endingContinue.final === "silence" && endingContinue.visible, endingContinue);

  check("no page exceptions", exceptions.length === 0, exceptions);
  check("no console errors", consoleErrors.length === 0, consoleErrors);

  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ results, endings, failed, exceptions, consoleErrors }, null, 2));
  ws.close();
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
