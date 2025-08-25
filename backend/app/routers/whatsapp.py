from fastapi import APIRouter, Request, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from typing import Optional, Dict, Any
import os
import logging
import tempfile
import requests
from pathlib import Path
from datetime import datetime

# Import our services and models
from app.services.twilio_service import twilio_service
from app.models.whisper_model import WhisperSTT
from app.models.language_detector import AGRILanguageDetector
from app.models.indictrans import IndicTrans2Translator
from app.models.coqui_tts import CoquiTTS
from app.models.llm_ollama import HybridLLM
from app.services.plant_disease_rag import PlantDiseaseRAG
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create the router
whatsapp_module = APIRouter()

# Initialize AI models (same as in ai.py)
whisper_stt = None
language_detector = None
translator = None
tts_engine = None
llm_model = None
plant_disease_rag = None

def initialize_whatsapp_models():
    """Initialize AI models for WhatsApp processing"""
    global whisper_stt, language_detector, translator, tts_engine, llm_model, plant_disease_rag
    try:
        logger.info("Initializing WhatsApp AI models...")
        whisper_stt = WhisperSTT()
        language_detector = AGRILanguageDetector()
        translator = IndicTrans2Translator()
        tts_engine = CoquiTTS()
        llm_model = HybridLLM(
            gemini_api_key=os.getenv('GEMINI_API_KEY'),
            ollama_base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
            ollama_model=os.getenv('OLLAMA_MODEL', 'llama3:8b'),
            prefer_gemini=True
        )
        
        # Initialize Plant Disease RAG service
        try:
            plant_disease_rag = PlantDiseaseRAG(initialize_llm=False)  # Use our existing LLM
            plant_disease_rag.llm_model = llm_model
        except Exception as rag_error:
            logger.warning(f"Plant Disease RAG not available: {rag_error}")
            plant_disease_rag = None
        
        logger.info("WhatsApp AI models initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize WhatsApp AI models: {e}")
        raise

# Initialize models at startup
try:
    initialize_whatsapp_models()
except Exception as e:
    logger.warning(f"Failed to initialize WhatsApp models at startup: {e}")

# Store user conversation state
user_states = {}

