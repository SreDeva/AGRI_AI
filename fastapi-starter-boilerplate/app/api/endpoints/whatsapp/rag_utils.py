import logging
from typing import Dict, Any, Optional
from app.services.rag_service import rag_service
from app.api.endpoints.whatsapp.utils import query_gemini

logger = logging.getLogger(__name__)

async def handle_text_with_rag(
    text: str, 
    phone_number: str,
    message_type: str = "text",
    additional_metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Enhanced text handling with RAG context
    
    Args:
        text: User's input text
        phone_number: User's phone number
        message_type: Type of message (text, audio, image)
        additional_metadata: Additional metadata to store
    """
    try:
        # Get conversation context from RAG
        context = await rag_service.get_conversation_context(
            phone_number=phone_number,
            current_query=text,
            context_limit=3
        )
        
        # Build enhanced prompt with context
        if context:
            enhanced_prompt = f"""
You are an AI agricultural assistant. Use the following conversation history to provide more personalized and contextual responses.

{context}

Current user question: {text}

Please provide a helpful response that takes into account the conversation history and the user's previous questions. Keep the response practical and relevant to farming.
"""
        else:
            enhanced_prompt = f"""
You are an AI agricultural assistant. Please provide a helpful response to this farming question:

{text}

Keep the response practical and relevant to farming.
"""
        
        # Get AI response
        ai_response = await query_gemini(enhanced_prompt)
        
        # Store the conversation in RAG
        metadata = {
            "enhanced_with_context": bool(context),
            "context_conversations_used": len(context.split('\n')) if context else 0
        }
        
        if additional_metadata:
            metadata.update(additional_metadata)
        
        await rag_service.store_chat_message(
            phone_number=phone_number,
            user_message=text,
            ai_response=ai_response,
            message_type=message_type,
            metadata=metadata
        )
        
        logger.info(f"Processed message with RAG for {phone_number}, context: {bool(context)}")
        return ai_response
        
    except Exception as e:
        logger.error(f"Error in RAG-enhanced text handling: {e}")
        # Fallback to regular processing
        from app.api.endpoints.whatsapp.utils import handle_text
        return await handle_text(text)

async def handle_image_with_rag(
    image_analysis: str,
    user_text: str,
    phone_number: str,
    image_url: str
) -> str:
    """
    Handle image analysis with RAG context
    
    Args:
        image_analysis: Result from image analysis
        user_text: User's accompanying text
        phone_number: User's phone number
        image_url: URL of the image
    """
    try:
        # Combine image analysis with user text
        combined_input = f"Image Analysis: {image_analysis}"
        if user_text and user_text.strip():
            combined_input += f"\nUser Question: {user_text}"
        
        # Get conversation context
        context = await rag_service.get_conversation_context(
            phone_number=phone_number,
            current_query=combined_input,
            context_limit=2
        )
        
        # Build enhanced prompt
        if context:
            enhanced_prompt = f"""
You are an AI agricultural assistant analyzing plant images. Use the conversation history to provide more personalized advice.

{context}

Current image analysis and question:
{combined_input}

Please provide helpful advice based on the image analysis and conversation history. Focus on practical farming solutions.
"""
        else:
            enhanced_prompt = f"""
You are an AI agricultural assistant analyzing plant images.

{combined_input}

Please provide helpful advice based on the image analysis. Focus on practical farming solutions.
"""
        
        # Get AI response
        ai_response = await query_gemini(enhanced_prompt)
        
        # Store in RAG with image metadata
        metadata = {
            "image_url": image_url,
            "image_analysis": image_analysis,
            "enhanced_with_context": bool(context),
            "has_user_text": bool(user_text and user_text.strip())
        }
        
        await rag_service.store_chat_message(
            phone_number=phone_number,
            user_message=combined_input,
            ai_response=ai_response,
            message_type="image",
            metadata=metadata
        )
        
        logger.info(f"Processed image with RAG for {phone_number}")
        return ai_response
        
    except Exception as e:
        logger.error(f"Error in RAG-enhanced image handling: {e}")
        # Fallback to regular processing
        return await query_gemini(f"Image Analysis: {image_analysis}\nUser Question: {user_text}")

async def handle_audio_with_rag(
    transcript: str,
    user_text: str,
    phone_number: str,
    audio_url: str
) -> str:
    """
    Handle audio transcription with RAG context
    
    Args:
        transcript: Transcribed audio text
        user_text: User's accompanying text
        phone_number: User's phone number
        audio_url: URL of the audio file
    """
    try:
        # Combine transcript with user text
        combined_input = f"Voice message: {transcript}"
        if user_text and user_text.strip():
            combined_input += f"\nText message: {user_text}"
        
        # Use RAG-enhanced text handling
        ai_response = await handle_text_with_rag(
            text=combined_input,
            phone_number=phone_number,
            message_type="audio",
            additional_metadata={
                "audio_url": audio_url,
                "transcript": transcript,
                "has_text_message": bool(user_text and user_text.strip())
            }
        )
        
        logger.info(f"Processed audio with RAG for {phone_number}")
        return ai_response
        
    except Exception as e:
        logger.error(f"Error in RAG-enhanced audio handling: {e}")
        # Fallback to regular processing
        from app.api.endpoints.whatsapp.utils import handle_text
        return await handle_text(combined_input)

async def get_user_conversation_summary(phone_number: str, limit: int = 10) -> str:
    """
    Get a summary of user's recent conversations
    
    Args:
        phone_number: User's phone number
        limit: Number of recent conversations to analyze
    """
    try:
        # Get recent chat history
        chat_history = await rag_service.get_user_chat_history(
            phone_number=phone_number,
            limit=limit
        )
        
        if not chat_history:
            return "No previous conversations found."
        
        # Build summary prompt
        conversations_text = []
        for chat in chat_history:
            conversations_text.append(f"User: {chat['user_message']}")
            conversations_text.append(f"AI: {chat['ai_response']}")
            conversations_text.append("---")
        
        summary_prompt = f"""
Analyze these recent conversations and provide a brief summary of the user's main farming interests and questions:

{chr(10).join(conversations_text)}

Provide a concise summary highlighting:
1. Main crops or farming areas of interest
2. Common types of questions asked
3. Any recurring issues or concerns
"""
        
        summary = await query_gemini(summary_prompt)
        logger.info(f"Generated conversation summary for {phone_number}")
        return summary
        
    except Exception as e:
        logger.error(f"Error generating conversation summary: {e}")
        return "Unable to generate conversation summary."

async def search_knowledge_base(query: str, limit: int = 5) -> str:
    """
    Search the knowledge base for relevant information
    
    Args:
        query: Search query
        limit: Maximum number of results
    """
    try:
        # Search across all conversations
        similar_conversations = await rag_service.search_similar_conversations(
            query=query,
            phone_number=None,  # Search across all users
            limit=limit
        )
        
        if not similar_conversations:
            return "No relevant information found in knowledge base."
        
        # Build knowledge base response
        knowledge_parts = []
        knowledge_parts.append("Based on previous conversations, here's what I found:")
        
        for i, conv in enumerate(similar_conversations, 1):
            knowledge_parts.append(f"\n{i}. Question: {conv['user_message']}")
            knowledge_parts.append(f"   Answer: {conv['ai_response']}")
            knowledge_parts.append(f"   (Relevance: {conv['similarity_score']:.2f})")
        
        knowledge = "\n".join(knowledge_parts)
        logger.info(f"Retrieved knowledge base results for query: {query}")
        return knowledge
        
    except Exception as e:
        logger.error(f"Error searching knowledge base: {e}")
        return "Unable to search knowledge base."
