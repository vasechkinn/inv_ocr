from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from database import engine, Base
from web_app.routers import upload, save
from ocr_services.warm_ocr import init_ocr

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_ocr()
    yield

app = FastAPI(title="OCR Invoice Parser", lifespan=lifespan)

# app.mount("/static", StaticFiles(directory="static"), name="static")
# templates = Jinja2Templates(directory="templates")

app.include_router(upload.router)
app.include_router(save.router)

# @app.get("/")
# async def index(request: Request):
#     return templates.TemplateResponse("index.html", {"request": request})