import re
from typing import Optional, List, Union

def _clean_ocr_text(text: str) -> str:
    """Замена часто встречающихся в OCR ошибочных символов"""
    replacements = {
        'О': '0', 'о': '0',
        'З': '3', 'з': '3',
        'В': '8', 'в': '8',
    }
    for wrong, right in replacements.items():
        text = text.replace(wrong, right)
    return text

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
    months = {
        'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
        'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
        'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
    }
    reg_mon = r'(?i)(?:дата|от|за)\s*:?\s*(\d{1,2})\s+([а-я]+)\s+(\d{4})'
    res_mon = re.search(reg_mon, text)

    if res_mon:
        day, month_word, year = res_mon.groups()
        month = months.get(month_word.lower())
        if month:
            return f"{int(day):02d}.{month}.{year}"

    reg = r"(?<!\d)\d{2}[ ./-]\d{2}[ ./-]\d{4}(?!\d)"
    res_all = re.search(reg, text)
    if res_all:
        return res_all.group(1).replace(' ', '.').replace('-', '.').replace('/', '.')
    
    return None


def get_summa(text: str):
    """
    сумма платежа
    """
    reg_rub = r"(?i)(?<!\d)(\d+[,.]\d{2})\s*(?:руб|р\.|₽)"
    res = re.search(reg_rub, text)
    if res:
        return re.sub(r'\s', '', res.group(1))
    
    reg_rub_int = r"(?i)(?<!\d)(\d+)\s*(?:руб|р\.|₽)"
    res = re.search(reg_rub_int, text)
    if res:
        return re.sub(r'\s', '', res.group(1))

    reg = r"(?<!\d)\d+[,.]\d{2}(?!\d)"
    res_all = re.search(reg, text)
    return res_all.group(1) if res_all else None


def get_nds_procent(text: str):
    """
    процент ндс
    """
    regs = [
        r'(?i)ндс\s*(\d{1,3})\s*%',
        r'(?i)ндс\s*(\d{1,3})\s*проц',
        r'(?i)ставка\s+ндс\s*[:=]\s*(\d{1,3})',
    ]
    for reg in regs:
        res = re.search(reg, text)
        if res:
            return int(res.group(1))
    
    reg_no_nds = r'(?i)без\s+(ндс|налога\s*\(?ндс\)?)|ндс\s+не\s+облагается'
    res = re.search(reg_no_nds, text)
    return 0 if res else None


def get_nds_sum(text: str):
    regs = [
        r'(?i)(?:ндс|сумма\s+ндс|в\s+том\s+числе\s+ндс)\s*:?\s*(?<!\d)(\d+(?:[.,]\d{2})?|\d+)(?!\d)\s*(?:руб|р\.|₽)?',
        r'(?i)(?:ндс)\s*[-–]\s*(?<!\d)(\d+(?:[.,]\d{2})?|\d+)(?!\d)'
    ]
    for reg in regs:
        res= re.search(reg, text)
        if res:
            res_sum = res.group(1).replace(',', '.')
            return float(res_sum)
    
    return None


def _block_text(text: str, direction: str):
    pattern = rf'(?i){direction}\s*:?\s*(.+?)(?=\n\s*(?:поставщик|покупатель|итого|всего|$))'
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

    return match.group(1) if match else None

def get_provider_inn(text: str):
    """
    юр лицо: 10
    ип: 12
    """
    block = _block_text(text, 'поставщик')
    if not block:
        return None
    
    reg_1 = r"(?i)ИНН\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)"
    res_1 = re.search(reg_1, block)

    return res_1.group(1) if res_1 else None


def get_provider_num_account(text: str):
    block = _block_text(text, 'поставщик')
    if not block:
        return None
    
    reg = r"(?i)(?:р/с|расч[её]тны[й]\s+сч[её]т|сч[её]т\s+поставщика)\s*:?\s*(?<!\d)(\d{20})(?!\d)"
    res = re.search(reg, block)
    return res.group(1) if res else None


def get_provider_name(text: str):
    block = _block_text(text, 'поставщик')
    if not block:
        return None
    
    org_forms = r'(?:ООО|ЗАО|ОАО|АО|ПАО|НКО|ТСЖ|ИП|ТОО|ЧУП|ГУП|МУП|ОООО)'
    name_match = re.search(rf'({org_forms}[^,]+?)(?=\s*,\s*ИНН|\s*$|\n)', block, re.IGNORECASE)

    return name_match.group(1).strip() if name_match else None


def get_buyer_inn(text: str) -> str | None:
    block = _block_text(text, 'покупатель')
    if not block:
        return None
    
    inn_match = re.search(r'(?i)ИНН\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)', block)
    
    return inn_match.group(1) if inn_match else None


def get_fio_buyer(text: str):
    block = _block_text(text, 'покупатель')
    if not block:
        return None
    
    reg = r"([А-ЯЁ][а-яё\-]+(?:\s+[А-ЯЁ][а-яё\-\.]+){1,2})"
    res = re.search(reg, block)
    return res.group(1).strip() if res else None


def get_buyer_name(text: str):
    block = _block_text(text, 'покупатель')
    if not block:
        return None
    
    org_forms = r'(?:ООО|ЗАО|ОАО|АО|ПАО|НКО|ТСЖ|ИП|ТОО|ЧУП|ГУП|МУП|ОООО)'
    name_match = re.search(rf'({org_forms}[^,]+?)(?=\s*,\s*ИНН|\s*$|\n)', block, re.IGNORECASE)

    return name_match.group(1).strip() if name_match else None