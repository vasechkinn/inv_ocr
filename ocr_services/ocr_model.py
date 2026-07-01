import os
import logging
from paddleocr import PaddleOCR
from dataclasses import dataclass
from typing import Optional

os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "1"
os.environ["PADDLEX_HOME"] = "./paddlex_models"
os.environ["FLAGS_use_mkldnn"] = "0"

logging.getLogger("ppocr").setLevel(logging.ERROR)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@dataclass(frozen=True)
class OCRConfig:
    lang: str = "ru"
    use_doc_orientation_classify: bool = True
    use_doc_unwarping: bool = False
    use_textline_orientation: bool = False
    use_gpu: bool = True


class OCREngine:
    _example: Optional["OCREngine"] = None

    def __new__(cls, config: Optional[OCRConfig] = None):
        if cls._example is None:
            print("инициализация паддлы...")
            cls._example = super().__new__(cls)

            if config is None:
                config = OCRConfig()

            device = "gpu" if config.use_gpu else "cpu"

            params = {
                "lang": config.lang,
                "use_doc_orientation_classify": config.use_doc_orientation_classify,
                "use_doc_unwarping": config.use_doc_unwarping,
                "use_textline_orientation": config.use_textline_orientation,
                "device": device,
                "enable_mkldnn": False,
            }
            cls._example.ocr = PaddleOCR(**params)
        return cls._example

    def get_ocr(self):
        """
        Возвращает экземпляр PaddleOCR
        """
        return self.ocr


_ocr_model: Optional[PaddleOCR] = None


def load_ocr(config: Optional[OCRConfig] = None):
    global _ocr_model
    if _ocr_model is None:
        model = OCREngine(config)
        _ocr_model = model.get_ocr()
    return _ocr_model
