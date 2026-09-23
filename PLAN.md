# OpenCode V2: remaining work toward stable 3.0

Updated: 2026-09-23. This is the single shared plan for this work, tracked in Git.
Only open tasks appear as checkboxes; close them with concrete evidence and keep
the remaining list current instead of accumulating historical plans.

## Starting point

- Implementation baseline: `e3b2b71`, including the Ingress session-creation fix,
  released in beta `3.0.0b19` from tag commit `38da0a2`. Storefront version commit
  `e02afa3` is on `main`.
- Published releases: beta `3.0.0b19`, stable `2.5.6`. Stable still uses V1.
- Pins: OpenCode CLI/plugin `2.0.13`, Node `24.15.0`, Prettier `3.9.8`.
  OpenChamber preview `2.0.0-preview.8` is built from commit
  `9fba129ddf968df1e5fb6916b84d3ceb35493198` and its lockfile, independently of
  the backend pin. Its upstream web package reports `1.24.2`.
- Already implemented: one managed V2 backend, non-starting CLI diagnostics,
  credential-isolated agent LSP tools, modern YAML completion fixes, native YAML
  formatting, forward-generation cleanup, and the OpenChamber preview connection.
  Initial amd64 devcontainer, browser Ingress, upgrade-preservation and independent
  UI/backend lifecycle checks passed. b19 CI, native amd64/arm64 boundary builds
  and multi-architecture image publication passed. Full ARM UI/HAOS qualification
  remains open.

## Fixed decisions

- Develop in `ha_opencode_beta`; adopt into `ha_opencode` through a reviewed change.
  Preserve each channel's slug, image identity, data volume and user customizations.
- Ship one pinned V2 runtime. No V1 executable, runtime selector, automatic runtime
  fallback, downgrade path or retained rollback generations. Preserve one-way
  imports, validated atomic forward upgrades and ordinary Home Assistant backups.
- Failed migration must preserve its input and report the failure, never silently
  start another runtime or replace populated state with an empty installation.
- All interfaces use the authenticated s6-owned backend at `127.0.0.1:4100`.
  Keep Supervisor credentials in integration workers and managed backend
  credentials out of model/shell environments, arguments and logs.
- Native `lsp: false` is intentional: `homeassistant.lsp` supplies the agent tools.
  Filesystem snapshots remain disabled by resource policy. Neither flag is itself
  an outstanding defect to fix by simply enabling it.
- **Accepted free-tier limitation (2026-09-23):** `opencode/big-pickle` works with
  the normal Build agent, verified through OpenChamber Ingress and a direct API
  control. The same provider/model still rejects `home-assistant-read-only` with
  "OpenCode's free tier can only be used from within OpenCode". Respect and
  document the restriction; it is not a remediation task or release blocker.
  Use a compatible provider/model for read-only acceptance without weakening the
  agent's permissions. This evidence does not certify every free model.

## 1. Implementation work

- [ ] **I1 — OpenChamber editor LSP.** Connect the editor's diagnostics and
  autocomplete to the credential-isolated HA language server. Agent-facing
  `ha_yaml_*` tools already exist. Preserve sensitive-file, cancellation and
  read-only boundaries; prove actual editor suggestions and diagnostic refresh.
- [ ] **I3 — Provider/configuration parity.** Implement native custom-provider
  and PPQ wiring, validated raw `opencode_config`, and remaining supported user
  environment settings. Preserve reserved credential/policy variables. Verify
  selected requests reach the intended provider/proxy and invalid/missing-key
  configurations have actionable outcomes. Until wired, saved raw config and the
  PPQ proxy option must continue to report their limitations honestly.
- [ ] **I4 — Authenticated LAN access.** Implement remote V2 client attachment,
  CORS and OpenChamber LAN access against the existing managed backend. The saved
  LAN options currently have inactive services. Test authentication, allowed and
  rejected browser origins, client attachment and service ownership.
- [ ] **I5 — Finish obsolete-artifact cleanup.** Inventory unused SDK dependencies,
  generated files, caches, helpers and s6 definitions. Remove only superseded
  app-owned artifacts after required data is preserved. Keep user SSH files,
  customized skills and HA configuration. Confirm the intended compatibility
  lifetime of `opencode2`; it already aliases the same V2 client. V1 execution
  and rollback-generation retention are already removed.
