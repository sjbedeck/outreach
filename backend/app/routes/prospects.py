from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging

from app.models.database import get_db
from app.models.schemas import (
    ProspectBase, ProspectCreate, ProspectUpdate, 
    EmailGenerationRequest, EmailSendRequest
)
from app.services.prospect_service import ProspectService
from app.services.email_generation_service import EmailGenerationService
from app.services.email_sending_service import EmailSendingService
from app.core.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[ProspectBase])
async def get_prospects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all prospects for the current user"""
    try:
        prospect_service = ProspectService(db)
        prospects = await prospect_service.get_user_prospects(current_user["user_id"])
        return prospects
    except Exception as e:
        logger.error(f"Error fetching prospects: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prospects")

@router.post("/import", response_model=List[ProspectBase])
async def import_companies(
    import_data: ProspectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Import companies from CSV data"""
    try:
        prospect_service = ProspectService(db)
        prospects = await prospect_service.import_companies(
            current_user["user_id"], 
            import_data.csv_data
        )
        
        # Start background processing for each prospect
        for prospect in prospects:
            background_tasks.add_task(
                prospect_service.process_prospect_background,
                prospect.id
            )
        
        return prospects
    except Exception as e:
        logger.error(f"Error importing companies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to import companies")

@router.get("/{prospect_id}", response_model=ProspectBase)
async def get_prospect(
    prospect_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific prospect by ID"""
    try:
        prospect_service = ProspectService(db)
        prospect = await prospect_service.get_prospect(prospect_id, current_user["user_id"])
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")
        return prospect
    except Exception as e:
        logger.error(f"Error fetching prospect: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prospect")

@router.patch("/{prospect_id}/status")
async def update_prospect_status(
    prospect_id: str,
    update_data: ProspectUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update prospect status"""
    try:
        prospect_service = ProspectService(db)
        await prospect_service.update_prospect_status(
            prospect_id, 
            current_user["user_id"], 
            update_data.status
        )
        return {"message": "Prospect status updated successfully"}
    except Exception as e:
        logger.error(f"Error updating prospect status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update prospect status")

@router.post("/{prospect_id}/generate-email", response_model=ProspectBase)
async def generate_email(
    prospect_id: str,
    request: EmailGenerationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered email for a prospect"""
    try:
        prospect_service = ProspectService(db)
        email_service = EmailGenerationService()
        
        # Get prospect data
        prospect = await prospect_service.get_prospect(prospect_id, current_user["user_id"])
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")
        
        # Generate email content
        email_content = await email_service.generate_email_content(
            prospect, 
            request.type, 
            request.contact_id
        )
        
        # Update prospect with generated email
        updated_prospect = await prospect_service.update_prospect_email(
            prospect_id,
            current_user["user_id"],
            request.type,
            request.contact_id,
            email_content
        )
        
        return updated_prospect
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate email")

@router.post("/{prospect_id}/send-email")
async def send_email(
    prospect_id: str,
    request: EmailSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send email to prospect"""
    try:
        prospect_service = ProspectService(db)
        email_service = EmailSendingService()
        
        # Get prospect data
        prospect = await prospect_service.get_prospect(prospect_id, current_user["user_id"])
        if not prospect:
            raise HTTPException(status_code=404, detail="Prospect not found")
        
        # Send email in background
        background_tasks.add_task(
            email_service.send_prospect_email,
            prospect,
            request.type,
            request.contact_id,
            request.sender_type,
            current_user["user_id"]
        )
        
        # Update prospect status
        await prospect_service.update_prospect_status(
            prospect_id,
            current_user["user_id"],
            "contacted"
        )
        
        return {"message": "Email sent successfully"}
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.delete("/{prospect_id}")
async def delete_prospect(
    prospect_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a prospect"""
    try:
        prospect_service = ProspectService(db)
        await prospect_service.delete_prospect(prospect_id, current_user["user_id"])
        return {"message": "Prospect deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting prospect: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete prospect")