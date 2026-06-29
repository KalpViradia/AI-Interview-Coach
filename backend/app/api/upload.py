from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.tools.pdf_parser import extract_text_from_pdf
from app.core.upload_utils import validate_uploaded_file, validate_extracted_text

router = APIRouter(tags=["upload"])

@router.post("/parse-document")
async def parse_document(file: UploadFile = File(...), doc_type: str = Form(None)):
    """Parse an uploaded PDF or text document and return its text."""
    filename = file.filename.lower() if file.filename else ""
    try:
        content = await file.read()
        file_type = validate_uploaded_file(filename, content, max_size_mb=5)
        
        if file_type == 'pdf':
            text = extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8', errors='ignore')
            
        validate_extracted_text(text)
            
        return {"text": text}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
