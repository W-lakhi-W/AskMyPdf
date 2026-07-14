# Quick Start

## 1. Install

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Configure

Create `.env` from `.env.example` and set:

```env
GROQ_API_KEY=your_api_key_here
```

## 3. Add a PDF

Place your file at:

```text
data/documents/sample.pdf
```

## 4. Ingest

```bash
python scripts/ingest.py
```

## 5. Chat

```bash
python scripts/chat.py
```

## API Mode

```bash
uvicorn app.api.main:app --reload
```

Then use:

- `POST /ingest` with a PDF file field named `file`
- `POST /query` with JSON: `{"query": "your question"}`
