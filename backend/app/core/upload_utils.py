def validate_uploaded_file(filename: str, content: bytes, max_size_mb: int = 5) -> str:
    """
    Validates file extension, double extensions, size, MIME type (via magic numbers),
    and returns the file type ('pdf' or 'txt').
    Raises ValueError on validation failure.
    """
    if not filename:
        raise ValueError("Filename is required.")
        
    filename_lower = filename.lower()
    
    # Strictly reject executable extensions anywhere in the name
    suspicious_exts = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.js', '.vbs', '.php', '.py']
    if any(ext in filename_lower for ext in suspicious_exts):
        raise ValueError("Suspicious file extension detected.")
    
    if not filename_lower.endswith('.pdf') and not filename_lower.endswith('.txt'):
        raise ValueError("Only PDF and TXT files are supported.")
        
    if len(content) > max_size_mb * 1024 * 1024:
        raise ValueError(f"File size exceeds the {max_size_mb} MB limit.")
        
    if len(content) == 0 or content.isspace():
        raise ValueError("The uploaded document is empty.")
        
    # Check Magic bytes for PDF
    if filename_lower.endswith('.pdf'):
        if not content.startswith(b'%PDF-'):
            raise ValueError("Invalid PDF file format. The file appears to be corrupted or not a true PDF.")
        return 'pdf'
    
    return 'txt'

def validate_extracted_text(text: str):
    """
    Raises ValueError if text is empty or only whitespace.
    """
    if not text or not text.strip():
        raise ValueError("Unable to extract readable text from this file.")
