import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import get_settings

settings = get_settings()

# Initialize Cloudinary only if credentials exist
if settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True
    )

async def upload_file_to_cloudinary(file_content: bytes, filename: str, folder: str = "skillmock/resumes") -> dict:
    """
    Uploads a file (bytes) to Cloudinary.
    Returns a dict with 'secure_url' and 'public_id'.
    If Cloudinary is not configured, returns None.
    """
    if not settings.cloudinary_cloud_name:
        return None
        
    try:
        # We upload raw bytes. We could specify resource_type="auto" or "raw" (for pdfs/txts)
        # Using "auto" lets Cloudinary figure out if it's raw, image, or video.
        # But for PDFs, "image" or "auto" works. Let's use "auto".
        response = cloudinary.uploader.upload(
            file_content, 
            folder=folder,
            resource_type="auto",
            public_id=filename.split('.')[0] if '.' in filename else filename
        )
        return {
            "secure_url": response.get("secure_url"),
            "public_id": response.get("public_id")
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None


async def delete_file_from_cloudinary(public_id: str, resource_type: str = "auto") -> bool:
    """
    Deletes a file from Cloudinary by public_id.
    """
    if not settings.cloudinary_cloud_name or not public_id:
        return False
        
    try:
        # Note: If it was uploaded as raw (e.g. pdf), resource_type might need to be 'raw' or 'image' 
        # auto handles most cases but explicit delete might require knowing the type.
        # Try image first (Cloudinary often treats PDFs as images), then raw.
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image")
        except:
            pass
        try:
            cloudinary.uploader.destroy(public_id, resource_type="raw")
        except:
            pass
        return True
    except Exception as e:
        print(f"Cloudinary delete error: {e}")
        return False
