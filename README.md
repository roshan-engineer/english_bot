# English Bot 🤖

A Telegram bot for **English grammar checking** and **vocabulary practice**, built with Python.

## Features

| Command | Description |
|---|---|
| `/start` | Welcome message and command overview |
| `/help` | Show available commands |
| `/check <text>` | Grammar & spell check your sentence |
| `/correct <text>` | Auto-correct your sentence |
| `/wotd` | Word of the Day — definition, examples, synonyms |
| `/quiz` | Multiple-choice vocabulary quiz |
| _(plain text)_ | Automatically grammar-checks any message you send |

## Architecture

```
english_bot/
├── src/
│   ├── bot.py          # Entry point — builds the Telegram Application
│   ├── handlers.py     # Command & message handler functions
│   ├── grammar.py      # GrammarChecker (wraps LanguageTool)
│   ├── vocabulary.py   # Word-of-the-day & quiz generation
│   └── utils.py        # Shared formatting helpers
├── tests/
│   ├── test_grammar.py
│   ├── test_vocabulary.py
│   └── test_utils.py
├── .github/
│   └── workflows/
│       └── ci.yml      # Lint + test on every push / PR
├── .env.example        # Environment variable template
├── requirements.txt
└── pyproject.toml
```

## Requirements

- Python 3.10+
- Java 8+ (required by LanguageTool — install via `sudo apt install default-jre` or equivalent)

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/roshan-engineer/english_bot.git
   cd english_bot
   ```

2. **Create and activate a virtual environment**

   ```bash
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and set your TELEGRAM_BOT_TOKEN
   ```

   > Get a token from [@BotFather](https://t.me/BotFather) on Telegram.

5. **Run the bot**

   ```bash
   python -m src.bot
   ```

## Development

Install dev dependencies:

```bash
pip install pytest==9.0.3 pytest-asyncio==1.3.0 ruff==0.15.10
```

**Lint:**

```bash
ruff check src/ tests/
```

**Run tests:**

```bash
pytest --tb=short -q
```

## CI / CD

Every push and pull request triggers the GitHub Actions workflow (`.github/workflows/ci.yml`) which runs:

1. **Ruff** — linting
2. **pytest** — unit tests

## Security

- API tokens are loaded from the `.env` file via `python-dotenv` — they are **never** hardcoded.
- `.env` is listed in `.gitignore` and must not be committed.

## License

MIT