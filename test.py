import sys
import os
from ocr_services.ocr_model import load_ocr
from ocr_services.utils import save_byte_files, del_temp_files
from regs import InvoiceDataExtractor

sys.path.append(os.path.dirname(__file__))
extractor = InvoiceDataExtractor()


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
        print()
        print(f"Номера счетов (20 цифр): {extractor.get_num_account(full_text)}")
        print(f"Дата: {extractor.get_data(full_text)}")
        print(f"Сумма: {extractor.get_summa(full_text)}")
        print(f"НДС %: {extractor.get_nds_procent(full_text)}")
        print(f"Сумма НДС: {extractor.get_nds_sum(full_text)}")
        print(f"ИНН поставщика: {extractor.get_provider_inn(full_text)}")
        print(f"Р/с поставщика: {extractor.get_provider_num_account(full_text)}")
        print(f"Название поставщика: {extractor.get_provider_name(full_text)}")
        print(f"ИНН покупателя: {extractor.get_buyer_inn(full_text)}")
        print(f"ФИО покупателя: {extractor.get_fio_buyer(full_text)}")
        print(f"Название покупателя: {extractor.get_buyer_name(full_text)}")
    else:
        print("текст не найден.")


if __name__ == "__main__":
    test_img("пример.jpg")
    test_img("пример2.jpg")
    test_img("пример3.jpg")
