from langchain_community.document_loaders import PyPDFLoader


def load_pdf(file_path: str):
    try:
        loader = PyPDFLoader(file_path)
        return loader.load()
    except Exception as e:
        raise Exception(f"Error loading PDF '{file_path}': {e}")
