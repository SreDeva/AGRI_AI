"""
Agricultural Experts API Endpoints
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId

from app.models.auth import (
    ExpertCreateRequest,
    ExpertUpdateRequest,
    ExpertResponse,
    ExpertListResponse
)
from app.services.expert_service import expert_service
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/experts", tags=["Agricultural Experts"])

@router.get("/", response_model=ExpertListResponse)
async def get_experts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    Get paginated list of agricultural experts
    Public endpoint - no authentication required
    """
    try:
        result = await expert_service.get_experts(
            page=page,
            per_page=per_page
        )
        
        # Convert to response model
        experts = [ExpertResponse(**expert) for expert in result["experts"]]
        
        return ExpertListResponse(
            experts=experts,
            total=result["total"],
            page=result["page"],
            per_page=result["per_page"],
            total_pages=result["total_pages"]
        )
        
    except Exception as e:
        logger.error(f"Error getting experts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve experts"
        )

@router.get("/search")
async def search_experts(
    q: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    Search agricultural experts by name, specialization, location, or qualification
    Public endpoint - no authentication required
    """
    try:
        result = await expert_service.search_experts(
            query=q,
            page=page,
            per_page=per_page
        )
        
        # Convert to response model
        experts = [ExpertResponse(**expert) for expert in result["experts"]]
        
        return {
            "experts": experts,
            "total": result["total"],
            "page": result["page"],
            "per_page": result["per_page"],
            "total_pages": result["total_pages"],
            "query": result["query"]
        }
        
    except Exception as e:
        logger.error(f"Error searching experts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search experts"
        )

@router.get("/{expert_id}", response_model=ExpertResponse)
async def get_expert(expert_id: str):
    """
    Get specific expert by ID
    Public endpoint - no authentication required
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(expert_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expert ID format"
            )
        
        expert = await expert_service.get_expert_by_id(expert_id)
        
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expert not found"
            )
        
        return ExpertResponse(**expert)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting expert {expert_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve expert"
        )

# Admin endpoints (require authentication and admin role)
@router.post("/", response_model=ExpertResponse)
async def create_expert(
    expert_data: ExpertCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new agricultural expert
    Admin only endpoint
    """
    try:
        # Check if user is admin (phone number 9629321301)
        if current_user.get("phone_number") != "9629321301":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Convert request to dict
        expert_dict = expert_data.dict()

        expert = await expert_service.create_expert(expert_dict)
        
        return ExpertResponse(**expert)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating expert: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create expert"
        )

@router.put("/{expert_id}", response_model=ExpertResponse)
async def update_expert(
    expert_id: str,
    expert_data: ExpertUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update agricultural expert
    Admin only endpoint
    """
    try:
        # Check if user is admin (phone number 9629321301)
        if current_user.get("phone_number") != "9629321301":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Validate ObjectId format
        if not ObjectId.is_valid(expert_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expert ID format"
            )
        
        # Convert request to dict and remove None values
        update_dict = expert_data.dict(exclude_unset=True)
        
        # Convert enum values to strings if present
        if "specialization" in update_dict and update_dict["specialization"]:
            update_dict["specialization"] = [spec.value for spec in expert_data.specialization]
        
        expert = await expert_service.update_expert(expert_id, update_dict)
        
        if not expert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expert not found"
            )
        
        return ExpertResponse(**expert)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expert {expert_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update expert"
        )

@router.delete("/{expert_id}")
async def delete_expert(
    expert_id: str,
    current_user: dict = Depends(get_current_user),
    hard_delete: bool = Query(False, description="Permanently delete expert")
):
    """
    Delete agricultural expert (soft delete by default)
    Admin only endpoint
    """
    try:
        # Check if user is admin (phone number 9629321301)
        if current_user.get("phone_number") != "9629321301":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Validate ObjectId format
        if not ObjectId.is_valid(expert_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid expert ID format"
            )
        
        if hard_delete:
            success = await expert_service.hard_delete_expert(expert_id)
        else:
            success = await expert_service.delete_expert(expert_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expert not found"
            )
        
        return {
            "message": f"Expert {'permanently deleted' if hard_delete else 'deactivated'} successfully",
            "expert_id": expert_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expert {expert_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete expert"
        )
