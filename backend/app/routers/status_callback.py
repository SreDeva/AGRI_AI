from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse
import logging
from typing import Dict, Any
from datetime import datetime

# Import our services
from app.services.twilio_service import twilio_service
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create the router - fixing the typo in variable name
status_callback_module = APIRouter(prefix="/webhook", tags=["Webhook"])

# Store message status for monitoring (in production, use database)
message_status_cache = {}

@status_callback_module.post("/status_callback")
async def message_status_callback(request: Request):
    """
    Handle Twilio message status callbacks
    
    This endpoint receives delivery status updates for sent messages:
    - queued: Message has been queued for delivery
    - sent: Message has been sent to carrier
    - delivered: Message was successfully delivered
    - failed: Message delivery failed
    - undelivered: Message could not be delivered
    """
    try:
        form = await request.form()
        callback_data = dict(form)
        
        logger.info(f"Received status callback: {callback_data}")
        
        # Extract important fields
        message_sid = callback_data.get("MessageSid")
        message_status = callback_data.get("MessageStatus")
        to_number = callback_data.get("To", "").replace("whatsapp:", "")
        from_number = callback_data.get("From", "")
        error_code = callback_data.get("ErrorCode")
        error_message = callback_data.get("ErrorMessage")
        
        if not message_sid:
            logger.warning("Received status callback without MessageSid")
            return PlainTextResponse("OK")
        
        # Create status record
        status_record = {
            "message_sid": message_sid,
            "status": message_status,
            "to_number": to_number,
            "from_number": from_number,
            "timestamp": datetime.now().isoformat(),
            "error_code": error_code,
            "error_message": error_message,
            "raw_data": callback_data
        }
        
        # Store in cache (in production, store in database)
        message_status_cache[message_sid] = status_record
        
        # Log different statuses appropriately
        if message_status == "delivered":
            logger.info(f"Message {message_sid} delivered successfully to {to_number}")
        elif message_status == "failed" or message_status == "undelivered":
            logger.error(f"Message {message_sid} failed to deliver to {to_number}. "
                        f"Error: {error_code} - {error_message}")
        elif message_status == "sent":
            logger.info(f"Message {message_sid} sent to carrier for {to_number}")
        elif message_status == "queued":
            logger.info(f"Message {message_sid} queued for delivery to {to_number}")
        else:
            logger.info(f"Message {message_sid} status update: {message_status}")
        
        # Handle failed messages - could implement retry logic here
        if message_status in ["failed", "undelivered"] and error_code:
            await handle_message_failure(message_sid, to_number, error_code, error_message)
        
        # Clean up old status records (keep only last 1000)
        if len(message_status_cache) > 1000:
            # Remove oldest 100 records
            oldest_keys = list(message_status_cache.keys())[:100]
            for key in oldest_keys:
                del message_status_cache[key]
        
        return PlainTextResponse("OK")
        
    except Exception as e:
        logger.error(f"Error processing status callback: {e}")
        # Still return OK to Twilio to prevent retries
        return PlainTextResponse("OK")

async def handle_message_failure(message_sid: str, to_number: str, error_code: str, error_message: str):
    """Handle failed message delivery"""
    try:
        logger.warning(f"Handling message failure for {message_sid} to {to_number}")
        
        # Common error codes and their meanings:
        # 30001: Queue overflow
        # 30003: Unreachable destination handset
        # 30004: Message blocked
        # 30005: Unknown destination handset
        # 30006: Landline or unreachable carrier
        # 30007: Message filtered
        # 30008: Unknown error
        
        # Could implement specific handling based on error codes
        if error_code == "30003":
            logger.info(f"Phone {to_number} unreachable - marking for retry later")
        elif error_code == "30004":
            logger.info(f"Message blocked for {to_number} - user may have opted out")
        elif error_code == "30005":
            logger.info(f"Unknown number {to_number} - may be invalid")
        
        # In production, you might:
        # - Update user preferences in database
        # - Queue for retry with exponential backoff
        # - Send notification to admin
        # - Update user's contact status
        
    except Exception as e:
        logger.error(f"Error handling message failure: {e}")

@status_callback_module.get("/status/{message_sid}")
async def get_message_status(message_sid: str):
    """Get the delivery status of a specific message"""
    try:
        if message_sid in message_status_cache:
            return {
                "success": True,
                "message_sid": message_sid,
                "status_info": message_status_cache[message_sid]
            }
        else:
            return {
                "success": False,
                "message_sid": message_sid,
                "error": "Message status not found"
            }
    except Exception as e:
        logger.error(f"Error retrieving message status: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving message status")

@status_callback_module.get("/status/user/{phone_number}")
async def get_user_message_history(phone_number: str, limit: int = 10):
    """Get recent message delivery status for a user"""
    try:
        # Clean phone number
        clean_number = phone_number.replace("whatsapp:", "").replace("+", "")
        
        # Find messages for this user
        user_messages = []
        for sid, record in message_status_cache.items():
            record_number = record.get("to_number", "").replace("+", "")
            if record_number == clean_number:
                user_messages.append(record)
        
        # Sort by timestamp (newest first) and limit
        user_messages.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        user_messages = user_messages[:limit]
        
        return {
            "success": True,
            "phone_number": phone_number,
            "message_count": len(user_messages),
            "messages": user_messages
        }
        
    except Exception as e:
        logger.error(f"Error retrieving user message history: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving message history")

@status_callback_module.get("/health")
async def webhook_health_check():
    """Health check endpoint for webhook service"""
    return {
        "status": "healthy",
        "service": "webhook_status_callback",
        "timestamp": datetime.now().isoformat(),
        "cached_statuses": len(message_status_cache)
    }
