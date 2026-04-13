"""Vocabulary quiz and word-of-the-day features."""

from __future__ import annotations

import random
from dataclasses import dataclass, field

# A small built-in word bank.  Each entry contains the word, its part of
# speech, a definition, and a list of example sentences.
WORD_BANK: list[dict] = [
    {
        "word": "ephemeral",
        "pos": "adjective",
        "definition": "lasting for a very short time",
        "examples": [
            "The beauty of cherry blossoms is ephemeral.",
            "Fame can be ephemeral in the age of social media.",
        ],
        "synonyms": ["transient", "fleeting", "momentary"],
    },
    {
        "word": "eloquent",
        "pos": "adjective",
        "definition": "fluent or persuasive in speaking or writing",
        "examples": [
            "She gave an eloquent speech at the ceremony.",
            "His eloquent writing captivated readers worldwide.",
        ],
        "synonyms": ["articulate", "expressive", "fluent"],
    },
    {
        "word": "perseverance",
        "pos": "noun",
        "definition": "continued effort despite difficulty or delay in achieving success",
        "examples": [
            "His perseverance paid off when he finally passed the exam.",
            "Perseverance is key to mastering a new language.",
        ],
        "synonyms": ["persistence", "tenacity", "determination"],
    },
    {
        "word": "ubiquitous",
        "pos": "adjective",
        "definition": "present, appearing, or found everywhere",
        "examples": [
            "Smartphones have become ubiquitous in modern society.",
            "Coffee shops are ubiquitous in this city.",
        ],
        "synonyms": ["omnipresent", "pervasive", "universal"],
    },
    {
        "word": "meticulous",
        "pos": "adjective",
        "definition": "showing great attention to detail or being very careful and precise",
        "examples": [
            "She was meticulous in her research.",
            "The architect was meticulous about every measurement.",
        ],
        "synonyms": ["thorough", "precise", "scrupulous"],
    },
    {
        "word": "ambiguous",
        "pos": "adjective",
        "definition": "open to more than one interpretation; having a double meaning",
        "examples": [
            "The contract contained several ambiguous clauses.",
            "His ambiguous answer left us confused.",
        ],
        "synonyms": ["unclear", "vague", "equivocal"],
    },
    {
        "word": "benevolent",
        "pos": "adjective",
        "definition": "well-meaning and kindly",
        "examples": [
            "The benevolent donor funded the entire library.",
            "She had a benevolent smile for everyone she met.",
        ],
        "synonyms": ["kind", "charitable", "generous"],
    },
    {
        "word": "candid",
        "pos": "adjective",
        "definition": "truthful and straightforward; frank",
        "examples": [
            "Please be candid about what you think of my work.",
            "The interviewer appreciated his candid responses.",
        ],
        "synonyms": ["frank", "honest", "forthright"],
    },
    {
        "word": "diligent",
        "pos": "adjective",
        "definition": "having or showing care and conscientiousness in one's work",
        "examples": [
            "A diligent student reviews notes every day.",
            "Her diligent efforts led to a promotion.",
        ],
        "synonyms": ["hardworking", "industrious", "assiduous"],
    },
    {
        "word": "verbose",
        "pos": "adjective",
        "definition": "using or expressed in more words than are needed",
        "examples": [
            "His verbose report could have been summarised in one page.",
            "Try not to be verbose in formal emails.",
        ],
        "synonyms": ["wordy", "long-winded", "prolix"],
    },
]


@dataclass
class QuizQuestion:
    """A multiple-choice vocabulary question."""

    word: str
    correct_definition: str
    options: list[str]
    correct_index: int
    hint: str = field(default="")

    def format_options(self) -> str:
        """Return a numbered list of answer options."""
        lines = [f"{i + 1}. {opt}" for i, opt in enumerate(self.options)]
        return "\n".join(lines)


def get_word_of_the_day() -> dict:
    """Return a random word entry from the word bank."""
    return random.choice(WORD_BANK)


def format_word_card(entry: dict) -> str:
    """Return a nicely formatted word card string."""
    lines = [
        f"📖 *{entry['word'].capitalize()}*  _{entry['pos']}_",
        "",
        f"*Definition:* {entry['definition']}",
        "",
        "*Examples:*",
    ]
    for ex in entry["examples"]:
        lines.append(f"  • _{ex}_")
    if entry.get("synonyms"):
        lines.append("")
        lines.append("*Synonyms:* " + ", ".join(entry["synonyms"]))
    return "\n".join(lines)


def generate_quiz_question() -> QuizQuestion:
    """Generate a multiple-choice question from the word bank."""
    if len(WORD_BANK) < 4:
        raise ValueError("Word bank needs at least 4 entries to generate a quiz.")

    entry = random.choice(WORD_BANK)
    wrong_entries = random.sample(
        [e for e in WORD_BANK if e["word"] != entry["word"]], k=3
    )

    correct_def = entry["definition"]
    wrong_defs = [e["definition"] for e in wrong_entries]

    options = wrong_defs + [correct_def]
    random.shuffle(options)
    correct_index = options.index(correct_def)

    return QuizQuestion(
        word=entry["word"],
        correct_definition=correct_def,
        options=options,
        correct_index=correct_index,
        hint=f"Synonyms: {', '.join(entry.get('synonyms', []))}",
    )
