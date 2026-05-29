import sys
import os
from ocr_services.ocr_model import load_ocr
from ocr_services.utils import save_byte_files, del_temp_files

sys.path.append(os.path.dirname(__file__))


def test_img(img: str):
    with open(img, "rb") as file:
        img_bytes = file.read()

    temp_file = save_byte_files(img_bytes, suffix=".png")
    print(f"временный файл создан: {temp_file}")
    ocr = load_ocr()

    result = ocr.predict(temp_file)

    del_temp_files(temp_file)

    if result:
        print("\nтекст:")
        data = result[0]
        if "res" in data:
            texts = data["res"].get("rec_texts", [])
        elif "rec_texts" in data:
            texts = data["rec_texts"]
        else:
            for key in data:
                if "text" in key.lower():
                    texts = data[key]
                    break
            else:
                texts = []
        full_text = "\n".join(texts) if isinstance(texts, list) else str(texts)
        print(full_text)
    else:
        print("текст не найден.")


if __name__ == "__main__":
    test_img("работа с текстом.png")
