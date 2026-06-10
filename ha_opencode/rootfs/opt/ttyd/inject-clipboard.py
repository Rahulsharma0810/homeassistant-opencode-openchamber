#!/usr/bin/env python3
"""Build-time helper: inject the clipboard glue script into ttyd's index page.

ttyd serves a single self-contained HTML page (all JS/CSS inlined, compiled
into the binary), so the only way to extend it is to dump the served page and
splice our script in before </body>. Usage:

    inject-clipboard.py <dumped-index.html> <clipboard.js> <output.html>
"""

import sys


def main() -> None:
    src, js_path, dst = sys.argv[1:4]

    with open(src, encoding="utf-8") as f:
        html = f.read()
    with open(js_path, encoding="utf-8") as f:
        js = f.read()

    if "</body>" not in html:
        sys.exit("error: ttyd index page has no </body> — ttyd layout changed?")
    if "</script>" in js:
        sys.exit("error: clipboard.js must not contain '</script>' (inlined)")

    html = html.replace("</body>", "<script>\n" + js + "\n</script></body>", 1)

    with open(dst, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote {dst} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
