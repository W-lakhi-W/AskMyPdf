# RAG Document QA

A production-shaped FastAPI RAG service for asking questions about PDF documents, with a CLI workflow for local ingestion and debugging.

## What Is Included

- FastAPI app with lifespan startup
- API key protection for document and chat endpoints
- Persistent conversational memory with SQLite-backed chat sessions
- `/health` endpoint for readiness checks
- Upload filename sanitization and size limits
- One shared Chroma vector store path for ingestion and retrieval
- Shared RAG service functions for API and script workflows
- Structured request logging with `X-Request-ID`
- Dockerfile and `.dockerignore`
- Minimal local tests

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

When `APP_ENV=production`, `API_KEY` must be set and clients must send it as:

```text
X-API-Key: your_api_key
```

## CLI Workflow

Put your local PDF at:

```text
data/documents/sample.pdf
```

Ingest:

```bash
python scripts/ingest.py
```

Chat:

```bash
python scripts/chat.py
```

## API Workflow

Start the API:

```bash
uvicorn app.api.main:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Ingest a PDF:

```bash
curl -X POST http://localhost:8000/ingest ^
  -H "X-API-Key: change_me_for_production" ^
  -F "user_id=user-123" ^
  -F "document_id=sample-doc" ^
  -F "file=@data/documents/sample.pdf"
```

Query:

```bash
curl -X POST http://localhost:8000/query ^
  -H "X-API-Key: change_me_for_production" ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"What is this document about?\"}"
```

## Conversational Chat Workflow

Create a session:

```bash
curl -X POST http://localhost:8000/chat/session ^
  -H "X-API-Key: change_me_for_production" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"user-123\",\"title\":\"Sample PDF chat\"}"
```

Ask questions with memory:

```bash
curl -X POST http://localhost:8000/chat ^
  -H "X-API-Key: change_me_for_production" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"user-123\",\"session_id\":\"SESSION_ID\",\"question\":\"What is this document about?\"}"
```

Continue with a follow-up using the same `user_id` and `session_id`:

```bash
curl -X POST http://localhost:8000/chat ^
  -H "X-API-Key: change_me_for_production" ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"user-123\",\"session_id\":\"SESSION_ID\",\"question\":\"What did I ask before?\"}"
```

List sessions:

```bash
curl "http://localhost:8000/chat/sessions?user_id=user-123" ^
  -H "X-API-Key: change_me_for_production"
```

## Docker

```bash
docker build -t rag-document-qa .
docker run --env-file .env -p 8000:8000 rag-document-qa
```

Mount `data/` as a volume in real deployments if you want Chroma and uploads to persist outside the container.

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

The single active Chroma path is:

```text
data/vectorstores/chroma_db
```

## Production Notes

This is much closer to production-ready than the original prototype, but deployment choices still matter:

- Use a real secret manager for `GROQ_API_KEY` and `API_KEY`.
- Put the API behind HTTPS.
- Use persistent storage or a managed vector database for critical workloads.
- Add rate limiting at the gateway/load balancer layer.
- Move large ingestion jobs to a queue if PDFs are large or traffic is high.
- Add backup and retention policies for uploaded documents and vector data.

## Tests

```bash
python -m unittest discover
```
