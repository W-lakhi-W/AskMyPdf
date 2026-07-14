from langchain_groq import ChatGroq

from app.core.config import LLM_MODEL, LLM_TEMPERATURE, MAX_TOKENS, settings


def llm_model():
    api_key = settings.groq_api_key
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing. Add it to the .env file.")

    kwargs = {
        "model_name": LLM_MODEL,
        "api_key": api_key,
        "temperature": LLM_TEMPERATURE,
    }
    if MAX_TOKENS is not None:
        kwargs["max_tokens"] = MAX_TOKENS

    llm = ChatGroq(**kwargs)
    return llm