- [ ] **I6 — Stable-channel adoption.** After feature and upgrade qualification,
  port the V2-only implementation into `ha_opencode`, preserving stable identity
  and its own data. Review the disabled promotion helper and channel-specific
  build/release paths rather than mechanically copying beta over stable.
- [ ] **I7 — Release preparation.** After qualification, update version metadata,
  public docs/translations and changelogs to match implemented behavior. Publish
  the exact approved images and verify manifests and storefront metadata agree.
- [ ] **I8 — App-aware update notification.** OpenChamber's OpenCode notice still
  advertises upstream versions with generic installer instructions. Make it
  accurately explain Home Assistant app-managed updates; upstream availability
  must not imply an available app update or an in-place runtime upgrade.

## 2. Investigation and operational work

These need diagnosis or access to an affected environment; they are not merely
unchecked tests. Record the cause before adding an implementation fix.

- [ ] **D1 — Installation-specific Zigbee hangs.** Reproduce bounded
  `zigporter check` and `zigporter inspect ... --json` on the affected HAOS/ZHA
  installation. Identify the request/discovery/authentication step that hangs,
  then fix or integrate an upstream correction and pin it. The local no-ZHA
  instance returns within five seconds; unbounded WebSocket receives in installed
  zigporter `1.4.2` are a lead, not an established cause.
- [ ] **D2 — Diagnostic-created extra daemon.** On the affected installation,
  identify the extra process's PID, owner, start time, endpoint and data roots.
  Establish whether it wrote separate session data before controlled cleanup.
  Preserve the conversation server and its sessions; never kill by a broad
  process-name match. New CLI non-starting behavior is already verified locally.
- [ ] **D3 — Desktop-browser tool connection.** Establish and document the
  supported browser connection/deployment model; configure or integrate what is
  missing. Then test navigation, clicking, debugging and advertised subtools with
  a connected test browser. HA screenshots and the OpenChamber Chromium smoke
  test are separate capabilities, not evidence for these model-facing tools.
- [ ] **D4 — Interrupted web searches.** Capture bounded cancellation/deadline
  evidence with a controlled provider and demonstrate a completed search. Fix
  any confirmed defect. Cancelled requests do not prove provider failure, and
  successful direct web fetching does not establish search coverage.

## 3. Verification of implemented features

These items currently represent missing evidence rather than known missing
functionality. If a check fails, add a specific implementation or investigation
item instead of treating all untested behavior as broken.

- [ ] **V1 — Full OpenChamber workflow.** Verify real model streaming, reconnects,
  permission dialogs, UI editing, model/provider selection, OAuth and image-owned
  update behavior. Initial browser load, shared history/policy, Ingress assets,
  service-worker suppression, absent-backend recovery and independent UI stop/start
  already passed on amd64. Qualify the remaining scenarios on both architectures.
  Post-b18 session-creation fix: reproduced HTTP 400 from chunked Ingress POSTs;
  the preview retained Transfer-Encoding while adding Content-Length. Corrected
  framing (including empty JSON) passed the actual-preview HTTP regression, real
  Core Ingress session create/read/delete, and a first UI message with a displayed
  `opencode/big-pickle` reply. Standard Supervisor acceptance passed after restoring
  terminal mode. This correction is published in beta `3.0.0b19`.
- [ ] **V2 — Agent LSP coverage.** Verify live hover/definition and entity/service
  completion, including realistic modern and legacy YAML positions. Exercise
  LSP-disabled, MCP-disabled, restart/recovery and cancellation behavior under
  supervision. Modern trigger fixtures, authenticated health and unknown-entity/
  service diagnostics with corrected-draft refresh already pass. I1's editor
  surface needs its own acceptance when implemented.
- [ ] **V3 — Persistent customizations and options.** Verify user-edited skills
  and instructions survive restarts and upgrades and actually reach sessions.
  Finish presentation, focus/context and startup-hook option checks, including
  clear unsupported combinations. Persistent skill discovery is already wired.
- [ ] **V4 — Representative forward upgrades and backup/restore.** Exercise
  stable `2.5.6`, earlier beta and b17 data, preserving sessions, V2 credentials,
  permission rules, decision notes and supported customizations. Verify normal
  HA backup/restore, interrupted conversion, visible failure and retry. Existing
  synthetic preservation/pruning checks pass; no rollback generation is required.
  Legacy V1 provider credentials require fresh V2 sign-in.
