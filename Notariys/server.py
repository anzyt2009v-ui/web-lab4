"""Small local web server and validation-only API for the Notariys site."""

import argparse
import base64
import hmac
import json
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


SITE_ROOT = Path(__file__).resolve().parent
MAX_REQUEST_BYTES = 16_384
PHONE_PATTERN = re.compile(r"^[+\d()\s.-]+$")


class NotaryRequestHandler(SimpleHTTPRequestHandler):
    """Serve the site and validate inquiry forms without retaining submissions."""

    server_version = "NotarySite/1.0"
    sys_version = ""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    def do_GET(self) -> None:
        if not self._require_auth():
            return
        if self.path == "/api/health":
            self._send_json(200, {"status": "ok"})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if not self._require_auth():
            return
        if self.path != "/api/inquiries":
            self._send_json(404, {"error": "Маршрут не знайдено."})
            return

        if self.headers.get_content_type() != "application/json":
            self._send_json(415, {"error": "Надішліть дані у форматі JSON."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._send_json(400, {"error": "Некоректний розмір запиту."})
            return

        if content_length < 0:
            self._send_json(400, {"error": "Некоректний розмір запиту."})
            return
        if content_length > MAX_REQUEST_BYTES:
            self._send_json(413, {"error": "Запит завеликий."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Не вдалося прочитати дані форми."})
            return

        error = self._validate_submission(payload)
        if error:
            self._send_json(422, {"error": error})
            return

        self._send_json(
            200,
            {
                "valid": True,
                "message": "Форму перевірено. Дані не збережено й не надіслано.",
            },
        )

    def _require_auth(self) -> bool:
        password = os.environ.get("NOTARY_PREVIEW_PASSWORD")
        if not password:
            return True

        authorization = self.headers.get("Authorization", "")
        try:
            scheme, encoded_credentials = authorization.split(" ", 1)
            credentials = base64.b64decode(
                encoded_credentials, validate=True
            ).decode("utf-8")
        except (ValueError, UnicodeDecodeError):
            credentials = ""
            scheme = ""

        if scheme.lower() == "basic" and hmac.compare_digest(
            credentials, f"parents:{password}"
        ):
            return True

        body = b"Authentication required."
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Private family preview"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)
        return False

    @staticmethod
    def _validate_submission(payload: Any) -> str | None:
        if not isinstance(payload, dict):
            return "Очікується об’єкт із даними форми."

        limits = {"name": 80, "phone": 30, "question": 1000}
        values: dict[str, str] = {}
        for field, max_length in limits.items():
            value = payload.get(field)
            if not isinstance(value, str):
                return "Заповніть усі поля форми."

            normalized = value.strip()
            if not normalized:
                return "Заповніть усі поля форми."
            if len(normalized) > max_length:
                return "Одне з полів перевищує допустиму довжину."
            if any(ord(character) < 32 and character not in "\t\n\r" for character in normalized):
                return "Приберіть недопустимі символи з полів форми."
            values[field] = normalized

        phone = values["phone"]
        if not PHONE_PATTERN.fullmatch(phone) or sum(character.isdigit() for character in phone) < 7:
            return "Перевірте номер телефону: вкажіть щонайменше 7 цифр."
        return None

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the Notariys website locally or on a trusted LAN.")
    parser.add_argument(
        "--host",
        choices=("127.0.0.1", "0.0.0.0"),
        default="127.0.0.1",
        help="Bind locally (default) or to all network interfaces for LAN access",
    )
    parser.add_argument("--port", type=int, default=8000,
                        help="HTTP port (default: 8000)")
    args = parser.parse_args()

    if not 1 <= args.port <= 65535:
        parser.error("--port має бути в діапазоні від 1 до 65535")

    preview_password = os.environ.get("NOTARY_PREVIEW_PASSWORD")
    if preview_password and len(preview_password) < 16:
        parser.error("NOTARY_PREVIEW_PASSWORD має містити щонайменше 16 символів")

    server = ThreadingHTTPServer(
        (args.host, args.port), NotaryRequestHandler)
    if args.host == "0.0.0.0":
        print(
            "Сайт доступний у локальній мережі за адресою "
            f"http://<IPv4-адреса-комп’ютера>:{args.port}"
        )
    else:
        print(f"Сайт доступний за адресою http://127.0.0.1:{args.port}")
    print("Зупиніть сервер комбінацією Ctrl+C.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер зупинено.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
