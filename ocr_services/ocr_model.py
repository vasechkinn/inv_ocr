import os
import logging
from paddleocr import PaddleOCR

logging.getLogger("ppocr").setLevel(logging.ERROR)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")


class OCREngine:
    _example = None

    def __new__(cls):
        if cls._example is None:
            print("инициализация паддлы...")
            cls._example = super().__new__(cls)
            cls._example.ocr = PaddleOCR(
                lang="ru",
                model_dir=MODEL_DIR,
                use_doc_orientation_classify=True,
                use_textline_orientation=True,
                use_gpu=False,
                show_log=False,
            )
        return cls._example

    def get_ocr(self):
        """Возвращает экземпляр PaddleOCR (уже инициализированный)."""
        return self.ocr


def load_ocr():
    return OCREngine().get_ocr()