- [ ] **V5 — Providers and MCP.** Verify real API-key/OAuth sign-in and refresh,
  native and inbound MCP, and compact/configuration/full profiles. Check disabled
  options and read-only permissions at dispatch. Account-dependent flows remain
  pending until a suitable test account is available; I3's new provider wiring
  must receive its own live checks before being declared complete.
- [ ] **V6 — End-to-end HA work and recovery.** Exercise approved config writes,
  formatting, validation/reload and read-only load verification; failed writes;
  context delivery/compaction; app restart; sidecar/server crashes; plugin reload;
  and session resume. Native formatting already preserves HA YAML tags and user
  preferences and respects disabled formatting/read-only edits in runtime tests.
- [ ] **V7 — Remaining tool surfaces.** Exercise MCP resources/prompts and
  permitted subagents, with read-only denials where applicable. Use controlled
  scenarios for device control, firmware/updates, deletion and secret rotation.
  Record unavailable hardware/account prerequisites explicitly. Browser/search
  acceptance follows the findings in D3/D4.
- [ ] **V8 — Exact-candidate platform qualification.** Run final official
  devcontainer lifecycle acceptance and native amd64/arm64 CI on the actual
  candidate. Verify the stable adoption too; earlier b17 results do not qualify
  the later V2-only implementation automatically.
  Beta b19 evidence: PR Checks `35819838518` and native release build/publication
  `35819967061` passed. Published amd64/arm64 manifest digest:
  `sha256:685fb6bb1e6c67841cc80769a81d9ec1ff885f45600f4fea9e8f4fbcf62ccc48`.
  Repeat qualification for subsequent runtime changes and the stable candidate.
- [ ] **V9 — HAOS acceptance and soak.** Complete controlled HAOS acceptance on
  both architectures, then seven days of representative operation on each.
  Record versions, tool failures, crashes/restarts, orphan processes, resource
  growth and session continuity. Close blocking defects before I7's release.

## Execution order

1. Implement I1, I3 and I4 with focused acceptance; finish I5 and I8 alongside them.
2. Investigate D1–D4 when the necessary installation/account/browser is available.
3. Close V1–V7, recording scenario evidence and precise blockers. Run checks for
   implemented features while independent implementation work proceeds.
4. Perform reviewed stable adoption I6, then exact-candidate V8 and HAOS V9.
5. Complete I7 and approve stable 3.0 only after remaining blockers are closed.

## Working and verification references

- Follow `AGENTS.md`, `.devcontainer/devcontainer.json` and `.vscode/tasks.json`.
  Supervisor/s6 evidence comes from the official HA Apps devcontainer, not host
  Docker or local emulation. The devcontainer is not HAOS.
- Use `scripts/devcontainer-build-app.sh ha_opencode_beta` for working-tree images
  via the **Rebuild and Start App** task. Do not use `ha apps rebuild --force`.
- Existing acceptance entry points:
  - `scripts/devcontainer-acceptance.sh ha_opencode_beta`
  - `scripts/devcontainer-cli-acceptance.py` (`HA_MANAGED_CLI_ACCEPTANCE=1`)
  - `scripts/devcontainer-lsp-acceptance.mjs` inside the app (`HA_LSP_ACCEPTANCE=1`)
  - `scripts/devcontainer-openchamber-acceptance.py` (`HA_OPENCHAMBER_ACCEPTANCE=1`;
    includes the real Core Ingress browser/session check; additionally set
    `HA_OPENCHAMBER_MODEL_ACCEPTANCE=1` for a real free-model first-message check)
  - `ha_opencode_beta/test/openchamber-request-body.mjs` runs against the pinned
    preview during image builds, checking chunked/fixed-length request forwarding.
  - `ha_opencode_beta/test/v2-forward-fixture.py` and `v2-upgrade-acceptance.py`
- Run the smallest relevant source/runtime check per change. Repeat passing
  checks only when later edits affect them. Reserve broad and multi-architecture
  runs for candidate qualification or architecture/packaging changes.
- Record evidence next to the item: commit/image, architecture, HA/Core versions,
  scenario/command, outcome and residual gap. Do not store credentials here.
- Upstream references: [configuration](https://opencode.ai/v2/docs/config),
  [plugins](https://opencode.ai/v2/docs/build/plugins),
  [migration](https://opencode.ai/v2/docs/migrate-v1),
  [permissions](https://opencode.ai/v2/docs/permissions).
