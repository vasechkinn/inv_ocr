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
        return temp.name

def save_pil_file(img: Image.Image, suffix: str = '.png') -> str:
    """
    схранение изображения во временный файл
    img: преобразованное изображение
    suffix: расширение
    return: путь к файлу
    """
    if not img:
        raise ValueError("Нет данных для записи")
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        img.save(temp.name)
        return temp.name
    
def del_temp_files(path: str):
    """
    удаление временных файлов
    path: путь к изображению
    """
    if path and os.path.exists(path):
        os.unlink(path)

def converted_pdf(pdf_file: bytes, dpi: int = 200):
    return convert_from_bytes(pdf_file, dpi=dpi)