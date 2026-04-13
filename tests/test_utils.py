"""Tests for src/utils.py."""

from __future__ import annotations

from src.grammar import GrammarError
from src.utils import (
    escape_markdown,
    format_grammar_report,
    truncate,
    wrap_code_block,
)

# ---------------------------------------------------------------------------
# escape_markdown
# ---------------------------------------------------------------------------


def test_escape_markdown_leaves_plain_text() -> None:
    assert escape_markdown("hello world") == "hello world"


def test_escape_markdown_escapes_special_chars() -> None:
    result = escape_markdown("hello *world* [test]")
    assert "\\*" in result
    assert "\\[" in result
    assert "\\]" in result


# ---------------------------------------------------------------------------
# truncate
# ---------------------------------------------------------------------------


def test_truncate_short_text_unchanged() -> None:
    text = "short"
    assert truncate(text, max_length=100) == text


def test_truncate_long_text_adds_ellipsis() -> None:
    text = "a" * 200
    result = truncate(text, max_length=100)
    assert len(result) == 100
    assert result.endswith("…")


def test_truncate_exact_length_unchanged() -> None:
    text = "a" * 100
    assert truncate(text, max_length=100) == text


# ---------------------------------------------------------------------------
# format_grammar_report
# ---------------------------------------------------------------------------


def test_format_grammar_report_no_errors() -> None:
    result = format_grammar_report([])
    assert "No grammar" in result
    assert "✅" in result


def test_format_grammar_report_with_errors() -> None:
    errors = [
        GrammarError(
            message="Missing full stop",
            offset=10,
            length=1,
            replacements=["."],
            rule_id="PUNCTUATION",
        ),
    ]
    result = format_grammar_report(errors)
    assert "1 issue" in result
    assert "Missing full stop" in result
    assert "." in result


def test_format_grammar_report_multiple_errors() -> None:
    errors = [
        GrammarError("Error A", 0, 1, ["fix_a"], "RULE_A"),
        GrammarError("Error B", 5, 2, ["fix_b"], "RULE_B"),
    ]
    result = format_grammar_report(errors)
    assert "2 issue" in result


# ---------------------------------------------------------------------------
# wrap_code_block
# ---------------------------------------------------------------------------


def test_wrap_code_block_wraps_in_pre_tag() -> None:
    result = wrap_code_block("some code")
    assert result.startswith("<pre>")
    assert result.endswith("</pre>")


def test_wrap_code_block_escapes_html() -> None:
    result = wrap_code_block("<script>alert(1)</script>")
    assert "<script>" not in result
    assert "&lt;script&gt;" in result
