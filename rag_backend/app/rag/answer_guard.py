NOT_FOUND_ANSWER = "I couldn't find that information in the provided documents."

_UNSUPPORTED_CONTINUATION_MARKERS = (
    "\nhowever,",
    "\n\nhowever,",
    " however,",
    "\nbut ",
    "\n\nbut ",
    " but ",
)


def remove_unsupported_not_found_continuation(answer: str) -> str:
    normalized = answer.strip()
    if NOT_FOUND_ANSWER.lower() not in normalized.lower():
        return normalized

    lowered = normalized.lower()
    not_found_index = lowered.find(NOT_FOUND_ANSWER.lower())
    if not_found_index == -1:
        return normalized

    after_not_found = lowered[not_found_index + len(NOT_FOUND_ANSWER) :]
    has_prefix = bool(lowered[:not_found_index].strip())
    has_unsupported_continuation = any(
        marker in after_not_found for marker in _UNSUPPORTED_CONTINUATION_MARKERS
    )
    if has_prefix or has_unsupported_continuation:
        return NOT_FOUND_ANSWER

    return normalized
