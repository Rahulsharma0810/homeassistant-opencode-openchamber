#!/usr/bin/env python3
import json
import re
import sys
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
STABLE_BUILD = ROOT / "ha_opencode" / "build.yaml"
BETA_BUILD = ROOT / "ha_opencode_beta" / "build.yaml"


def get_latest_version(package_name: str) -> str:
    url = f"https://registry.npmjs.org/{package_name}/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "opencode-addon-ci"})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode("utf-8"))
    return data["version"]


def get_pinned_version(path: Path, key: str):
    pattern = re.compile(rf"^\s*{re.escape(key)}:\s*\"([^\"]+)\"\s*$")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            return match.group(1)
    return None


def set_pinned_version(path: Path, key: str, value: str) -> bool:
    pattern = re.compile(rf"^(\s*{re.escape(key)}:\s*\")[^\"]+(\"\s*)$")
    changed = False
    out_lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            new_line = f"{match.group(1)}{value}{match.group(2)}"
            out_lines.append(new_line)
            changed = changed or (new_line != line)
        else:
            out_lines.append(line)
    if changed:
        path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    return changed


def main() -> int:
    update = "--update" in sys.argv

    latest_opencode = get_latest_version("opencode-ai")
    latest_openchamber = get_latest_version("@openchamber/web")

    stable_opencode = get_pinned_version(STABLE_BUILD, "OPENCODE_VERSION")
    stable_openchamber = get_pinned_version(STABLE_BUILD, "OPENCHAMBER_VERSION")
    beta_opencode = get_pinned_version(BETA_BUILD, "OPENCODE_VERSION")
    beta_openchamber = get_pinned_version(BETA_BUILD, "OPENCHAMBER_VERSION")

    needs_update = (
        stable_opencode != latest_opencode
        or beta_opencode != latest_opencode
        or (stable_openchamber is not None and stable_openchamber != latest_openchamber)
        or (beta_openchamber is not None and beta_openchamber != latest_openchamber)
    )

    print(f"Latest opencode-ai: {latest_opencode}")
    print(f"Latest @openchamber/web: {latest_openchamber}")
    print(f"Pinned stable: OPENCODE_VERSION={stable_opencode}, OPENCHAMBER_VERSION={stable_openchamber}")
    print(f"Pinned beta:   OPENCODE_VERSION={beta_opencode}, OPENCHAMBER_VERSION={beta_openchamber}")

    if not update:
        if needs_update:
            print("Update required")
            return 2
        print("No update required")
        return 0

    changed = False
    changed = set_pinned_version(STABLE_BUILD, "OPENCODE_VERSION", latest_opencode) or changed
    if stable_openchamber is not None:
        changed = set_pinned_version(STABLE_BUILD, "OPENCHAMBER_VERSION", latest_openchamber) or changed
    changed = set_pinned_version(BETA_BUILD, "OPENCODE_VERSION", latest_opencode) or changed
    if beta_openchamber is not None:
        changed = set_pinned_version(BETA_BUILD, "OPENCHAMBER_VERSION", latest_openchamber) or changed

    if changed:
        print("Updated build.yaml pins")
    else:
        print("Pins already up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
