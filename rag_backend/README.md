# AskMyPdf

A FastAPI RAG service for asking questions about PDF documents.

## Project Structure

```text
.
|-- app/
|   |-- api/                    # FastAPI app, auth, schemas
|   |-- core/                   # settings and logging
|   |-- database/               # SQLAlchemy engine and session setup
|   |-- memory/                 # conversation history windowing
|   |-- models/                 # SQLAlchemy ORM models
|   |-- prompts/                # prompt builders
|   |-- repositories/           # persistence access layer
|   |-- routers/                # API routers
|   |-- rag/                    # RAG models, prompt, vector DB, services
|   |-- services/               # business workflows
|   `-- utils/                  # upload utilities
|-- data/
|   |-- documents/              # local PDFs
|   |-- uploads/                # API uploads, ignored by git
|   `-- vectorstores/           # Chroma DB, ignored by git
|-- scripts/
|   |-- ingest.py               # CLI ingestion
|   `-- chat.py                 # CLI chat
|-- tests/
|-- Dockerfile
|-- requirements.txt
`-- .env.example
```

## Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```bash
copy .env.example .env
```

Required values:

```env
GROQ_API_KEY=your_groq_api_key_here
APP_ENV=development
API_KEY=change_me_for_production
```

## API Workflow

Start the API:

```bash
uvicorn app.api.main:app --host 0.0.0.0 --port 8000
```

## Configuration

Settings are read from environment variables in [app/core/config.py](app/core/config.py).

Important settings:

- `GROQ_API_KEY`
- `APP_ENV`
- `API_KEY`
- `LOG_LEVEL`
- `MAX_UPLOAD_BYTES`
- `DATABASE_URL`
- `MAX_HISTORY_MESSAGES`
- `TOP_K`
- `TEMPERATURE`
- `MAX_TOKENS`


