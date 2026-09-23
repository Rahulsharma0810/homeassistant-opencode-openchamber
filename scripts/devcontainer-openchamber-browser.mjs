// Called by the official-devcontainer acceptance driver. Ingress credentials
// arrive over stdin, never via command arguments, environment or output.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire("/opt/ha-mcp-server/package.json");
const puppeteer = require("puppeteer-core");
let input = "";
for await (const chunk of process.stdin) input += chunk;
const { entry, session } = JSON.parse(input);
assert.match(entry, /^\/api\/hassio_ingress\/[^/]+\/?$/);
const base = entry.replace(/\/$/, "") + "/";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const page = await browser.newPage();
  await page.setCookie({ name: "ingress_session", value: session, domain: "homeassistant", path: "/" });
  const errors = [];
  const escaped = [];
  const successful = new Set();
  page.on("pageerror", (error) => errors.push(error.name));
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname !== "homeassistant") return;
    if (response.ok() && url.pathname.startsWith(base)) successful.add(url.pathname.slice(base.length));
    if ((url.pathname.startsWith("/assets/") || url.pathname.startsWith("/api/")) && !url.pathname.startsWith(base)) escaped.push(response.status());
  });
  const response = await page.goto(`http://homeassistant:8123${base}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, { timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 5000));
  assert.equal(errors.length, 0, `Preview page raised ${errors.length} JavaScript errors`);
  assert.equal(escaped.length, 0, `Preview made ${escaped.length} requests outside its Ingress prefix`);
  assert.ok([...successful].some((path) => path.startsWith("assets/") && path.endsWith(".js")), "No preview JavaScript loaded through Ingress");
  assert.ok([...successful].some((path) => path.startsWith("api/")), "No preview API request succeeded through Ingress");
  const workers = await page.evaluate(async () => "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0);
  assert.equal(workers, 0, "Ingress must not register an origin-scoped service worker");
  console.log("PASS: Chromium loaded the preview and APIs through Core Ingress without escaping paths, JS errors or service workers");
} finally {
  await browser.close();
}
