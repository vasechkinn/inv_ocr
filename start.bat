@echo off
call conda activate paddle_gpu
cd /d "C:\Users\drpav\OneDrive\Рабочий стол\inv_ocr"
python test.py
echo.
echo Готово! Нажмите любую клавишу для выхода...
pause > nul