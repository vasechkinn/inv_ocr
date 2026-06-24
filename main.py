import html
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from db import engine, Base
from web_app.routers import upload, save, auth
from ocr_services.warm_ocr import init_ocr
from fastapi.responses import FileResponse


Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_ocr()
    yield


def sanitize_value(value):
    if isinstance(value, str):
        return html.escape(value, quote=True)
    elif isinstance(value, dict):
        return {k: sanitize_value(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple)):
        return [sanitize_value(item) for item in value]
    return value


class XSSProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "style-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "connect-src 'self' https://cdn.jsdelivr.net; "
            "img-src 'self' data: blob:; "
            "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
            "frame-src 'self' blob: data:; "
            "object-src 'self' blob: data:; "
            "base-uri 'self';"
        )

        if isinstance(response, JSONResponse):
            try:
                content = response.body.decode(response.charset or "utf-8")
                data = json.loads(content)
                sanitized = sanitize_value(data)
                response.body = json.dumps(sanitized, ensure_ascii=False).encode(
                    "utf-8"
                )
                response.headers["Content-Length"] = str(len(response.body))
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass

        return response


app = FastAPI(title="OCR Invoice Parser", lifespan=lifespan)

app.add_middleware(XSSProtectionMiddleware)

app.mount("/static", StaticFiles(directory="web_app/static"), name="static")

app.include_router(auth.router, prefix="/api/auth")
app.include_router(upload.router)
app.include_router(save.router)


@app.get("/")
async def index():
    return FileResponse("web_app/static/index.html")
