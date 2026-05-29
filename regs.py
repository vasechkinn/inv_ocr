import re

def get_num_account(text: str, separator = r'[ -]'):
    """
    формат номера счета
    4081 7810 0999 1000 0001
    4070-2810-5000-0000-0002
    12345678901234567890
    4081 7810-0999 1000-0001
    """
    del_separators = re.sub(separator, '', text)
    reg = r'(?<!\d)\d{20}(?!\d)'
    return re.findall(reg, del_separators)

def get_data(text: str):
    """
    форматы даты:
    12.03.2025
    12 03 2025
    11-03-2025
    13/03/2025
    """
    reg = r'(?<!\d)\d{2}[ ./-]\d{2}[ ./-]\d{4}(?!\d)'
    return re.findall(reg, text)

def get_summa(text: str):
    reg = r'(?<!\d)\d+[,.]\d{2}(?!\d)'
    return re.findall(reg, text)

text1 = "Счёт 4081 7810 0999 1000 0001 и 4070-2810-5000-0000-0002"
text = "Сегодня 12.03.2025, 12 03 2025 вчера 11-03-2025, завтра 13/03/2025"
summa = "Сумма 100.50 руб, ещё 1,99 евро и невалидные .99 или 100."
print(get_num_account(text1))
print(get_data(text))
print(get_summa(summa))