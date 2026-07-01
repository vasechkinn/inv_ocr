from datetime import datetime, date as dt
from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
    ConfigDict,
    EmailStr,
)
from typing import Optional, List, ClassVar

MAX_LEN_NAME = 256
MAX_LEN_INN = 12
MAX_LEN_ACCOUNT = 20


class PaymentDetails(BaseModel):
    """
    извлеченные данные
    """

    invoice_id: Optional[int] = None
    date: Optional[dt] = None
    total_sum: Optional[str] = Field(None)
    nds_percent: Optional[int] = Field(None, ge=0, le=100)
    nds_sum: Optional[float] = Field(None, ge=0)
    provider_name: Optional[str] = Field(None, max_length=MAX_LEN_NAME)
    provider_inn: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    provider_account: Optional[str] = Field(None, max_length=MAX_LEN_ACCOUNT)
    buyer_name: Optional[str] = Field(None, max_length=MAX_LEN_NAME)
    buyer_inn: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    raw_text_preview: Optional[str] = Field(None, max_length=500)

    @field_validator("total_sum", mode="before")
    @classmethod
    def validate_summa_format(cls, summ: Optional[str]) -> Optional[str]:
        if summ is None:
            return None

        if "," not in summ and "." not in summ:
            return f"{summ},00"

        if "." in summ:
            return summ.replace(".", ",")

        return summ

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, date_):
        if isinstance(date_, str):
            try:
                return datetime.strptime(date_, "%d.%m.%Y").date()
            except ValueError:
                return None

        return date_

    @field_validator("date")
    @classmethod
    def not_future(cls, v: Optional[dt]) -> Optional[dt]:
        if v and v > dt.today():
            return None
        return v

    @field_validator("provider_account")
    @classmethod
    def validate_account(cls, acc: Optional[str]) -> Optional[str]:
        if acc is None:
            return None

        cleaned = "".join(filter(str.isdigit, acc))
        if len(cleaned) == 20:
            return cleaned

        return None

    @field_validator("provider_inn", "buyer_inn")
    @classmethod
    def validate_inn(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None

        cleaned = "".join(filter(str.isdigit, v))
        if len(cleaned) in (10, 12):
            return cleaned

        return None

    @model_validator(mode="after")
    def check_nds_sum(self):
        if self.nds_sum is not None and self.total_sum is not None:
            try:
                total = float(self.total_sum.replace(",", "."))
            except (ValueError, AttributeError):
                return self

            if self.nds_sum > total:
                self.nds_sum = None
        return self


class BuyerCreate(BaseModel):
    fio: Optional[str] = Field(None, max_length=MAX_LEN_NAME)
    inn_b: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    buyer_company: Optional[str] = Field(None, max_length=MAX_LEN_NAME)

    @field_validator("inn_b")
    @classmethod
    def validate_inn_b(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        if not v.isdigit():
            raise ValueError("ИНН должен содержать только цифры")
        if len(v) not in (10, 12):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        return v


class BuyerResponse(BaseModel):
    id: int
    fio: Optional[str] = None
    inn_b: Optional[str] = None
    buyer_company: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SupplierCreate(BaseModel):
    inn_sup: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    num_acc: Optional[str] = Field(None, max_length=MAX_LEN_ACCOUNT)
    name_sup: Optional[str] = Field(None, max_length=MAX_LEN_NAME)

    @field_validator("inn_sup")
    @classmethod
    def validate_inn_sup(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        if not v.isdigit():
            raise ValueError("ИНН поставщика должен содержать только цифры")
        if len(v) not in (10, 12):
            raise ValueError("ИНН поставщика должен содержать 10 или 12 цифр")
        return v

    @field_validator("num_acc")
    @classmethod
    def validate_num_acc(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        if not v.isdigit():
            raise ValueError("Номер счёта должен содержать только цифры")
        if len(v) != 20:
            raise ValueError("Номер счёта должен содержать 20 цифр")
        return v


class SupplierResponse(BaseModel):
    id: int
    inn_sup: Optional[str] = None
    num_acc: Optional[str] = None
    name_sup: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    date: Optional[dt] = None
    summ: Optional[float] = None
    nds_percent: Optional[int] = Field(None, ge=0, le=100)
    nds_sum: Optional[float] = Field(None, ge=0)
    buyer_id: Optional[int] = None
    supplier_id: Optional[int] = None


class FullOcrResult(BaseModel):
    full_text: Optional[str] = None
    accounts_20: List[str] = []
    date: Optional[str] = None
    summa: Optional[str] = None
    nds_percent: Optional[int] = None
    nds_sum: Optional[float] = None
    provider_inn: Optional[str] = None
    provider_account: Optional[str] = None
    provider_name: Optional[str] = None
    buyer_inn: Optional[str] = None
    buyer_fio: Optional[str] = None
    buyer_name: Optional[str] = None


class UploadFileResponse(BaseModel):
    success: bool = True
    message: str = "Файл успешно обработан"
    payment_details: PaymentDetails
    full_text: FullOcrResult


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    details: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

    FOREIGN_EMAIL_DOMAINS: ClassVar[set[str]] = {
        "gmail.com",
        "googlemail.com",
        "yahoo.com",
        "yahoo.ru",
        "outlook.com",
        "hotmail.com",
        "live.com",
        "msn.com",
        "icloud.com",
        "me.com",
        "mac.com",
        "protonmail.com",
        "proton.me",
        "mail.com",
        "aol.com",
        "zoho.com",
        "gmx.com",
        "gmx.de",
        "tutanota.com",
        "tuta.io",
        "yandex.com",
    }

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        domain = v.lower().split("@")[1]
        if domain in cls.FOREIGN_EMAIL_DOMAINS:
            raise ValueError(
                "Регистрация через иностранные почтовые сервисы запрещена. "
                "Используйте российские домены: @mail.ru, @bk.ru, @list.ru, @inbox.ru, "
                "@internet.ru, @yandex.ru, @ya.ru, @rambler.ru"
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class InvoiceUpdate(BaseModel):
    date: Optional[dt] = None
    summa: Optional[str] = None
    nds_percent: Optional[int] = Field(None, ge=0, le=100)
    nds_sum: Optional[float] = Field(None, ge=0)

    provider_name: Optional[str] = Field(None, max_length=MAX_LEN_NAME)
    provider_inn: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    provider_account: Optional[str] = Field(None, max_length=MAX_LEN_ACCOUNT)

    buyer_name: Optional[str] = Field(None, max_length=MAX_LEN_NAME)
    buyer_inn: Optional[str] = Field(None, max_length=MAX_LEN_INN)
    buyer_fio: Optional[str] = Field(None, max_length=MAX_LEN_NAME)

    @field_validator("provider_inn", "buyer_inn")
    @classmethod
    def validate_inn(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        if not v.isdigit():
            raise ValueError("ИНН должен содержать только цифры")
        if len(v) not in (10, 12):
            raise ValueError("ИНН должен содержать 10 или 12 цифр")
        return v

    @field_validator("provider_account")
    @classmethod
    def validate_account(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        if not v.isdigit():
            raise ValueError("Номер счёта должен содержать только цифры")
        if len(v) != 20:
            raise ValueError("Номер счёта должен содержать 20 цифр")
        return v

    @field_validator("date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Некорректный формат даты. Ожидается YYYY-MM-DD")
        return v


class InvoiceResponse(InvoiceCreate):
    id: int
    user_id: Optional[int] = None
    buyer: Optional[BuyerResponse] = None
    supplier: Optional[SupplierResponse] = None
    model_config = ConfigDict(from_attributes=True)
