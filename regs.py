import re
from typing import Optional, List, Union, Dict


class InvoiceDataExtractor:
    """
    Извлекает реквизиты из текста счёта, полученного OCR.
    """

    @staticmethod
    def _clean_ocr_text(text: str) -> str:
        """
        Замена часто встречающихся в OCR ошибочных символов
        """
        replacements = {"О": "0", "о": "0", "З": "3", "з": "3"}
        for wrong, right in replacements.items():
            text = text.replace(wrong, right)
        return text

    @staticmethod
    def _extract_section(
        text: str, start_marker: str, end_markers: List[str]
    ) -> Optional[str]:
        """
        Возвращает подстроку от start_marker (включительно) до первого из end_markers.
        """
        start_pos = text.lower().find(start_marker.lower())
        if start_pos == -1:
            return None
        end_pos = len(text)
        for marker in end_markers:
            pos = text.lower().find(marker.lower(), start_pos + len(start_marker))
            if pos != -1 and pos < end_pos:
                end_pos = pos
        return text[start_pos:end_pos].strip()

    def _block_text(self, text: str) -> Optional[str]:
        """
        Блок поставщика
        """
        return self._extract_section(
            text, "Поставщик:", ["Покупатель", "Итого", "Всего", "№"]
        )

    def _block_buyer(self, text: str) -> Optional[str]:
        """
        Блок покупателя
        """
        return self._extract_section(
            text, "Покупатель:", ["Итого", "Всего", "№", "Руководитель", "Бухгалтер"]
        )

    def get_num_account(self, text: str, separator: str = r"[ -]") -> List[str]:
        """
        Номера счетов (20 цифр).
        Форматы: 4081 7810 0999 1000 0001, 4070-2810-5000-0000-0002, 12345678901234567890 и т.п.
        """
        del_separators = re.sub(separator, "", text)
        reg = r"(?<!\d)\d{20}(?!\d)"
        return re.findall(reg, del_separators)

    def get_data(self, text: str) -> Optional[str]:
        """
        Дата в формате ДД.ММ.ГГГГ.
        Распознает: 12.03.2025, 12 03 2025, 11-03-2025, 13/03/2025, а также словесные месяцы.
        """
        months = {
            "января": "01",
            "февраля": "02",
            "марта": "03",
            "апреля": "04",
            "мая": "05",
            "июня": "06",
            "июля": "07",
            "августа": "08",
            "сентября": "09",
            "октября": "10",
            "ноября": "11",
            "декабря": "12",
        }
        reg_mon = r"(?i)(?:дата|от|за)\s*:?\s*(\d{1,2})\s+([а-я]+)\s+(\d{4})"
        res_mon = re.search(reg_mon, text)
        if res_mon:
            day, month_word, year = res_mon.groups()
            month = months.get(month_word.lower())
            if month:
                return f"{int(day):02d}.{month}.{year}"

        reg = r"(?<!\d)(\d{2}[ ./-]\d{2}[ ./-]\d{4})(?!\d)"
        res_all = re.search(reg, text)
        if res_all:
            return (
                res_all.group(1).replace(" ", ".").replace("-", ".").replace("/", ".")
            )
        return None

    def get_summa(self, text: str) -> Optional[str]:
        """
        Сумма платежа. Возвращает строку с запятой как разделителем копеек.
        """
        key_patterns = [
            r"(?i)(?:Итого|Всего\s+к\s+оплате)\s*:?\s*(?P<sum>\d[\d\s]*[,.]\d{2})",
            r"(?i)(?:Итого|Всего\s+к\s+оплате)\s*:?\s*(?P<sum_int>\d[\d\s]*)\s*(?:руб|р\.|₽)?",
        ]
        for pat in key_patterns:
            match = re.search(pat, text)
            if match:
                sum_str = (
                    match.group("sum")
                    if "sum" in match.groupdict()
                    else match.group("sum_int")
                )
                if sum_str:
                    cleaned = re.sub(r"\s", "", sum_str)
                    if "," not in cleaned and "." not in cleaned:
                        cleaned += ",00"
                    elif "." in cleaned:
                        cleaned = cleaned.replace(".", ",")
                    return cleaned

        reg_rub = r"(?i)(?<!\d)(\d+[,.]\d{2})\s*(?:руб|р\.|₽)"
        res = re.search(reg_rub, text)
        if res:
            return re.sub(r"\s", "", res.group(1))

        reg_rub_int = r"(?i)(?<!\d)(\d+)\s*(?:руб|р\.|₽)"
        res = re.search(reg_rub_int, text)
        if res:
            return re.sub(r"\s", "", res.group(1))

        reg = r"(?<!\d)\d+[,.]\d{2}(?!\d)"
        res_all = re.search(reg, text)
        return res_all.group() if res_all else None

    def get_nds_procent(self, text: str) -> Optional[int]:
        """
        Процент НДС (целое число) или 0, если НДС не облагается.
        """
        regs = [
            r"(?i)ндс\s*(\d{1,3})\s*%",
            r"(?i)ндс\s*(\d{1,3})\s*проц",
            r"(?i)ставка\s+ндс\s*[:=]\s*(\d{1,3})",
        ]
        for reg in regs:
            res = re.search(reg, text)
            if res:
                return int(res.group(1))
        reg_no_nds = r"(?i)без\s+(ндс|налога\s*\(?ндс\)?)|ндс\s+не\s+облагается"
        return 0 if re.search(reg_no_nds, text) else None

    def get_nds_sum(self, text: str) -> Optional[float]:
        """
        сумма НДС или None
        """
        regs = [
            r"(?i)(?:ндс|сумма\s+ндс|в\s+том\s+числе\s+ндс)\s*:?\s*(?<!\d)(\d+(?:[.,]\d{2})?|\d+)(?!\d)\s*(?:руб|р\.|₽)?",
            r"(?i)(?:ндс)\s*[-–]\s*(?<!\d)(\d+(?:[.,]\d{2})?|\d+)(?!\d)",
        ]
        for reg in regs:
            res = re.search(reg, text)
            if res:
                res_sum = res.group(1).replace(",", ".")
                try:
                    return float(res_sum)
                except ValueError:
                    continue
        return None

    def get_provider_inn(self, text: str) -> Optional[str]:
        """
        ИНН поставщика 10 или 12 цифр
        """
        block = self._block_text(text)
        if not block:
            block = text
        clean_block = self._clean_ocr_text(block)
        reg = r"(?i)ИНН\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)"
        res = re.search(reg, clean_block)
        return res.group(1) if res else None

    def get_provider_num_account(self, text: str) -> Optional[str]:
        """
        номер счёта поставщика (20 цифр)
        """
        block = self._block_text(text)
        if not block:
            block = text
        clean_block = self._clean_ocr_text(block)
        reg = r"(?i)(?:р/с|расч[её]тны[й]\s+сч[её]т|сч[её]т\s+№|сч\.\s*№|счет)\s*:?\s*(?<!\d)(\d{20})(?!\d)"
        res = re.search(reg, clean_block)
        return res.group(1) if res else None

    def get_provider_name(self, text: str) -> Optional[str]:
        """
        название компании поставщика
        """
        block = self._block_text(text)
        if not block:
            block = text
        block = re.sub(r"^Поставщик:\s*", "", block, flags=re.IGNORECASE)
        clean_block = self._clean_ocr_text(block)
        org_forms = r"(?:ООО|ЗАО|ОАО|АО|ПАО|НКО|ТСЖ|ИП|ТОО|ЧУП|ГУП|МУП|Общество с ограниченной ответственностью|Закрытое акционерное общество|Открытое акционерное общество)"
        name_match = re.search(
            rf"({org_forms}[^,]+?)(?=\s*,\s*ИНН|\s*$|\n)", clean_block, re.IGNORECASE
        )
        return name_match.group(1).strip() if name_match else None

    def get_buyer_inn(self, text: str) -> Optional[str]:
        """
        ИНН покупателя
        """
        block = self._block_buyer(text)
        if not block:
            block = text
        clean_block = self._clean_ocr_text(block)
        inn_match = re.search(
            r"(?i)ИНН\s*:?\s*(?<!\d)(\d{10}|\d{12})(?!\d)", clean_block
        )
        return inn_match.group(1) if inn_match else None

    def get_fio_buyer(self, text: str) -> Optional[str]:
        """
        ФИО покупателя (физического лица)
        """
        block = self._block_buyer(text)
        if block:
            reg = r"([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]\.\s*[А-ЯЁ][а-яё]\.)"
            res = re.search(reg, block)
            if not res:
                reg = r"([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)"
                res = re.search(reg, block)
            if res:
                return res.group(1).strip()

        end_section = text[-500:]
        sign_patterns = [
            r"(?i)руководитель\s*/?([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]\.\s*[А-ЯЁ][а-яё]\.)",
            r"(?i)генеральный\s+директор\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)",
            r"(?i)директор\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)",
            r"(?i)исполнитель\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)",
            r"(?i)подпись\s+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)",
            r"/([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]\.\s*[А-ЯЁ][а-яё]\.)/",
        ]
        for pattern in sign_patterns:
            match = re.search(pattern, end_section)
            if match:
                return match.group(1).strip()
        return None

    def get_buyer_name(self, text: str) -> Optional[str]:
        """
        название организации покупателя
        """
        block = self._block_buyer(text)
        if not block:
            block = text
        block = re.sub(r"^Покупатель:\s*", "", block, flags=re.IGNORECASE)
        clean_block = self._clean_ocr_text(block)
        org_forms = r"(?:ООО|ЗАО|ОАО|АО|ПАО|НКО|ТСЖ|ИП|ТОО|ЧУП|ГУП|МУП|Общество с ограниченной ответственностью|Закрытое акционерное общество)"
        name_match = re.search(
            rf"({org_forms}[^,]+?)(?=\s*,\s*ИНН|\s*$|\n)", clean_block, re.IGNORECASE
        )
        return name_match.group(1).strip() if name_match else None

    def extract_all(
        self, text: str
    ) -> Dict[str, Union[str, int, float, List[str], None]]:
        """
        Извлекает все реквизиты и возвращает их в виде словаря
        """
        return {
            "accounts_20": self.get_num_account(text),
            "date": self.get_data(text),
            "summa": self.get_summa(text),
            "nds_percent": self.get_nds_procent(text),
            "nds_sum": self.get_nds_sum(text),
            "provider_inn": self.get_provider_inn(text),
            "provider_account": self.get_provider_num_account(text),
            "provider_name": self.get_provider_name(text),
            "buyer_inn": self.get_buyer_inn(text),
            "buyer_fio": self.get_fio_buyer(text),
            "buyer_name": self.get_buyer_name(text),
        }
