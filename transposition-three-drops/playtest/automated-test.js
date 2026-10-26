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
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
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
  await wait(1400);
  check("page loads", await evaluate("Boolean(window.TD && document.getElementById('game'))"), true);
  check("menu is visible", await evaluate("!document.getElementById('menu').classList.contains('hidden')"), true);
  await shot("01-menu");

  await evaluate("document.getElementById('start-btn').click(); document.getElementById('intro-btn').click(); true");
  await wait(300);
  check("play starts", await evaluate("TD.state.scene === 'play'"), await evaluate("TD.state.scene"));
  check("audio starts", await evaluate("TD.audio.ready && TD.audio.ctx.state === 'running'"), await evaluate("TD.audio.ctx?.state"));
  await shot("02-play");

  const before = await evaluate("JSON.stringify([TD.state.player.x, TD.state.player.y])");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyW'})); true");
  await wait(320);
  await evaluate("window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyW'})); true");
  const after = await evaluate("JSON.stringify([TD.state.player.x, TD.state.player.y])");
  check("movement changes position", before !== after, JSON.parse(after));

  await evaluate("TD.teleport(900, 492); true");
  check("pine is interactable", await evaluate("TD.near()?.type === 'station' && TD.near()?.id === 'pine'"), await evaluate("JSON.stringify(TD.near())"));
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyE'})); window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyE'})); true");
  await wait(200);
  check("pine opens choice", await evaluate("TD.state.scene === 'choice' && TD.state.choiceId === 'pine'"), await evaluate("TD.state.choiceId"));
  await shot("03-choice-pine");
  await evaluate("document.querySelectorAll('#choice-options button')[0].click(); true");
  await wait(220);
  check("pine testimony persists", await evaluate("TD.state.stations.pine.done && TD.state.stations.pine.value === 'cat'"), await evaluate("JSON.stringify(TD.state.stations.pine)"));
  check("save exists after choice", await evaluate("Boolean(localStorage.getItem(TD.SAVE_KEY))"), true);

  await evaluate("TD.teleport(455, 610); window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyE'})); window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyE'})); true");
  await wait(180);
  check("wall opens choice", await evaluate("TD.state.scene === 'choice' && TD.state.choiceId === 'wall'"), await evaluate("TD.state.choiceId"));
  await evaluate("document.querySelectorAll('#choice-options button')[1].click(); true");
  await wait(220);
  check("wall testimony persists", await evaluate("TD.state.stations.wall.done && TD.state.stations.wall.value === 'cat'"), await evaluate("JSON.stringify(TD.state.stations.wall)"));

  await evaluate("TD.teleport(1400, 600); window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyE'})); window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyE'})); true");
  await wait(180);
  check("door opens choice", await evaluate("TD.state.scene === 'choice' && TD.state.choiceId === 'door'"), await evaluate("TD.state.choiceId"));
  await shot("04-choice-door");
  await evaluate("document.querySelectorAll('#choice-options button')[0].click(); true");
  await wait(220);
  check("all testimonies complete", await evaluate("TD.allDone()"), true);
  check("objective changes to return", await evaluate("document.getElementById('objective').textContent.includes('کاج')"), await evaluate("document.getElementById('objective').textContent"));

  await evaluate("TD.openJournal(); true");
  await wait(120);
  check("journal has three entries", await evaluate("document.getElementById('journal-pine').textContent !== 'ثبت نشده.' && document.getElementById('journal-wall').textContent !== 'ثبت نشده.' && document.getElementById('journal-door').textContent !== 'ثبت نشده.'"), [
    await evaluate("document.getElementById('journal-pine').textContent"),
    await evaluate("document.getElementById('journal-wall').textContent"),
    await evaluate("document.getElementById('journal-door').textContent")
  ]);
  await shot("05-journal");
  await evaluate("document.getElementById('journal-btn').click(); true");

  await evaluate("TD.teleport(900, 492); window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyE'})); window.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyE'})); true");
  await wait(180);
  check("final choice opens", await evaluate("TD.state.scene === 'choice' && TD.state.choiceId === 'final'"), await evaluate("TD.state.choiceId"));
  await shot("06-choice-final");
  await evaluate("document.querySelectorAll('#choice-options button')[3].click(); true");
  await wait(260);
  check("ending is shown", await evaluate("TD.state.scene === 'ending' && !document.getElementById('ending').classList.contains('hidden')"), await evaluate("document.getElementById('ending-title').textContent"));
  await shot("07-ending-silence");

  await evaluate("location.reload(); true");
  await wait(1300);
  check("continue is offered", await evaluate("!document.getElementById('continue-btn').classList.contains('hidden')"), true);
  await evaluate("document.getElementById('continue-btn').click(); true");
  await wait(300);
  check("continue restores ending", await evaluate("TD.state.scene === 'ending' && TD.state.final === 'silence'"), await evaluate("TD.state.final"));

  await evaluate("document.getElementById('ending-restart-btn').click(); document.getElementById('intro-btn').click(); true");
  await wait(250);
  check("restart clears progress", await evaluate("!TD.state.final && TD.doneCount() === 0 && TD.state.scene === 'play'"), await evaluate("JSON.stringify({final:TD.state.final,count:TD.doneCount()})"));
  await evaluate("(()=>{const s=TD.state; s.supervisor.x=1000; s.supervisor.y=600; s.supervisor.state='chase'; s.supervisor.chaseTimer=0; s.supervisor.cooldown=0; s.supervisor.suspicion=1; TD.teleport(900,600); return true;})()");
  await wait(1250);
  check("supervisor can catch", await evaluate("TD.state.caughtCount >= 1 && TD.state.supervisor.cooldown > 0"), await evaluate("JSON.stringify({count:TD.state.caughtCount,cooldown:TD.state.supervisor.cooldown,scene:TD.state.scene})"));

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
