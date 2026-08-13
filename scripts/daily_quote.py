#!/usr/bin/env python3
"""Rotate the Quote of the Day section in README.md.

Picks a quote from quotes.json based on the current date, cycling through
all quotes in order so every quote appears before any repeats.
"""

import datetime
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
QUOTES = ROOT / "quotes.json"

START = "<!-- QUOTE:START -->"
END = "<!-- QUOTE:END -->"


def main():
    quotes = json.loads(QUOTES.read_text(encoding="utf-8"))
    if not quotes:
        raise SystemExit("quotes.json is empty")

    today = datetime.date.today()
    quote = quotes[today.toordinal() % len(quotes)]

    lines = [f"> {line}" if line else ">" for line in quote["text"].splitlines()]
    block = "\n".join(lines)
    if quote.get("source"):
        block += f"\n>\n> — *{quote['source']}*"
    block += f"\n\n<sub>🗓 {today.strftime('%B %d, %Y')}</sub>"

    readme = README.read_text(encoding="utf-8")
    pattern = re.compile(re.escape(START) + r".*?" + re.escape(END), re.DOTALL)
    replacement = f"{START}\n{block}\n{END}"
    if not pattern.search(readme):
        raise SystemExit(f"Could not find {START} ... {END} markers in README.md")

    README.write_text(pattern.sub(replacement, readme), encoding="utf-8")
    print(f"Updated quote #{today.toordinal() % len(quotes) + 1} of {len(quotes)}")


if __name__ == "__main__":
    main()
