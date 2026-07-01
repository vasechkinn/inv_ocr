import os
from io import BytesIO
from pdf2image.exceptions import PDFPageCountError, PDFSyntaxError
from PIL import Image
from ocr_services.utils import (
    converted_pdf,
    save_pil_file,
    save_byte_files,
    get_pdf_page_count,
)


class FileConversionError(Exception):
    pass


def convert_img(file: bytes, filename: str, max_pages: int = 3):
    name = filename.lower()
    path = None

    try:
        if name.endswith(".pdf"):
            try:
                page_count = get_pdf_page_count(file)
            except Exception as e:
                raise FileConversionError(f"ошибка чтения метаданных PDF: {str(e)}")

            if page_count > max_pages:
                raise FileConversionError(
                    f"Документ содержит {page_count} страниц, максимум: {max_pages}"
                )

            try:
                img = converted_pdf(file)
            except (PDFPageCountError, PDFSyntaxError) as e:
                raise FileConversionError(f"ошибка чтения: {str(e)}")

            if not img:
                raise FileConversionError("PDF не содержит страниц")

            path = save_pil_file(img[0], suffix=".png")
        else:
            suff = os.path.splitext(name)[1].lower()
            forms = (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")
            if suff not in forms:
                raise FileConversionError(
                    f"неподдерживаемый формат файла: {suff}."
                    f" Поддерживаются: {', '.join(forms)}"
                )

            if suff == ".webp":
                img = Image.open(BytesIO(file))
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                path = save_pil_file(img, suffix=".png")
            else:
                path = save_byte_files(file, suffix=suff)

        return path
    except FileConversionError:
        raise
    except Exception as e:
        raise FileConversionError(f"ошибка обработки: {str(e)}")
