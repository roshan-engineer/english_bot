"""Telegram bot command and message handlers."""

from __future__ import annotations

import logging

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from .grammar import GrammarChecker
from .utils import format_grammar_report, truncate
from .vocabulary import (
    format_word_card,
    generate_quiz_question,
    get_word_of_the_day,
)

logger = logging.getLogger(__name__)

# A single shared GrammarChecker instance (starts the LanguageTool JVM once).
_checker: GrammarChecker | None = None


def get_checker() -> GrammarChecker:
    """Return the shared :class:`GrammarChecker`, initialising it if needed."""
    global _checker
    if _checker is None:
        logger.info("Starting LanguageTool server…")
        _checker = GrammarChecker()
    return _checker


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command — send a welcome message."""
    await update.message.reply_text(
        "👋 Hello! I'm your *English Bot*.\n\n"
        "Here's what I can do:\n"
        "• /check `<sentence>` — grammar & spell check\n"
        "• /correct `<sentence>` — auto-correct your text\n"
        "• /wotd — Word of the Day\n"
        "• /quiz — vocabulary multiple-choice quiz\n"
        "• /help — show this message again\n\n"
        "You can also just send me any text and I'll check it for errors!",
        parse_mode=ParseMode.MARKDOWN,
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /help command."""
    await start(update, context)


async def check_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /check <text> — report grammar/spelling errors."""
    text = " ".join(context.args) if context.args else ""
    if not text.strip():
        await update.message.reply_text(
            "Usage: /check <sentence>\nExample: /check He dont know the answer."
        )
        return

    errors = get_checker().check(text)
    report = format_grammar_report(errors)
    await update.message.reply_text(truncate(report), parse_mode=ParseMode.HTML)


async def correct_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /correct <text> — return auto-corrected text."""
    text = " ".join(context.args) if context.args else ""
    if not text.strip():
        await update.message.reply_text(
            "Usage: /correct <sentence>\nExample: /correct She dont likes coffee."
        )
        return

    corrected = get_checker().correct(text)
    if corrected == text:
        await update.message.reply_text("✅ Your text looks fine — no corrections needed.")
    else:
        await update.message.reply_text(
            f"✏️ Corrected:\n<b>{corrected}</b>",
            parse_mode=ParseMode.HTML,
        )


async def wotd_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /wotd — send the word of the day."""
    entry = get_word_of_the_day()
    card = format_word_card(entry)
    await update.message.reply_text(card, parse_mode=ParseMode.MARKDOWN)


async def quiz_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /quiz — send a vocabulary quiz question."""
    question = generate_quiz_question()
    text = (
        f"📝 *Vocabulary Quiz*\n\n"
        f"What does *{question.word}* mean?\n\n"
        f"{question.format_options()}\n\n"
        f"Reply with the number of your answer (1–{len(question.options)}).\n"
        f"_Hint: {question.hint}_"
    )
    # Store the question in user context so we can validate the answer.
    context.user_data["quiz"] = question
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


# ---------------------------------------------------------------------------
# Plain-text message handler
# ---------------------------------------------------------------------------


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle a plain text message.

    * If there is an active quiz, treat the message as a quiz answer.
    * Otherwise, run a grammar check on the message.
    """
    text = update.message.text or ""

    # --- Quiz answer ---
    if "quiz" in context.user_data:
        question = context.user_data.pop("quiz")
        try:
            choice = int(text.strip()) - 1
        except ValueError:
            await update.message.reply_text(
                "Please reply with a number (e.g. 1, 2, 3, or 4)."
            )
            context.user_data["quiz"] = question  # put it back
            return

        if choice == question.correct_index:
            await update.message.reply_text(
                f"🎉 Correct! *{question.word.capitalize()}* means:\n"
                f"_{question.correct_definition}_",
                parse_mode=ParseMode.MARKDOWN,
            )
        else:
            correct_opt = question.options[question.correct_index]
            await update.message.reply_text(
                f"❌ Not quite. The correct answer was *{question.correct_index + 1}*: "
                f"_{correct_opt}_",
                parse_mode=ParseMode.MARKDOWN,
            )
        return

    # --- Grammar check ---
    if not text.strip():
        return

    errors = get_checker().check(text)
    report = format_grammar_report(errors)
    await update.message.reply_text(truncate(report), parse_mode=ParseMode.HTML)
