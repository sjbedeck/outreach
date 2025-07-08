from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.models.database import get_db
from app.models.schemas import ApiKeyUpdate, EmailSettings
from app.services.settings_service import SettingsService
from app.core.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api-keys")
async def get_api_keys(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's API keys (masked)"""
    try:
        settings_service = SettingsService(db)
        api_keys = await settings_service.get_user_api_keys(current_user["user_id"])
        return api_keys
    except Exception as e:
        logger.error(f"Error fetching API keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch API keys")

@router.put("/api-keys")
async def update_api_keys(
    api_keys: ApiKeyUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user's API keys"""
    try:
        settings_service = SettingsService(db)
        await settings_service.update_user_api_keys(current_user["user_id"], api_keys)
        return {"message": "API keys updated successfully"}
    except Exception as e:
        logger.error(f"Error updating API keys: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update API keys")

@router.get("/email")
async def get_email_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's email settings"""
    try:
        settings_service = SettingsService(db)
        settings = await settings_service.get_user_email_settings(current_user["user_id"])
        return settings
    except Exception as e:
        logger.error(f"Error fetching email settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch email settings")

@router.put("/email")
async def update_email_settings(
    settings: EmailSettings,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user's email settings"""
    try:
        settings_service = SettingsService(db)
        await settings_service.update_user_email_settings(current_user["user_id"], settings)
        return {"message": "Email settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating email settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update email settings")

@router.post("/test-connection/{service}")
async def test_service_connection(
    service: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Test connection to external service"""
    try:
        settings_service = SettingsService(db)
        result = await settings_service.test_service_connection(
            current_user["user_id"], 
            service
        )
        return result
    except Exception as e:
        logger.error(f"Error testing service connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to test service connection")