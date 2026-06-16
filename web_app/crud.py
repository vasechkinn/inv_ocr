from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Optional
from datetime import date, datetime
from models import Invoice, Supplier, Buyer, User
from schemas import (
    FullOcrResult,
    InvoiceCreate,
    InvoiceUpdate,
    BuyerCreate,
    SupplierCreate,
    UserCreate,
    UserLogin,
)


def _find_supplier(
    db: Session,
    inn: str = None,
    name: str = None,
) -> Supplier | None:
    if inn:
        res = select(Supplier).where(Supplier.inn_sup == inn)
        supplier = db.execute(res).scalar_one_or_none()
        if supplier:
            return supplier

    if name:
        res = select(Supplier).where(Supplier.name_sup == name)
        return db.execute(res).scalar_one_or_none()

    return None


def _find_buyer(
    db: Session,
    inn: str = None,
    name: str = None,
    fio: str = None,
) -> Buyer | None:
    if inn:
        res = select(Buyer).where(Buyer.inn_b == inn)
        buyer = db.execute(res).scalar_one_or_none()
        if buyer:
            return buyer

    if name:
        res = select(Buyer).where(Buyer.buyer_company == name)
        buyer = db.execute(res).scalar_one_or_none()
        if buyer:
            return buyer

    if fio:
        res = select(Buyer).where(Buyer.fio == fio)
        buyer = db.execute(res).scalar_one_or_none()
        if buyer:
            return buyer

    return None


def get_or_create_sup(
    db: Session,
    supplier_data: SupplierCreate,
) -> Supplier:
    if supplier_data.inn_sup:
        sup = _find_supplier(db, inn=supplier_data.inn_sup)
        if sup:
            return sup

    if supplier_data.name_sup:
        sup = _find_supplier(db, name=supplier_data.name_sup)
        if sup:
            return sup

    sup = Supplier(**supplier_data.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup


def get_or_create_buyer(
    db: Session,
    buyer_data: BuyerCreate,
) -> Buyer:
    if buyer_data.inn_b:
        buyer = _find_buyer(db, buyer_data.inn_b)
        if buyer:
            return buyer

    if buyer_data.buyer_company:
        buyer = _find_buyer(db, buyer_data.buyer_company)
        if buyer:
            return buyer

    if buyer_data.fio:
        buyer = _find_buyer(db, buyer_data.fio)
        if buyer:
            return buyer

    buyer = Buyer(**buyer_data.model_dump())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer


def create_invoice(db: Session, invoice_data: InvoiceCreate, user_id: int) -> Invoice:
    invoice = Invoice(**invoice_data.model_dump(), user_id=user_id)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice
