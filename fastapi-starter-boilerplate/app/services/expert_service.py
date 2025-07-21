"""
Agricultural Expert Service
Handles CRUD operations for agricultural experts
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.core.mongodb import get_database

logger = logging.getLogger(__name__)

# Collection name
EXPERTS_COLLECTION = "agricultural_experts"

class ExpertService:
    def __init__(self):
        self.db = None
        self._indexes_created = False

    def _get_db(self):
        """Get database connection"""
        if self.db is None:
            self.db = get_database()
        return self.db

    def _format_expert_document(self, expert: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to API response format"""
        if expert and "_id" in expert:
            expert["id"] = str(expert["_id"])
            del expert["_id"]
        return expert

    async def _ensure_indexes(self):
        """Create database indexes for experts collection"""
        if self._indexes_created:
            return

        try:
            db = self._get_db()

            # Create text index for search (using default language settings)
            await db[EXPERTS_COLLECTION].create_index([
                ("name", "text")
            ])

            self._indexes_created = True
            logger.info("Expert collection indexes created successfully")

        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")
            # Don't fail if indexes already exist
    
    async def create_expert(self, expert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new agricultural expert"""
        try:
            # Ensure indexes are created
            await self._ensure_indexes()

            db = self._get_db()

            # Add timestamps
            expert_data["created_at"] = datetime.utcnow()
            expert_data["updated_at"] = datetime.utcnow()
            
            # Insert expert
            result = await db[EXPERTS_COLLECTION].insert_one(expert_data)
            
            # Retrieve and return the created expert
            expert = await db[EXPERTS_COLLECTION].find_one({"_id": result.inserted_id})
            expert = self._format_expert_document(expert)

            logger.info(f"Created expert: {expert['name']} with ID: {expert['id']}")
            return expert
            
        except DuplicateKeyError as e:
            logger.error(f"Duplicate expert data: {e}")
            raise ValueError("Expert with this email or phone already exists")
        except Exception as e:
            logger.error(f"Error creating expert: {e}")
            raise
    
    async def get_expert_by_id(self, expert_id: str) -> Optional[Dict[str, Any]]:
        """Get expert by ID"""
        try:
            db = self._get_db()
            expert = await db[EXPERTS_COLLECTION].find_one({"_id": ObjectId(expert_id)})
            
            if expert:
                return self._format_expert_document(expert)
            return None
            
        except Exception as e:
            logger.error(f"Error getting expert by ID {expert_id}: {e}")
            return None
    
    async def get_experts(
        self,
        page: int = 1,
        per_page: int = 10
    ) -> Dict[str, Any]:
        """Get paginated list of experts"""
        try:
            db = self._get_db()

            # Calculate skip value
            skip = (page - 1) * per_page

            # Get total count
            total = await db[EXPERTS_COLLECTION].count_documents({})

            # Get experts with pagination
            cursor = db[EXPERTS_COLLECTION].find({}).skip(skip).limit(per_page).sort("name", 1)
            experts = await cursor.to_list(length=per_page)
            
            # Convert ObjectId to string and format documents
            formatted_experts = [self._format_expert_document(expert) for expert in experts]

            return {
                "experts": formatted_experts,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"Error getting experts: {e}")
            raise
    
    async def update_expert(self, expert_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update expert information"""
        try:
            db = self._get_db()
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            # Update expert
            result = await db[EXPERTS_COLLECTION].update_one(
                {"_id": ObjectId(expert_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Return updated expert
                expert = await self.get_expert_by_id(expert_id)
                logger.info(f"Updated expert: {expert_id}")
                return expert
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating expert {expert_id}: {e}")
            raise
    
    async def delete_expert(self, expert_id: str) -> bool:
        """Delete expert (soft delete by setting is_active to False)"""
        try:
            db = self._get_db()
            
            result = await db[EXPERTS_COLLECTION].update_one(
                {"_id": ObjectId(expert_id)},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Soft deleted expert: {expert_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting expert {expert_id}: {e}")
            return False
    
    async def hard_delete_expert(self, expert_id: str) -> bool:
        """Permanently delete expert from database"""
        try:
            db = self._get_db()
            
            result = await db[EXPERTS_COLLECTION].delete_one({"_id": ObjectId(expert_id)})
            
            if result.deleted_count > 0:
                logger.info(f"Hard deleted expert: {expert_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error hard deleting expert {expert_id}: {e}")
            return False
    
    async def search_experts(self, query: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Search experts by name or language"""
        try:
            db = self._get_db()

            # Build search query
            search_query = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"language": {"$regex": query, "$options": "i"}}
                ]
            }

            # Calculate skip value
            skip = (page - 1) * per_page

            # Get total count
            total = await db[EXPERTS_COLLECTION].count_documents(search_query)

            # Get experts with pagination
            cursor = db[EXPERTS_COLLECTION].find(search_query).skip(skip).limit(per_page).sort("experience", -1)
            experts = await cursor.to_list(length=per_page)
            
            # Convert ObjectId to string and format documents
            formatted_experts = [self._format_expert_document(expert) for expert in experts]

            return {
                "experts": formatted_experts,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page,
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Error searching experts with query '{query}': {e}")
            raise

# Create service instance
expert_service = ExpertService()
