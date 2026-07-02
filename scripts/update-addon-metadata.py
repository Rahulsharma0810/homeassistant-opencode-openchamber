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
        if old_version == new_version:
            print("Addon version matches latest NPM releases. No update needed for config.yaml.")
        else:
            config_content = re.sub(
                r'^version:\s*"[^"]+"',
                f'version: "{new_version}"',
                config_content,
                flags=re.MULTILINE
            )
            with open(config_path, "w", encoding="utf-8") as f:
                f.write(config_content)
            print(f"Updated config.yaml version: {old_version} -> {new_version}")
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
        
    # 3. Update version badge in README.md
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()
        
    # Replace badges/version
    badge_version = new_version.replace("-", "--")
    new_badge_shield = f"[version-shield]: https://img.shields.io/badge/version-v{badge_version}-blue.svg"
    readme_content = re.sub(
        r'^\[version-shield\]:\s*https://img\.shields\.io/badge/version-v[0-9.-]+-blue\.svg',
        new_badge_shield,
        readme_content,
        flags=re.MULTILINE
    )
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print(f"Updated version badge in README.md to v{new_version}")

if __name__ == "__main__":
    main()
