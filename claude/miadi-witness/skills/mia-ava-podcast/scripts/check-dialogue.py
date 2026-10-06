#!/usr/bin/env python3
"""Check a Mia and Ava podcast dialogue before it is given to a person or a voice engine.

    python3 check-dialogue.py dialogue.md [--hosts Mia,Ava] [--turn-max 85] [--sentence-max 28] [--field-max 55]

Every block (separated by a blank line) must start with a host label. It reports turns and
sentences that are too long to hear comfortably, and text a voice engine reads badly: paths, code,
flags, ids, hashes, URLs, semicolons, dashes and markdown. A field statement is a Mia turn whose
first sentence names a field by its place ("The second field is ..."). The rest of that turn must stay under
--field-max words. Exit 1 when anything is reported.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

WORD_RE = re.compile(r"[A-Za-z0-9'’-]+")
SENTENCE_RE = re.compile(r"[^.?!]+[.?!]+[\"”]?")
FIELD_RE = re.compile(r"\b(?:[Ff]irst|[Ss]econd|[Tt]hird|[Ff]ourth|[Ff]ifth|[Ss]ixth|[Nn]ext|[Ll]ast)\b[^.?!]*\bfields?\b")
UNSPEAKABLE = {
    "url": re.compile(r"https?://|www\."),
    "path": re.compile(r"(?:^|\s)[~.]?/[\w.-]+/|\b[\w-]+\.(?:md|py|ts|tsx|js|mjs|json|sh|yaml|yml)\b"),
    "flag": re.compile(r"(?:^|\s)--?[a-z][\w-]*"),
    "uuid or hash": re.compile(r"\b[0-9a-f]{7,}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-"),
    "code or markdown": re.compile(r"[`#*_|<>{}\[\]]"),
    "semicolon": re.compile(r";"),
    "dash": re.compile(r"[—–]"),
}


def words(text: str) -> int:
    return len(WORD_RE.findall(text))


def check(text: str, hosts: list[str], turn_max: int, sentence_max: int, field_max: int) -> list[str]:
    problems: list[str] = []
    label_re = re.compile(rf"^({'|'.join(map(re.escape, hosts))}): ")
    turns = [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]
    for index, turn in enumerate(turns, 1):
        where = f"turn {index} ({turn[:30]}...)"
        label = label_re.match(turn)
        if not label:
            problems.append(f"{where}: does not start with a host label {hosts}")
            continue
        body = turn[label.end():]
        if "\n" in body:
            problems.append(f"{where}: a turn is one paragraph")
        if words(body) > turn_max:
            problems.append(f"{where}: {words(body)} words, over {turn_max}")
        sentences = [s.strip() for s in SENTENCE_RE.findall(body)]
        for sentence in sentences:
            if words(sentence) > sentence_max:
                problems.append(f"{where}: sentence of {words(sentence)} words: {sentence[:60]}")
        for name, pattern in UNSPEAKABLE.items():
            match = pattern.search(body)
            if match:
                problems.append(f"{where}: {name} {match.group().strip()!r}")
        if label.group(1) == hosts[0] and sentences and FIELD_RE.search(sentences[0]):
            statement = words(" ".join(sentences[1:]))
            print(f"field statement, turn {index}: {statement} words  ({sentences[0][:60]})")
            if statement >= field_max:
                problems.append(f"{where}: field statement of {statement} words, limit is under {field_max}")
    print(f"{len(turns)} turns, {words(text)} words, about {round(words(text) / 150)} minutes spoken")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("file")
    parser.add_argument("--hosts", default="Mia,Ava")
    parser.add_argument("--turn-max", type=int, default=85)
    parser.add_argument("--sentence-max", type=int, default=28)
    parser.add_argument("--field-max", type=int, default=55)
    args = parser.parse_args()
    text = Path(args.file).read_text(encoding="utf-8")
    problems = check(text, args.hosts.split(","), args.turn_max, args.sentence_max, args.field_max)
    for problem in problems:
        print(problem)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
