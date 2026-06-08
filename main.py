from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from web_app.routers import upload, save
from ocr_services.warm_ocr import init_ocr
from fastapi.responses import FileResponse


Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_ocr()
    yield

app = FastAPI(title="OCR Invoice Parser", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="web_app/static"), name="static")

app.include_router(upload.router)
app.include_router(save.router)

@app.get("/")
async def index():
    return FileResponse("web_app/static/index.html")