async def send_whatsapp_message(to: str, message: str) -> Dict[str, Any]:
    """Send WhatsApp message using our Twilio service"""
    try:
        # Remove 'whatsapp:' prefix if present
        phone_number = to.replace("whatsapp:", "")
        if not phone_number.startswith("+"):
            phone_number = f"whatsapp:{phone_number}"
        
        # Use our Twilio service to send message
        result = await twilio_service.send_welcome_message(phone_number, message)
        logger.info(f"Sent WhatsApp message to {to}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        return {"success": False, "error": str(e)}

async def send_whatsapp_audio(to: str, audio_url: str, caption: str = None) -> Dict[str, Any]:
    """Send audio file via WhatsApp - placeholder for future implementation"""
    # This would need to be implemented in twilio_service.py
    logger.info(f"Audio sending not yet implemented. Would send {audio_url} to {to}")
    return {"success": False, "error": "Audio sending not implemented"}

async def download_media_file(media_url: str, auth: tuple) -> str:
    """Download media file from Twilio and return local path"""
    try:
        response = requests.get(media_url, auth=auth)
        response.raise_for_status()
        
        # Create temporary file
        suffix = '.jpg' if 'image' in response.headers.get('content-type', '') else '.wav'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(response.content)
            return temp_file.name
    except Exception as e:
        logger.error(f"Error downloading media file: {e}")
        raise

async def handle_text_message(text: str, user_id: str) -> str:
    """Process text message using our AI models"""
    try:
        # Ensure models are initialized
        if not all([language_detector, llm_model]):
            return "AI services are currently unavailable. Please try again later."
        
        # Detect language
        lang_result = language_detector.detect_language(text, agricultural_context=True)
        detected_language = lang_result.get('language', 'en')
        
        # Translate to English if needed for LLM processing
        query_text = text
        if detected_language != 'en' and translator:
            translation_result = translator.translate(text, detected_language, 'en')
            if not translation_result.get('error'):
                query_text = translation_result['translated_text']
        
        # Get LLM response
        llm_response = llm_model.chat(
            query_text,
            context={"domain": "agriculture", "channel": "whatsapp"},
            user_id=user_id
        )
        
        if llm_response.get('error'):
            return "I'm having trouble processing your request. Please try again."
        
        response_text = llm_response['response']
        
        # Translate back to original language if needed
        if detected_language != 'en' and translator:
            translation_result = translator.translate(response_text, 'en', detected_language)
            if not translation_result.get('error'):
                response_text = translation_result['translated_text']
        
        return response_text
        
    except Exception as e:
        logger.error(f"Error handling text message: {e}")
        return "I'm having trouble understanding your message. Please try again."

async def handle_audio_message(media_url: str, auth: tuple, user_id: str) -> str:
    """Process audio message using our Whisper model"""
    try:
        if not whisper_stt:
            return "Audio processing is currently unavailable. Please send a text message instead."
        
        # Download audio file
        audio_path = await download_media_file(media_url, auth)
        
        try:
            # Transcribe audio
            transcription_result = whisper_stt.transcribe_audio(audio_path)
            
            if not transcription_result.get('success'):
                return "I couldn't understand your voice message. Please try speaking clearly or send a text message."
            
            transcribed_text = transcription_result['text']
            logger.info(f"Transcribed audio: {transcribed_text}")
            
            # Process the transcribed text
            return await handle_text_message(transcribed_text, user_id)
            
        finally:
            # Clean up temporary file
            if os.path.exists(audio_path):
                os.unlink(audio_path)
                
    except Exception as e:
        logger.error(f"Error handling audio message: {e}")
        return "I had trouble processing your voice message. Please try again or send a text message."

async def handle_image_message(media_url: str, auth: tuple, user_id: str, text_context: str = None) -> str:
    """Process image message using our plant disease detection"""
    try:
        if not plant_disease_rag:
            return "Plant disease detection is currently unavailable. Please try again later."
        
        # Download image file
        image_path = await download_media_file(media_url, auth)
        
        try:
            # Analyze plant disease
            diagnosis_result = plant_disease_rag.diagnose_plant_disease(
                image_path=image_path,
                crop_type=None,
                symptoms=text_context,
                location=None
            )
            
            if not diagnosis_result.get('success'):
                return "I couldn't analyze your plant image. Please make sure the image is clear and shows the plant clearly."
            
            # Format response
            response = f"🌱 Plant Analysis Results:\n\n"
            response += f"**Diagnosis:** {diagnosis_result['primary_diagnosis']}\n"
            response += f"**Confidence:** {diagnosis_result['confidence']}\n"
            
            if diagnosis_result.get('is_healthy'):
                response += "✅ Your plant appears to be healthy!\n"
            else:
                response += "⚠️ Issue detected - please see recommendations below.\n"
            
            if diagnosis_result.get('recommendations'):
                response += f"\n**Recommendations:**\n"
                for i, rec in enumerate(diagnosis_result['recommendations'][:3], 1):
                    response += f"{i}. {rec}\n"
            
            if diagnosis_result.get('urgency'):
                response += f"\n**Urgency Level:** {diagnosis_result['urgency']}"
            
            return response
            
        finally:
            # Clean up temporary file
            if os.path.exists(image_path):
                os.unlink(image_path)
                
    except Exception as e:
        logger.error(f"Error handling image message: {e}")
        return "I had trouble analyzing your plant image. Please try again with a clear photo of the affected plant."

async def handle_location_message(latitude: float, longitude: float, user_id: str) -> str:
    """Handle location sharing for weather services"""
    try:
        # This would integrate with your weather service
        # For now, return a placeholder response
        return f"📍 Thank you for sharing your location ({latitude:.4f}, {longitude:.4f}). Weather-based farming advice will be available soon!"
    except Exception as e:
        logger.error(f"Error handling location: {e}")
        return "I received your location but couldn't process it right now. Please try again later."


# POST endpoint to receive incoming WhatsApp messages
@whatsapp_module.post("/incoming")
async def read_incoming_message(request: Request):
    """Handle incoming WhatsApp messages using our AI services"""
    try:
        form = await request.form()
        from_number = form.get("From", "").replace("whatsapp:", "")
        body = form.get("Body", "")
        num_media = int(form.get("NumMedia", 0))
        location_latitude = form.get("Latitude")
        location_longitude = form.get("Longitude")

        logger.info(f"Incoming WhatsApp message from {from_number}: {dict(form)}")

        # Initialize user state if not exists
        if from_number not in user_states:
            user_states[from_number] = {
                "awaiting_weather_response": False, 
                "last_language": "en",
                "conversation_history": []
            }

        user_state = user_states[from_number]
        reply = ""

        # Handle location sharing
        if location_latitude and location_longitude:
            try:
                lat = float(location_latitude)
                lng = float(location_longitude)
                reply = await handle_location_message(lat, lng, from_number)
                user_state["awaiting_weather_response"] = False
            except (ValueError, TypeError):
                reply = "I received your location but couldn't process it. Please try again."
        
        # Handle media messages
        elif num_media > 0:
            media_url = form.get("MediaUrl0")
            media_type = form.get("MediaContentType0", "")
            
            # Get Twilio auth from settings
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            if "image" in media_type:
                # Handle plant disease image analysis
                reply = await handle_image_message(media_url, auth, from_number, body)

            elif "audio" in media_type:
                # Handle voice message transcription and processing
                reply = await handle_audio_message(media_url, auth, from_number)
                
                # If there's also text, combine the responses
                if body and body.strip():
                    text_reply = await handle_text_message(body, from_number)
                    reply = f"{reply}\n\nRegarding your text: {text_reply}"
            else:
                reply = "I received your file, but I can only process images and audio messages right now."

        # Handle text messages
        elif body:
            reply = await handle_text_message(body, from_number)
            
            # Store in conversation history
            user_state["conversation_history"].append({
                "user": body,
                "assistant": reply,
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep only last 10 exchanges
            if len(user_state["conversation_history"]) > 10:
                user_state["conversation_history"] = user_state["conversation_history"][-10:]

        else:
            reply = "Hello! I'm your AI farming assistant. You can:\n• Send text questions about farming\n• Share plant photos for disease detection\n• Send voice messages\n• Share your location for weather advice\n\nHow can I help you today?"

        # Send the reply
        if reply:
            result = await send_whatsapp_message(from_number, reply)
            if result.get("success"):
                logger.info(f"Successfully sent reply to {from_number}")
            else:
                logger.error(f"Failed to send reply to {from_number}: {result.get('error')}")

        return PlainTextResponse("OK")

    except Exception as e:
        logger.error(f"Error processing WhatsApp message: {e}")
        # Try to send error message to user
        try:
            await send_whatsapp_message(from_number if 'from_number' in locals() else "unknown", 
                                      "I'm experiencing technical difficulties. Please try again in a few moments.")
        except:
            pass
        return PlainTextResponse("ERROR")

@whatsapp_module.get("/health")
async def whatsapp_health_check():
    """Health check endpoint for WhatsApp service"""
    try:
        # Check if AI models are initialized
        models_status = {
            "whisper_stt": whisper_stt is not None,
            "language_detector": language_detector is not None,
            "translator": translator is not None,
            "tts_engine": tts_engine is not None,
            "llm_model": llm_model is not None,
            "plant_disease_rag": plant_disease_rag is not None
        }
        
        # Check Twilio configuration
        twilio_configured = all([
            settings.TWILIO_ACCOUNT_SID,
            settings.TWILIO_AUTH_TOKEN,
            settings.TWILIO_PHONE_NUMBER
        ])
        
        all_healthy = all(models_status.values()) and twilio_configured
        
        return {
            "status": "healthy" if all_healthy else "degraded",
            "service": "whatsapp_ai_assistant",
            "timestamp": datetime.now().isoformat(),
            "models": models_status,
            "twilio_configured": twilio_configured,
            "active_conversations": len(user_states)
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "whatsapp_ai_assistant",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@whatsapp_module.get("/test-config")
async def test_whatsapp_configuration():
    """Test endpoint to verify WhatsApp service configuration"""
    try:
        # Check if Twilio service has a test method
        try:
            if hasattr(twilio_service, 'test_configuration'):
                test_result = await twilio_service.test_configuration()
            else:
                # Basic configuration check
                test_result = {
                    "success": all([
                        settings.TWILIO_ACCOUNT_SID,
                        settings.TWILIO_AUTH_TOKEN,
                        settings.TWILIO_PHONE_NUMBER
                    ]),
                    "error": None if all([
                        settings.TWILIO_ACCOUNT_SID,
                        settings.TWILIO_AUTH_TOKEN,
                        settings.TWILIO_PHONE_NUMBER
                    ]) else "Missing Twilio configuration"
                }
        except Exception as twilio_error:
            test_result = {
                "success": False,
                "error": f"Twilio test failed: {str(twilio_error)}"
            }
        
        return {
            "success": True,
            "twilio_configured": test_result.get("success", False),
            "models_status": {
                "whisper_stt": whisper_stt is not None,
                "language_detector": language_detector is not None,
                "translator": translator is not None,
                "tts_engine": tts_engine is not None,
                "llm_model": llm_model is not None,
                "plant_disease_rag": plant_disease_rag is not None
            },
            "configuration_details": {
                "twilio_account_sid": "✓ Set" if settings.TWILIO_ACCOUNT_SID else "✗ Missing",
                "twilio_auth_token": "✓ Set" if settings.TWILIO_AUTH_TOKEN else "✗ Missing",
                "twilio_phone_number": "✓ Set" if settings.TWILIO_PHONE_NUMBER else "✗ Missing"
            },
            "error": test_result.get("error")
        }
    except Exception as e:
        logger.error(f"Error testing configuration: {e}")
        return {
            "success": False,
            "error": str(e)
        }
