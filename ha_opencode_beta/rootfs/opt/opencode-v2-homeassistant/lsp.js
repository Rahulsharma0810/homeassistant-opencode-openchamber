import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { createConnection } from "node:net";
import { once } from "node:events";
import { posix } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { Plugin } from "@opencode/plugin";
import { createMessageConnection, StreamMessageReader, StreamMessageWriter } from "vscode-jsonrpc/node.js";

export const LSP_PLUGIN_ID = "homeassistant.lsp";
export const LSP_SOCKET = "/run/opencode-v2/lsp.sock";
export const MAX_DOCUMENT_BYTES = 1024 * 1024;
const WORKSPACE = "/homeassistant";
const METHODS = {
  diagnostics: "textDocument/diagnostic", completions: "textDocument/completion",
  hover: "textDocument/hover", definition: "textDocument/definition",
};

export function documentPath(input, root = WORKSPACE) {
  if (typeof input !== "string" || input.includes("\0") || input.includes("\\")) throw new Error("A YAML path is required");
  const path = posix.resolve(root, input);
  if (!path.startsWith(`${root}/`) || !/\.ya?ml$/.test(path)) throw new Error("LSP files must be YAML inside the Home Assistant workspace");
  const parts = path.slice(root.length + 1).split("/");
  if (parts.some((part) => [".storage", ".cloud", "ssl"].includes(part)) || path.endsWith("secrets.yaml")) {
    throw new Error("LSP access to sensitive files is denied");
  }
  return path;
}

