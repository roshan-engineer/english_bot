"""Entry point for the English Telegram Bot."""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from telegram.ext import Application, CommandHandler, MessageHandler, filters

from .handlers import (
    check_command,
    correct_command,
    handle_message,
    help_command,
    quiz_command,
    start,
    wotd_command,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def build_application(token: str) -> Application:
    """Create and configure the Telegram :class:`Application`."""
    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("check", check_command))
    app.add_handler(CommandHandler("correct", correct_command))
    app.add_handler(CommandHandler("wotd", wotd_command))
    app.add_handler(CommandHandler("quiz", quiz_command))
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message)
    )

    return app


def main() -> None:
    """Run the bot using long-polling."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN environment variable is not set. "
            "Copy .env.example to .env and fill in your token."
        )

    logger.info("Starting English Bot…")
    app = build_application(token)
    app.run_polling()


if __name__ == "__main__":
    main()
