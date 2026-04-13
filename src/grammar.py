"""Grammar checking utilities using LanguageTool."""

from __future__ import annotations

from dataclasses import dataclass

import language_tool_python


@dataclass
class GrammarError:
    """Represents a single grammar or spelling error."""

    message: str
    offset: int
    length: int
    replacements: list[str]
    rule_id: str

    def __str__(self) -> str:
        suggestions = ", ".join(self.replacements[:3]) if self.replacements else "—"
        return f"[{self.rule_id}] {self.message} (suggestions: {suggestions})"


class GrammarChecker:
    """Wraps LanguageTool to provide grammar and spell checking."""

    def __init__(self, language: str = "en-US") -> None:
        self._tool = language_tool_python.LanguageTool(language)

    def check(self, text: str) -> list[GrammarError]:
        """Return a list of grammar/spelling errors found in *text*."""
        matches = self._tool.check(text)
        return [
            GrammarError(
                message=m.message,
                offset=m.offset,
                length=m.errorLength,
                replacements=list(m.replacements),
                rule_id=m.ruleId,
            )
            for m in matches
        ]

    def correct(self, text: str) -> str:
        """Return *text* with all detected errors automatically corrected."""
        return language_tool_python.utils.correct(text, self._tool.check(text))

    def close(self) -> None:
        """Release the underlying LanguageTool server."""
        self._tool.close()

    # Support use as a context manager
    def __enter__(self) -> GrammarChecker:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
