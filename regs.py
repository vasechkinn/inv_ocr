import re


def get_num_account(text: str, separator=r"[ -]"):
    """
    формат номера счета
    4081 7810 0999 1000 0001
    4070-2810-5000-0000-0002
    12345678901234567890
    4081 7810-0999 1000-0001
    """
    del_separators = re.sub(separator, "", text)
    reg = r"(?<!\d)\d{20}(?!\d)"
    return re.findall(reg, del_separators)


def get_data(text: str):
    """
    форматы даты:
    12.03.2025
    12 03 2025
    11-03-2025
    13/03/2025
    """
    reg_data = r"(?i)(?:дата|от|за)\s*:?\s*(\d{2}[ ./-]\d{2}[ ./-]\d{4})"
    res = re.search(reg_data, text)
    if res:
        return res.group(1)

    reg = r"(?<!\d)\d{2}[ ./-]\d{2}[ ./-]\d{4}(?!\d)"
    res_all = re.findall(reg, text)
    return res_all[0] if res_all else None


def get_summa(text: str):
    reg_rub = r"(?i)(?<!\d)(\d+[,.]\d{2})\s*(?:руб|р\.|₽)"
    res = re.findall(reg_rub, text)
    if res:
        return res[0]

    reg = r"(?<!\d)\d+[,.]\d{2}(?!\d)"
    res_all = re.findall(reg, text)
    return res_all[0] if res_all else None


def get_provider_inn(text: str):
    """
    юр лицо: 10
    ип: 12
    """
    reg_1 = r"(?i)(?:ИНН\s+поставщика|ИНН\s+принципала|ИНН\s+продавца)\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)"
    res_1 = re.search(reg_1, text)
    if res_1:
        return res_1.group(1)

    reg_2 = r"(?i)ИНН\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)"
    res_2 = re.search(reg_2, text)
    if res_2:
        return res_2.group(1)

    return None


def get_provider_num_account(text: str):
    reg = r"(?i)(?:р/с|расч[её]тны[й]\s+сч[её]т|сч[её]т\s+поставщика)\s*:?\s*(?<!\d)(\d{20})(?!\d)"
    res = re.search(reg, text)
    return res.group(1) if res else None


def get_buyer_inn(text: str):
    reg = r"(?i)(?:ИНН\s+покупателя|ИНН\s+клиента|ИНН\s+заказчика|ИНН\s+плательщика)\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)"
    res = re.search(reg, text)

    return res.group(1) if res else None


text1 = "Счёт 4081 7810 0999 1000 0001 и 4070-2810-5000-0000-0002"
text = "Сегодня 12.03.2025, 12 03 2025 вчера 11-03-2025, завтра 13/03/2025"
summa = "Сумма 100.50 руб, ещё 1,99 евро и невалидные .99 или 100."
print(get_num_account(text1))
print(get_data(text))
print(get_summa(summa))
