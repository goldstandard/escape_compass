from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_MD = ROOT / "escape_location_questionnaire.md"
TARGET_JSON = ROOT / "backend" / "data" / "questions.json"

CATEGORY_RE = re.compile(r"^###\s+\d+\.\s+(.*)$")
QUESTION_RE = re.compile(r"^####\s+(\d+)\.\s+(.*)$")
OPTION_RE = re.compile(r"^- \[ \]\s+([A-D])\)\s+(.*)$")


def parse_markdown(markdown_text: str) -> dict:
    categories = []
    current_category = None
    current_question = None

    for raw_line in markdown_text.splitlines():
        line = raw_line.strip()

        category_match = CATEGORY_RE.match(line)
        if category_match:
            category_title = category_match.group(1).strip()
            category_id = f"cat{len(categories) + 1}"
            current_category = {
                "id": category_id,
                "title": category_title,
                "questions": [],
            }
            categories.append(current_category)
            current_question = None
            continue

        question_match = QUESTION_RE.match(line)
        if question_match and current_category is not None:
            number = int(question_match.group(1))
            prompt = question_match.group(2).strip()
            current_question = {
                "id": f"q{number}",
                "number": number,
                "prompt": prompt,
                "options": [],
            }
            current_category["questions"].append(current_question)
            continue

        option_match = OPTION_RE.match(line)
        if option_match and current_question is not None:
            key = option_match.group(1)
            text = option_match.group(2).strip()
            current_question["options"].append({"key": key, "text": text})

    question_count = sum(len(category["questions"]) for category in categories)
    if question_count != 60:
        raise ValueError(f"Expected 60 questions, parsed {question_count}")

    return {
        "version": "1.0",
        "categories": categories,
    }


def main() -> None:
    markdown_text = SOURCE_MD.read_text(encoding="utf-8")
    payload = parse_markdown(markdown_text)
    TARGET_JSON.parent.mkdir(parents=True, exist_ok=True)
    TARGET_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=True), encoding="utf-8")
    print(f"Generated {TARGET_JSON}")


if __name__ == "__main__":
    main()
