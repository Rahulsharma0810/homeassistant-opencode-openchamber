// Exact preview-source patches: app supervision and process-private credentials.
const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
function patch(file, before, after) {
  const target = path.join(root, "server/lib/opencode", file);
  const source = fs.readFileSync(target, "utf8");
  if (source.split(before).length !== 2) throw new Error(`Unexpected preview source: ${file}`);
  fs.writeFileSync(target, source.replace(before, after));
}
patch("hmr-state-runtime.js", `const initialPassword = typeof processLike.env.OPENCODE_SERVER_PASSWORD === 'string'
      ? processLike.env.OPENCODE_SERVER_PASSWORD.trim()
      : '';`, `const initialPassword = globalThis[Symbol.for("ha.openchamber.credential")] || '';`);
patch("auth-state-runtime.js", "process.env.OPENCODE_SERVER_PASSWORD = normalized;",
  "// The HA app keeps this credential in process-owned state only.");
patch("lifecycle.js", "const startOpenCode = async () => {",
  `const startOpenCode = async () => {
    throw new Error('OpenCode is managed by Home Assistant; use the app controls');`);
console.log("OpenChamber uses the app-owned backend and process-private authentication");
