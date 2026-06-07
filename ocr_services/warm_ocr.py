from ocr_services.ocr_model import load_ocr

ocr_model  = None
def init_oct():
    global ocr_model
    if ocr_model is None:
        ocr_model = load_ocr()
        print('паддла загружена (▽◕ ᴥ ◕▽)')
    return ocr_model