import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import hashlib
import json

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.client = None
        self.collection = None
        self.embedding_model = None
        self._initialized = False
        
    def _initialize(self):
        """Initialize ChromaDB client and collection"""
        if self._initialized:
            return
            
        try:
            # Initialize ChromaDB client
            chroma_db_path = os.getenv("CHROMA_DB_PATH", "./chroma_db")
            self.client = chromadb.PersistentClient(
                path=chroma_db_path,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection for WhatsApp chats
            self.collection = self.client.get_or_create_collection(
                name="whatsapp_chats",
                metadata={"description": "WhatsApp chat conversations for RAG"}
            )
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            self._initialized = True
            logger.info("RAG Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG Service: {e}")
            raise
    
    def _generate_document_id(self, phone_number: str, message: str, timestamp: datetime) -> str:
        """Generate unique document ID for a chat message"""
        content = f"{phone_number}_{message}_{timestamp.isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def store_chat_message(
        self, 
        phone_number: str, 
        user_message: str, 
        ai_response: str,
        message_type: str = "text",
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store a chat conversation in ChromaDB
        
        Args:
            phone_number: User's phone number
            user_message: User's input message
            ai_response: AI's response
            message_type: Type of message (text, audio, image)
            metadata: Additional metadata
        """
        try:
            self._initialize()
            
            timestamp = datetime.utcnow()
            
            # Create conversation document
            conversation = {
                "user_message": user_message,
                "ai_response": ai_response,
                "phone_number": phone_number,
                "timestamp": timestamp.isoformat(),
                "message_type": message_type
            }
            
            # Add metadata if provided
            if metadata:
                conversation.update(metadata)
            
            # Generate embeddings for both user message and AI response
            combined_text = f"User: {user_message}\nAI: {ai_response}"
            
            # Generate unique ID
            doc_id = self._generate_document_id(phone_number, user_message, timestamp)
            
            # Store in ChromaDB
            self.collection.add(
                documents=[combined_text],
                metadatas=[conversation],
                ids=[doc_id]
            )
            
            logger.info(f"Stored chat message for {phone_number}: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store chat message: {e}")
            return False
    
    async def search_similar_conversations(
        self, 
        query: str, 
        phone_number: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar conversations using vector similarity
        
        Args:
            query: Search query
            phone_number: Optional filter by phone number
            limit: Maximum number of results
        """
        try:
            self._initialize()
            
            # Build where clause for filtering
            where_clause = {}
            if phone_number:
                where_clause["phone_number"] = phone_number
            
            # Search for similar conversations
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where=where_clause if where_clause else None
            )
            
            # Format results
            conversations = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i]
                    distance = results['distances'][0][i] if results['distances'] else None
                    
                    conversations.append({
                        "conversation": doc,
                        "metadata": metadata,
                        "similarity_score": 1 - distance if distance else None,
                        "user_message": metadata.get("user_message"),
                        "ai_response": metadata.get("ai_response"),
                        "timestamp": metadata.get("timestamp"),
                        "message_type": metadata.get("message_type")
                    })
            
            logger.info(f"Found {len(conversations)} similar conversations for query: {query}")
            return conversations
            
        except Exception as e:
            logger.error(f"Failed to search conversations: {e}")
            return []
    
    async def get_user_chat_history(
        self, 
        phone_number: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent chat history for a specific user
        
        Args:
            phone_number: User's phone number
            limit: Maximum number of messages
        """
        try:
            self._initialize()
            
            # Get all messages for the user
            results = self.collection.get(
                where={"phone_number": phone_number},
                limit=limit
            )
            
            # Sort by timestamp (most recent first)
            conversations = []
            if results['metadatas']:
                for i, metadata in enumerate(results['metadatas']):
                    conversations.append({
                        "conversation": results['documents'][i] if results['documents'] else "",
                        "metadata": metadata,
                        "user_message": metadata.get("user_message"),
                        "ai_response": metadata.get("ai_response"),
                        "timestamp": metadata.get("timestamp"),
                        "message_type": metadata.get("message_type")
                    })
                
                # Sort by timestamp
                conversations.sort(
                    key=lambda x: x['timestamp'], 
                    reverse=True
                )
            
            logger.info(f"Retrieved {len(conversations)} chat messages for {phone_number}")
            return conversations
            
        except Exception as e:
            logger.error(f"Failed to get chat history: {e}")
            return []
    
    async def get_conversation_context(
        self, 
        phone_number: str, 
        current_query: str,
        context_limit: int = 3
    ) -> str:
        """
        Get relevant conversation context for improving AI responses
        
        Args:
            phone_number: User's phone number
            current_query: Current user query
            context_limit: Number of similar conversations to include
        """
        try:
            # Search for similar conversations
            similar_conversations = await self.search_similar_conversations(
                query=current_query,
                phone_number=phone_number,
                limit=context_limit
            )
            
            if not similar_conversations:
                return ""
            
            # Build context string
            context_parts = []
            context_parts.append("Previous relevant conversations:")
            
            for i, conv in enumerate(similar_conversations, 1):
                context_parts.append(f"\n{i}. User: {conv['user_message']}")
                context_parts.append(f"   AI: {conv['ai_response']}")
                context_parts.append(f"   (Similarity: {conv['similarity_score']:.2f})")
            
            context = "\n".join(context_parts)
            logger.info(f"Generated context with {len(similar_conversations)} conversations")
            return context
            
        except Exception as e:
            logger.error(f"Failed to get conversation context: {e}")
            return ""
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the stored conversations"""
        try:
            self._initialize()
            
            # Get collection count
            count = self.collection.count()
            
            # Get all metadata to analyze
            all_data = self.collection.get()
            
            # Analyze metadata
            phone_numbers = set()
            message_types = {}
            
            if all_data['metadatas']:
                for metadata in all_data['metadatas']:
                    phone_numbers.add(metadata.get('phone_number', 'unknown'))
                    msg_type = metadata.get('message_type', 'unknown')
                    message_types[msg_type] = message_types.get(msg_type, 0) + 1
            
            stats = {
                "total_conversations": count,
                "unique_users": len(phone_numbers),
                "message_types": message_types,
                "collection_name": self.collection.name
            }
            
            logger.info(f"Collection stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {}

    async def get_conversation_context(
        self,
        phone_number: str,
        current_query: str,
        context_limit: int = 3
    ) -> str:
        """
        Get relevant conversation context for improving AI responses

        Args:
            phone_number: User's phone number
            current_query: Current user query
            context_limit: Number of similar conversations to include
        """
        try:
            # Search for similar conversations
            similar_conversations = await self.search_similar_conversations(
                query=current_query,
                phone_number=phone_number,
                limit=context_limit
            )

            if not similar_conversations:
                return ""

            # Build context string
            context_parts = []
            context_parts.append("Previous relevant conversations:")

            for i, conv in enumerate(similar_conversations, 1):
                context_parts.append(f"\n{i}. User: {conv['user_message']}")
                context_parts.append(f"   AI: {conv['ai_response']}")
                context_parts.append(f"   (Similarity: {conv['similarity_score']:.2f})")

            context = "\n".join(context_parts)
            logger.info(f"Generated context with {len(similar_conversations)} conversations")
            return context

        except Exception as e:
            logger.error(f"Failed to get conversation context: {e}")
            return ""

    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the stored conversations"""
        try:
            self._initialize()

            # Get collection count
            count = self.collection.count()

            # Get all metadata to analyze
            all_data = self.collection.get()

            # Analyze metadata
            phone_numbers = set()
            message_types = {}

            if all_data['metadatas']:
                for metadata in all_data['metadatas']:
                    phone_numbers.add(metadata.get('phone_number', 'unknown'))
                    msg_type = metadata.get('message_type', 'unknown')
                    message_types[msg_type] = message_types.get(msg_type, 0) + 1

            stats = {
                "total_conversations": count,
                "unique_users": len(phone_numbers),
                "message_types": message_types,
                "collection_name": self.collection.name
            }

            logger.info(f"Collection stats: {stats}")
            return stats

        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {}

# Create service instance
rag_service = RAGService()
