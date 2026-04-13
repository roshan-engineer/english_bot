"""Tests for src/vocabulary.py."""

from __future__ import annotations

from src.vocabulary import (
    WORD_BANK,
    QuizQuestion,
    format_word_card,
    generate_quiz_question,
    get_word_of_the_day,
)

# ---------------------------------------------------------------------------
# Word bank sanity checks
# ---------------------------------------------------------------------------


def test_word_bank_not_empty() -> None:
    assert len(WORD_BANK) >= 4


def test_word_bank_entries_have_required_keys() -> None:
    required = {"word", "pos", "definition", "examples"}
    for entry in WORD_BANK:
        assert required <= entry.keys(), f"Entry {entry} is missing keys"


# ---------------------------------------------------------------------------
# get_word_of_the_day
# ---------------------------------------------------------------------------


def test_get_word_of_the_day_returns_dict() -> None:
    entry = get_word_of_the_day()
    assert isinstance(entry, dict)
    assert "word" in entry
    assert "definition" in entry


def test_get_word_of_the_day_is_from_word_bank() -> None:
    entry = get_word_of_the_day()
    assert entry in WORD_BANK


# ---------------------------------------------------------------------------
# format_word_card
# ---------------------------------------------------------------------------


def test_format_word_card_contains_word() -> None:
    entry = WORD_BANK[0]
    card = format_word_card(entry)
    assert entry["word"].capitalize() in card


def test_format_word_card_contains_definition() -> None:
    entry = WORD_BANK[0]
    card = format_word_card(entry)
    assert entry["definition"] in card


def test_format_word_card_contains_examples() -> None:
    entry = WORD_BANK[0]
    card = format_word_card(entry)
    for ex in entry["examples"]:
        assert ex in card


# ---------------------------------------------------------------------------
# generate_quiz_question
# ---------------------------------------------------------------------------


def test_generate_quiz_question_returns_question() -> None:
    q = generate_quiz_question()
    assert isinstance(q, QuizQuestion)


def test_generate_quiz_question_has_four_options() -> None:
    q = generate_quiz_question()
    assert len(q.options) == 4


def test_generate_quiz_question_correct_index_valid() -> None:
    q = generate_quiz_question()
    assert 0 <= q.correct_index < len(q.options)


def test_generate_quiz_question_correct_definition_in_options() -> None:
    q = generate_quiz_question()
    assert q.correct_definition in q.options
    assert q.options[q.correct_index] == q.correct_definition


def test_generate_quiz_question_word_is_in_word_bank() -> None:
    q = generate_quiz_question()
    words = {e["word"] for e in WORD_BANK}
    assert q.word in words


# ---------------------------------------------------------------------------
# QuizQuestion.format_options
# ---------------------------------------------------------------------------


def test_format_options_numbered() -> None:
    q = QuizQuestion(
        word="test",
        correct_definition="the definition",
        options=["a", "b", "c", "d"],
        correct_index=0,
    )
    formatted = q.format_options()
    assert "1. a" in formatted
    assert "4. d" in formatted
