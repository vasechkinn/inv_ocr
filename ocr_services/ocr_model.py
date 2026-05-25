import os
import logging
from paddleocr import PaddleOCR
from dataclasses import dataclass, field
from typing import Optional

logging.getLogger("ppocr").setLevel(logging.ERROR)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")


@dataclass(frozen=True)
class OCRConfig:
    lang: str = 'ru'
    model_dir: str = MODEL_DIR
    use_doc_orientation_classify: bool = True
    use_textline_orientation: bool = True
    use_gpu: bool = False
    show_log: bool = False

class OCREngine:
    _example: Optional['OCREngine'] = None

    def __new__(cls, config: Optional['OCRConfig'] = None):
        if cls._example is None:
            print("инициализация паддлы...")
            cls._example = super().__new__(cls)

            if config is None:
                config = OCRConfig()

            cls._example.ocr = PaddleOCR(
                lang = config.lang,
                model_dir = config.model_dir,
                use_doc_orientation_classify = config.use_doc_orientation_classify,
                use_textline_orientation = config.use_textline_orientation,
                use_gpu = config.use_gpu,
                show_log = config.show_log,
            )
        return cls._example

    def get_ocr(self):
        """
        Возвращает экземпляр PaddleOCR
        """
        return self.ocr

_ocr: Optional[PaddleOCR] = None

def load_ocr(config: Optional[OCRConfig] = None):
    global _ocr
    if _ocr is None:
        model = OCREngine(config)
        _ocr = model.get_ocr()
    return _ocr
