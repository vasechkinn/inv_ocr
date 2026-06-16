import json
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
)
from sqlalchemy.orm import Session
from sqlalchemy import desc, select, func
from database import get_db
from schemas import (
    InvoiceUpdate,
    InvoiceResponse,
    SupplierCreate,
    BuyerCreate,
    InvoiceCreate,
)
from models import Invoice
from web_app.crud import (
    get_or_create_sup,
    get_or_create_buyer,
    create_invoice,
)
from security import get_current_user, User

router = APIRouter(prefix="/save", tags=["Save"])


@router.get("/my-invoices")
async def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(10, ge=1, le=100, description="Количество записей на странице"),
):
    offset = (page - 1) * limit
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.user_id == current_user.id)
        .order_by(desc(Invoice.id))
        .offset(offset)
        .limit(limit)
    ).all()

    total = db.scalar(select(func.count()).where(Invoice.user_id == current_user.id))

    return {
        "success": True,
        "invoices": [
            InvoiceResponse.model_validate(inv).model_dump() for inv in invoices
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": offset + len(invoices) < total,
    }


@router.post("/invoice")
async def save_inv(
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        supplier_data = SupplierCreate(
            inn_sup=data.provider_inn,
            num_acc=data.provider_account,
            name_sup=data.provider_name,
        )
        sup = get_or_create_sup(db, supplier_data)

        buyer_data = BuyerCreate(
            inn_b=data.buyer_inn,
            buyer_company=data.buyer_name,
            fio=data.buyer_fio,
        )
        buyer = get_or_create_buyer(db, buyer_data)

        summ_float = None
        if data.summa:
            try:
                summ_float = float(data.summa.replace(",", "."))
            except ValueError:
                pass

        invoice_create = InvoiceCreate(
            date=data.date,
            summ=summ_float,
            nds_percent=data.nds_percent,
            nds_sum=data.nds_sum,
            buyer_id=buyer.id,
            supplier_id=sup.id,
        )
        invoice = create_invoice(db, invoice_create, current_user.id)
        db.refresh(invoice)

        response = InvoiceResponse.model_validate(invoice)
        return {
            "success": True,
            "message": "Счёт сохранён",
            "invoice": response.model_dump(),
            "copy_text": response.model_dump_json(ensure_ascii=False, indent=2),
        }

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
