from flask import jsonify


class APIError(Exception):
    """Base API exception with structured JSON payload."""
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_response(self):
        payload = {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }
        return jsonify(payload), self.status_code


def api_error(code: str, message: str, status_code: int = 400, details: dict | None = None):
    """Helper returning consistent JSON error response."""
    payload = {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }
    return jsonify(payload), status_code
