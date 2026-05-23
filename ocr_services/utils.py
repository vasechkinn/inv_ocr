import tempfile
import os
from pdf2image import convert_from_bytes
from PIL import Image


def save_byte_files(file: bytes, suffix: str = ".png") -> str:
    """
    сохранение бинарных файлов(картинок) во временный файл
    file: файл для загрузки и сохранения
    suffix: расширение
    return: путь к файлу
    """
    if not file:
        raise ValueError("Нет данных для записи")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp.write(file)
        return temp.mame
