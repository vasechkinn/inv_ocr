import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from ocr_services.utils import (
    del_temp_files,
)
from ocr_services.convert import convert_img, FileConversionError
from regs import InvoiceDataExtractor
from schemas import UploadFileResponse, PaymentDetails, FullOcrResult
from ocr_services import warm_ocr


router = APIRouter(prefix="/upload", tags=["OCR"])
ocr = InvoiceDataExtractor()

if warm_ocr.ocr_model is None:
    warm_ocr.init_ocr()


@router.post("/", response_model=UploadFileResponse)
async def upload_file(
    file: UploadFile = File(...),
):
    content = await file.read()

    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="no file")

    path = None
    full_text = ""
    try:
        try:
            path = convert_img(content, file.filename)
        except FileConversionError as e:
            raise HTTPException(status_code=400, detail=str(e))

        res = warm_ocr.ocr_model.predict(path)
        if res and len(res) > 0:
            data = res[0]
            text = data.get("res", {}).get("rec_texts", []) or data.get("rec_texts", [])
            full_text = "\n".join(text)

        if not full_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="no text"
            )

        extracted = ocr.extract_all(full_text)

        payment_details = PaymentDetails(
            date=extracted.get("date"),
            total_sum=extracted.get("summa"),
            nds_percent=extracted.get("nds_percent"),
            nds_sum=extracted.get("nds_sum"),
            provider_name=extracted.get("provider_name"),
            provider_inn=extracted.get("provider_inn"),
            provider_account=extracted.get("provider_account"),
            buyer_name=extracted.get("buyer_name"),
            buyer_inn=extracted.get("buyer_inn"),
            raw_text_preview=full_text[:500],
        )

        full_result = FullOcrResult(
            full_text=full_text,
            accounts_20=extracted.get("accounts_20", []),
            date=extracted.get("date"),
            summa=extracted.get("summa"),
            nds_percent=extracted.get("nds_percent"),
            nds_sum=extracted.get("nds_sum"),
            provider_inn=extracted.get("provider_inn"),
            provider_account=extracted.get("provider_account"),
            provider_name=extracted.get("provider_name"),
            buyer_inn=extracted.get("buyer_inn"),
            buyer_fio=extracted.get("buyer_fio"),
            buyer_name=extracted.get("buyer_name"),
        )

        return UploadFileResponse(
            success=True,
            message="файл успешно обработан",
            payment_details=payment_details,
            full_text=full_result,
        )
    finally:
        if path:
            del_temp_files(path)
