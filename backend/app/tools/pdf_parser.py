"""
PDF Parser Tool

Extracts text from PDF files using PyMuPDF.
"""

import fitz

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts all text from a PDF byte stream."""
    text = ""
    try:
        # Open the PDF from memory
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise ValueError("Failed to parse the PDF file. Please ensure it is a valid PDF.")
        
    if not text.strip():
        raise ValueError("No text could be extracted from the PDF. It might be a scanned image.")
        
    return text.strip()
