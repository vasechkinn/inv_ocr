import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "mysql")

if DB_TYPE == "sqlite":
    DB_NAME = os.getenv("DB_NAME", "inv_ocr.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///./{DB_NAME}"

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False},
    )

elif DB_TYPE == "mysql":
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")

    if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
        raise ValueError("Не все переменные окружения для MySQL установлены")

    encoded_password = quote_plus(DB_PASSWORD)
    SQLALCHEMY_DATABASE_URL = (
        f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

else:
    raise ValueError(f"Неподдерживаемый DB_TYPE: {DB_TYPE}")


SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
