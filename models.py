from sqlalchemy.orm import (
    mapped_column,
    Mapped,
    relationship,
)
from datetime import datetime
from sqlalchemy import (
    String,
    ForeignKey,
)
from database import Base


class Buyer(Base):
    __tablename__ = "buyers"
    id: Mapped[int] = mapped_column(primary_key=True)
    fio: Mapped[str] = mapped_column(String(256), nullable=True)
    inn_b: Mapped[str] = mapped_column(String(12), nullable=True)
    buyer_company: Mapped[str] = mapped_column(String(256), nullable=True)
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="buyer")


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[datetime] = mapped_column(nullable=True)
    summ: Mapped[float] = mapped_column(nullable=True)
    nds_percent: Mapped[int] = mapped_column(nullable=True)
    nds_sum: Mapped[float] = mapped_column(nullable=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("buyers.id"), nullable=True)
    buyer: Mapped["Buyer"] = relationship(back_populates="invoices")
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), nullable=True)
    supplier: Mapped["Supplier"] = relationship(back_populates="invoices")


class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[int] = mapped_column(primary_key=True)
    inn_sup: Mapped[str] = mapped_column(String(12), nullable=True)
    num_acc: Mapped[str] = mapped_column(String(30), nullable=True)
    name_sup: Mapped[str] = mapped_column(String(256), nullable=True)
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="supplier")
