import json
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session
from typing import Annotated
from database import get_db
from schemas import(
    InvoiceUpdate,
    InvoiceResponse,
    SupplierCreate,
    BuyerCreate,
    InvoiceCreate,
)
from models import Invoice
from web_app.crud import(
    get_or_create_sup,
    get_or_create_buyer,
    create_invoice,
)


router= APIRouter()
@router.post('/save/invoice')
async def save_inv(
    data: InvoiceUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        supplier_data = SupplierCreate(
            inn_sup=data.provider_inn,
            num_acc=data.provider_account,
            name_sup=data.provider_name
        )
        sup = get_or_create_sup(db, supplier_data)

        buyer_data= BuyerCreate(
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
            supplier_id=sup.id
        )
        invoice = create_invoice(db, invoice_create, user_id=None)
        db.refresh(invoice)

        response = InvoiceResponse.model_validate(invoice)
        return {
            "success": True,
            "message": "Счёт сохранён",
            "invoice": response.model_dump(),
            "copy_text": response.model_dump_json(ensure_ascii=False, indent=2)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )