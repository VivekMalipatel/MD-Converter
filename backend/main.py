from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from markitdown import MarkItDown
from io import BytesIO
import fitz

app = FastAPI()
md = MarkItDown()

SUPPORTED = {
    '.pdf', '.docx', '.xlsx', '.pptx', '.html', '.txt', '.csv',
    '.xml', '.rss', '.atom', '.ipynb', '.zip',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp',
    '.mp3', '.wav', '.ogg', '.m4a',
}

def pdf_to_markdown(data: bytes) -> str:
    doc = fitz.open(stream=data, filetype="pdf")
    parts = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            parts.append(text)
    doc.close()
    return "\n\n".join(parts)

@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    ext = '.' + (file.filename or '').rsplit('.', 1)[-1].lower()
    if ext not in SUPPORTED:
        raise HTTPException(status_code=422, detail=f'File type "{ext}" is not supported. Supported: {", ".join(sorted(SUPPORTED))}')
    data = await file.read()
    try:
        if ext == '.pdf':
            text = pdf_to_markdown(data)
            title = ""
        else:
            result = md.convert_stream(BytesIO(data), file_extension=ext)
            text = getattr(result, 'text_content', '') or ''
            title = getattr(result, 'title', '') or ''
    except Exception as e:
        raise HTTPException(status_code=422, detail=f'Conversion failed: {e}')
    if not text.strip():
        raise HTTPException(status_code=422, detail='No content could be extracted from this file.')
    return JSONResponse({'markdown': text, 'title': title})

@app.get("/health")
async def health():
    return {"ok": True}

@app.get("/health")
async def health():
    return {"ok": True}
