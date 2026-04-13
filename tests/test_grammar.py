"""Tests for src/grammar.py.

These tests use a lightweight mock of language_tool_python so that the
full Java LanguageTool server is never started during CI.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.grammar import GrammarChecker, GrammarError

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_match(
    message: str = "error",
    offset: int = 0,
    error_length: int = 3,
    replacements: list[str] | None = None,
    rule_id: str = "RULE",
) -> MagicMock:
    """Build a fake LanguageTool match object."""
    m = MagicMock()
    m.message = message
    m.offset = offset
    m.errorLength = error_length
    m.replacements = replacements or []
    m.ruleId = rule_id
    return m


@pytest.fixture()
def mock_tool():
    """Patch language_tool_python.LanguageTool with a MagicMock."""
    with patch("src.grammar.language_tool_python.LanguageTool") as cls:
        instance = MagicMock()
        cls.return_value = instance
        yield instance


# ---------------------------------------------------------------------------
# GrammarError
# ---------------------------------------------------------------------------


def test_grammar_error_str_with_replacements() -> None:
    err = GrammarError(
        message="Possible typo",
        offset=5,
        length=3,
        replacements=["fix", "fixed"],
        rule_id="TYPO",
    )
    result = str(err)
    assert "TYPO" in result
    assert "Possible typo" in result
    assert "fix" in result


def test_grammar_error_str_no_replacements() -> None:
    err = GrammarError(
        message="Style issue",
        offset=0,
        length=4,
        replacements=[],
        rule_id="STYLE",
    )
    result = str(err)
    assert "—" in result


# ---------------------------------------------------------------------------
# GrammarChecker.check
# ---------------------------------------------------------------------------


def test_check_returns_empty_for_correct_text(mock_tool) -> None:
    mock_tool.check.return_value = []
    checker = GrammarChecker()
    errors = checker.check("Everything is fine.")
    assert errors == []


def test_check_returns_errors(mock_tool) -> None:
    mock_tool.check.return_value = [
        _make_match("Missing comma", 5, 1, [","], "COMMA_RULE"),
        _make_match("Possible typo", 10, 4, ["word"], "SPELL"),
    ]
    checker = GrammarChecker()
    errors = checker.check("Hello world it works.")
    assert len(errors) == 2
    assert errors[0].rule_id == "COMMA_RULE"
    assert errors[1].rule_id == "SPELL"


# ---------------------------------------------------------------------------
# GrammarChecker.correct
# ---------------------------------------------------------------------------


def test_correct_delegates_to_utils(mock_tool) -> None:
    mock_tool.check.return_value = []
    with patch(
        "src.grammar.language_tool_python.utils.correct", return_value="Corrected text."
    ) as mock_correct:
        checker = GrammarChecker()
        result = checker.correct("Original text.")
        mock_correct.assert_called_once()
        assert result == "Corrected text."


# ---------------------------------------------------------------------------
# Context manager
# ---------------------------------------------------------------------------


def test_context_manager_calls_close(mock_tool) -> None:
    with GrammarChecker():
        pass
    mock_tool.close.assert_called_once()