export async function readDocument(input, text, root = WORKSPACE) {
  const path = documentPath(input, root);
  if (text !== undefined) {
    if (typeof text !== "string" || Buffer.byteLength(text) > MAX_DOCUMENT_BYTES) throw new Error("LSP document exceeds its size limit");
    return { path, text };
  }
  const handles = [];
  try {
    // Directory descriptors anchor every component. Never traverse a symlink
    // (including one swapped while the path is being opened) into private state.
    let parent = await open(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    handles.push(parent);
    const parts = path.slice(root.length + 1).split("/");
    for (const part of parts.slice(0, -1)) {
      parent = await open(`/proc/self/fd/${parent.fd}/${part}`, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
      handles.push(parent);
    }
    const file = await open(`/proc/self/fd/${parent.fd}/${parts.at(-1)}`, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    handles.push(file);
    const info = await file.stat();
    if (!info.isFile() || info.size > MAX_DOCUMENT_BYTES) throw new Error("LSP requires a bounded regular YAML file");
    const buffer = Buffer.alloc(MAX_DOCUMENT_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    if (bytesRead > MAX_DOCUMENT_BYTES) throw new Error("LSP document exceeds its size limit");
    return { path, text: buffer.subarray(0, bytesRead).toString("utf8") };
  } finally {
    await Promise.all(handles.map((file) => file.close()));
  }
}

export async function requestLsp(method, document, position, signal, socketPath = LSP_SOCKET) {
  const deadline = AbortSignal.timeout(15000);
  const cancellation = signal ? AbortSignal.any([signal, deadline]) : deadline;
  cancellation.throwIfAborted();
  const socket = createConnection(socketPath);
  let connection;
  const abort = () => {
    // Closing the stream alone does not settle vscode-jsonrpc's pending calls.
    connection?.dispose();
    socket.destroy(new Error("LSP request cancelled"));
  };
  socket.on("error", () => {});
  cancellation.addEventListener("abort", abort, { once: true });
  try {
    await once(socket, "connect", { signal: cancellation });
    cancellation.throwIfAborted();
    connection = createMessageConnection(new StreamMessageReader(socket), new StreamMessageWriter(socket));
    connection.onClose(() => connection.dispose());
    connection.onNotification("window/logMessage", () => {});
    connection.onNotification("textDocument/publishDiagnostics", () => {});
    connection.listen();
    await connection.sendRequest("initialize", { processId: null, rootUri: pathToFileURL(WORKSPACE).href, capabilities: {} });
    await connection.sendNotification("initialized", {});
    let result;
    if (method === "homeassistant/health") {
      result = await connection.sendRequest(method);
    } else {
      const uri = pathToFileURL(document.path).href;
      await connection.sendNotification("textDocument/didOpen", { textDocument: { uri, languageId: "yaml", version: 1, text: document.text } });
      result = await connection.sendRequest(method, { textDocument: { uri }, ...(position ? { position } : {}) });
      await connection.sendNotification("textDocument/didClose", { textDocument: { uri } });
    }
    await connection.sendRequest("shutdown");
    await connection.sendNotification("exit");
    return result;
  } finally {
    cancellation.removeEventListener("abort", abort);
    connection?.dispose();
    socket.destroy();
  }
}

export function createLspSetup({ request = requestLsp, load = readDocument } = {}) {
  return async (ctx) => {
    const registration = await ctx.tool.transform((editor) => {
      editor.add({
        name: "ha_yaml_status", description: "Check the real Home Assistant YAML language server and its authenticated HA connection.",
        input: { type: "object", properties: {}, additionalProperties: false },
        options: { codemode: false, permission: "lsp" },
        execute: async (_input, context) => ({ content: JSON.stringify(await request("homeassistant/health", null, null, context.signal)) }),
      });
      for (const [name, method] of Object.entries(METHODS)) {
        const positioned = name !== "diagnostics";
        editor.add({
          name: `ha_yaml_${name}`,
          description: `Home Assistant YAML ${name} through the credential-isolated language server. Reads a workspace file or validates supplied in-memory text; never writes files. Positions use zero-based lines and UTF-16 character offsets.`,
          input: {
            type: "object", additionalProperties: false,
            properties: {
              path: { type: "string", description: "YAML path relative to /homeassistant, or an absolute path inside it" },
              text: { type: "string", description: "Optional in-memory YAML draft; no file is written" },
              ...(positioned ? { line: { type: "integer", minimum: 0 }, character: { type: "integer", minimum: 0 } } : {}),
            },
            required: positioned ? ["path", "line", "character"] : ["path"],
          },
          options: { codemode: false, permission: "lsp" },
          execute: async (input, context) => {
            const document = await load(input.path, input.text);
            const lines = document.text.split("\n");
            if (positioned && (!Number.isInteger(input.line) || !Number.isInteger(input.character) || input.line < 0 || input.line >= lines.length || input.character < 0 || input.character > lines[input.line].length)) {
              throw new Error("LSP position is outside the document");
            }
            let result = await request(method, document, positioned ? { line: input.line, character: input.character } : null, context.signal);
            if (name === "definition" && result) {
              const entries = Array.isArray(result) ? result : [result];
              result = entries.filter((entry) => {
                try { documentPath(fileURLToPath(entry.uri ?? entry.targetUri)); return true; } catch { return false; }
              });
            }
            const items = Array.isArray(result) ? result : result?.items;
            const total = items?.length;
            if (items) result = Array.isArray(result) ? items.slice(0, 100) : { ...result, items: items.slice(0, 100) };
            const content = JSON.stringify({ path: document.path, result, ...(total !== undefined ? { total, truncated: total > 100 } : {}) });
            if (Buffer.byteLength(content) > 256 * 1024) throw new Error("LSP response is too large; use a more specific query");
            return { content };
          },
        });
      }
    });
    try {
      // Materialize the registry during activation so the first request sees
      // the registered tools, and fail visibly if the pinned API rejects them.
      const registered = new Set((await ctx.tool.list()).map((tool) => tool.id));
      const names = ["ha_yaml_status", ...Object.keys(METHODS).map((name) => `ha_yaml_${name}`)];
      if (names.some((name) => !registered.has(name))) throw new Error("LSP tool registration is incomplete");
      console.info(`Home Assistant LSP registered tools: ${names.join(", ")}`);
    } catch (error) {
      await registration.dispose();
      throw error;
    }
    return () => registration.dispose();
  };
}

export default Plugin.define({ id: LSP_PLUGIN_ID, setup: createLspSetup() });
