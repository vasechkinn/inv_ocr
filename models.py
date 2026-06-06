from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import (
    mapped_column,
    Mapped,
    relationship,
)
from sqlalchemy import String, ForeignKey, func
from database import Base


class Buyer(Base):
    __tablename__ = "buyers"
    id: Mapped[int] = mapped_column(primary_key=True)
    fio: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    inn_b: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    buyer_company: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    invoices: Mapped[List["Invoice"]] = relationship(back_populates="buyer")


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_username: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    invoices: Mapped[List["Invoice"]] = relationship(back_populates="user")


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    summ: Mapped[Optional[float]] = mapped_column(nullable=True)
    nds_percent: Mapped[Optional[int]] = mapped_column(nullable=True)
    nds_sum: Mapped[Optional[float]] = mapped_column(nullable=True)

    buyer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("buyers.id"), nullable=True
    )
    buyer: Mapped[Optional["Buyer"]] = relationship(back_populates="invoices")

    supplier_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("suppliers.id"), nullable=True
    )
    supplier: Mapped[Optional["Supplier"]] = relationship(back_populates="invoices")

    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    user: Mapped[Optional["User"]] = relationship(back_populates="invoices")


class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[int] = mapped_column(primary_key=True)
    inn_sup: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    num_acc: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    name_sup: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    invoices: Mapped[List["Invoice"]] = relationship(back_populates="supplier")
