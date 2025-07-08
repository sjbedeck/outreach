from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging

from app.models.database import get_db
from app.models.schemas import CampaignCreate, CampaignResponse
from app.services.campaign_service import CampaignService
from app.core.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[CampaignResponse])
async def get_campaigns(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all campaigns for the current user"""
    try:
        campaign_service = CampaignService(db)
        campaigns = await campaign_service.get_user_campaigns(current_user["user_id"])
        return campaigns
    except Exception as e:
        logger.error(f"Error fetching campaigns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaigns")

@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    campaign_data: CampaignCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new campaign"""
    try:
        campaign_service = CampaignService(db)
        campaign = await campaign_service.create_campaign(
            current_user["user_id"],
            campaign_data
        )
        
        # Start campaign execution in background
        background_tasks.add_task(
            campaign_service.execute_campaign,
            campaign.id
        )
        
        return campaign
    except Exception as e:
        logger.error(f"Error creating campaign: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create campaign")

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific campaign by ID"""
    try:
        campaign_service = CampaignService(db)
        campaign = await campaign_service.get_campaign(campaign_id, current_user["user_id"])
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return campaign
    except Exception as e:
        logger.error(f"Error fetching campaign: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch campaign")

@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Start or resume a campaign"""
    try:
        campaign_service = CampaignService(db)
        
        # Update campaign status
        await campaign_service.update_campaign_status(
            campaign_id,
            current_user["user_id"],
            "active"
        )
        
        # Execute campaign in background
        background_tasks.add_task(
            campaign_service.execute_campaign,
            campaign_id
        )
        
        return {"message": "Campaign started successfully"}
    except Exception as e:
        logger.error(f"Error starting campaign: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start campaign")

@router.post("/{campaign_id}/pause")
async def pause_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pause a campaign"""
    try:
        campaign_service = CampaignService(db)
        await campaign_service.update_campaign_status(
            campaign_id,
            current_user["user_id"],
            "paused"
        )
        return {"message": "Campaign paused successfully"}
    except Exception as e:
        logger.error(f"Error pausing campaign: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to pause campaign")

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a campaign"""
    try:
        campaign_service = CampaignService(db)
        await campaign_service.delete_campaign(campaign_id, current_user["user_id"])
        return {"message": "Campaign deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting campaign: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete campaign")