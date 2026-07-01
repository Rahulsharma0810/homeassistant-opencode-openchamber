#!/usr/bin/env python3
import urllib.request
import json
import os
import re
import subprocess

def get_latest_version(package):
    url = f"https://registry.npmjs.org/{package}/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "Antigravity-Agent"})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())["version"]

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_path = os.path.join(base_dir, "ha_opencode/config.yaml")
    changelog_path = os.path.join(base_dir, "ha_opencode/CHANGELOG.md")
    readme_path = os.path.join(base_dir, "README.md")
    
    print("Fetching latest NPM package versions...")
    opencode_ver = get_latest_version("opencode-ai")
    chamber_ver = get_latest_version("@openchamber/web")
    new_version = f"{opencode_ver}-{chamber_ver}"
    print(f"Latest OpenCode: {opencode_ver}")
    print(f"Latest OpenChamber: {chamber_ver}")
    print(f"Target Addon Version: {new_version}")
    
    # 1. Read config.yaml
    with open(config_path, "r", encoding="utf-8") as f:
        config_content = f.read()
    
    # Update version key
    old_version_match = re.search(r'^version:\s*"([^"]+)"', config_content, re.MULTILINE)
    if old_version_match:
        old_version = old_version_match.group(1)
        # Strip any existing build suffix for comparison
        # e.g. "1.17.12-1.13.8.1" -> ("1.17.12-1.13.8", "1")
        build_suffix_match = re.match(
            r'^(\d+\.\d+\.\d+-\d+\.\d+\.\d+)\.(\d+)$', old_version
        )
        if build_suffix_match:
            current_base = build_suffix_match.group(1)
            current_build = int(build_suffix_match.group(2))
        else:
            current_base = old_version
            current_build = 0

        if current_base == new_version:
            # Same upstream NPM versions — increment build suffix
            new_version = f"{new_version}.{current_build + 1}"
            print(f"Build suffix increment: {old_version} -> {new_version}")
        else:
            print(f"Upstream version change: {old_version} -> {new_version}")

        config_content = re.sub(
            r'^version:\s*"[^"]+"',
            f'version: "{new_version}"',
            config_content,
            flags=re.MULTILINE
        )
        with open(config_path, "w", encoding="utf-8") as f:
            f.write(config_content)
    else:
        print("Warning: could not find version key in config.yaml")
        old_version = None
        
    # 2. Update CHANGELOG.md if this version entry is missing
    with open(changelog_path, "r", encoding="utf-8") as f:
        changelog_content = f.read()
        
    version_header = f"## {new_version}"
    if version_header not in changelog_content:
        print("Appending new version section to CHANGELOG.md...")
        new_entry = f"""## {new_version}

### 🤖 OpenCode (v{opencode_ver})
- Automated downstream build tracking the latest `opencode-ai` release.

---

### 🔮 OpenChamber (v{chamber_ver})
- Automated downstream build tracking the latest `@openchamber/web` release.

"""
        # Insert after the title header
        header_pattern = r"# Changelog\s*All notable changes to this project will be documented in this file\.\s*\n*"
        match = re.search(header_pattern, changelog_content, re.IGNORECASE)
        if match:
            insert_point = match.end()
            changelog_content = changelog_content[:insert_point] + "\n" + new_entry + changelog_content[insert_point:]
        else:
            changelog_content = "# Changelog\n\n" + new_entry + changelog_content
            
        with open(changelog_path, "w", encoding="utf-8") as f:
            f.write(changelog_content)
        print("Updated CHANGELOG.md")
    else:
        print("Version section already exists in CHANGELOG.md")
        
    # 3. Update badges in README.md
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()
        
    badge_version = new_version.replace("-", "--")
    readme_content = re.sub(
        r'^\[version-shield\]:\s*https://img\.shields\.io/badge/addon-v[0-9.-]+-blue\.svg',
        f"[version-shield]: https://img.shields.io/badge/addon-v{badge_version}-blue.svg",
        readme_content,
        flags=re.MULTILINE
    )
    readme_content = re.sub(
        r'^\[opencode-shield\]:\s*https://img\.shields\.io/badge/opencode--ai-v[0-9.]+-blue\.svg',
        f"[opencode-shield]: https://img.shields.io/badge/opencode--ai-v{opencode_ver}-blue.svg",
        readme_content,
        flags=re.MULTILINE
    )
    readme_content = re.sub(
        r'^\[openchamber-shield\]:\s*https://img\.shields\.io/badge/@openchamber/web-v[0-9.]+-blue\.svg',
        f"[openchamber-shield]: https://img.shields.io/badge/@openchamber/web-v{chamber_ver}-blue.svg",
        readme_content,
        flags=re.MULTILINE
    )
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print(f"Updated badges in README.md: addon=v{new_version}, opencode=v{opencode_ver}, openchamber=v{chamber_ver}")

if __name__ == "__main__":
    main()
