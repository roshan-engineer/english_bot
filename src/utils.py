"""Utility helpers shared across the bot modules."""

from __future__ import annotations

import html
import textwrap

MAX_MESSAGE_LENGTH = 4096  # Telegram hard limit


def escape_markdown(text: str) -> str:
    """Escape special MarkdownV2 characters in *text*."""
    special = r"\_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{ch}" if ch in special else ch for ch in text)


def truncate(text: str, max_length: int = MAX_MESSAGE_LENGTH) -> str:
    """Truncate *text* to *max_length* characters, appending '…' if needed."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 1] + "…"


def format_grammar_report(errors: list) -> str:
    """Format a list of GrammarError objects into a human-readable report."""
    if not errors:
        return "✅ No grammar or spelling errors found!"

    lines = [f"⚠️ Found {len(errors)} issue(s):\n"]
    for i, err in enumerate(errors, start=1):
        suggestions = ", ".join(err.replacements[:3]) if err.replacements else "—"
        lines.append(
            f"{i}. {html.escape(err.message)}\n"
            f"   💡 Suggestions: {html.escape(suggestions)}"
        )
    return "\n".join(lines)


def wrap_code_block(text: str) -> str:
    """Wrap *text* in a Telegram HTML <pre> code block."""
    return f"<pre>{html.escape(text)}</pre>"


def indent(text: str, prefix: str = "  ") -> str:
    """Indent every line of *text* with *prefix*."""
    return textwrap.indent(text, prefix)
