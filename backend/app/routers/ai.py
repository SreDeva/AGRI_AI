import os
import tempfile
import logging
from typing import Optional, Dict, Any, Union, List
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Import AI models
from app.models.whisper_model import WhisperSTT
from app.models.language_detector import AGRILanguageDetector
from app.models.indictrans import IndicTrans2Translator
from app.models.coqui_tts import CoquiTTS
from app.models.llm_ollama import HybridLLM
from app.services.plant_disease_rag import PlantDiseaseRAG
from app.middleware.auth import get_current_user
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize AI models globally
whisper_stt = None
language_detector = None
translator = None
tts_engine = None
llm_model = None
plant_disease_rag = None

def initialize_ai_models():
    global whisper_stt, language_detector, translator, tts_engine, llm_model, plant_disease_rag
    try:
        logger.info("Initializing AI models...")
        whisper_stt = WhisperSTT()
        language_detector = AGRILanguageDetector()
        translator = IndicTrans2Translator()
        tts_engine = CoquiTTS()
        # Initialize Hybrid LLM with settings
        llm_model = HybridLLM(
            gemini_api_key=os.getenv('GEMINI_API_KEY'),
            ollama_base_url=os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
            ollama_model=os.getenv('OLLAMA_MODEL', 'llama3:8b'),
            prefer_gemini=True  # Prefer Gemini as primary
        )
        
        # Initialize Plant Disease RAG service
        try:
            # Look for index files in the project root
            project_root = os.path.join(os.path.dirname(__file__), "..", "..", "..")
            plant_disease_rag = PlantDiseaseRAG(
                base_dir=project_root,
                faiss_index_path="plant_disease_index.faiss",
                metadata_path="plant_disease_index_metadata.csv"
            )
            if plant_disease_rag.is_service_ready():
                logger.info("Plant Disease RAG service initialized successfully")
            else:
                logger.warning("Plant Disease RAG service initialized but not ready")
        except Exception as rag_error:
            logger.warning(f"Failed to initialize Plant Disease RAG: {rag_error}")
            plant_disease_rag = None
        
        logger.info("All AI models initialized successfully")
        
        # Log model status
        status = llm_model.get_model_status()
        logger.info(f"Active LLM model: {status['active_model']}")
        
    except Exception as e:
        logger.error(f"Failed to initialize AI models: {e}")
        raise

# Pydantic response model
class UnifiedAIResponse(BaseModel):
    success: bool
    request_type: str
    transcribed_text: Optional[str] = None
    detected_language: Optional[str] = None
    response_text: str
    response_language: str
    audio_url: Optional[str] = None
    confidence: Optional[float] = None
    processing_info: Dict[str, Any] = {}

class PlantDiagnosisResponse(BaseModel):
    success: bool
    primary_diagnosis: str
    confidence: str
    crop_type: Optional[str] = None
    condition: Optional[str] = None
    is_healthy: bool
    similar_cases: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    preventive_measures: List[str] = []
    fertilizer_advice: str
    urgency: str
    llm_analysis: str
    processing_info: Dict[str, Any] = {}

router = APIRouter(prefix="/ai", tags=["AI Processing"])

try:
    initialize_ai_models()
except Exception as e:
    logger.warning(f"Failed to initialize AI models at startup: {e}")

def ensure_models_initialized():
    global whisper_stt, language_detector, translator, tts_engine, llm_model, plant_disease_rag
    if not all([whisper_stt, language_detector, translator, tts_engine, llm_model]):
        logger.info("Models not initialized, initializing now...")
        initialize_ai_models()
    if not all([whisper_stt, language_detector, translator, tts_engine, llm_model]):
        raise HTTPException(status_code=503, detail="AI models not available")

@router.post("/query", response_model=UnifiedAIResponse)
async def unified_query(
    text: Optional[str] = Form(None, description="Text query"),
    audio_file: Optional[UploadFile] = File(None, description="Audio file (WAV, MP3, etc.)"),
    audio_response: bool = Form(False, description="Whether to return response as audio"),
    current_user: dict = Depends(get_current_user)
):
    """
    Unified AI endpoint for text or audio queries.
    - Detects language of input automatically.
    - Responds in the same language as input.
    """
    ensure_models_initialized()
    processing_info = {}
    confidence = 0.0
    detected_language = None
    transcribed_text = None
    query_text = None
    request_type = None

    try:
        # ========== AUDIO QUERY ==========
        if audio_file is not None:
            request_type = "audio"
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
                content = await audio_file.read()
                temp_audio.write(content)
                temp_audio_path = temp_audio.name

            try:
                # Speech-to-Text
                stt_result = whisper_stt.transcribe_audio(temp_audio_path)
                if stt_result.get('error'):
                    raise HTTPException(status_code=400, detail=f"Speech recognition failed: {stt_result['error']}")
                transcribed_text = stt_result['text']
                detected_language = stt_result.get('language', 'en')
                confidence = stt_result.get('confidence', 0.0)
                processing_info['stt'] = stt_result

                # Language Detection (double-check)
                lang_result = language_detector.detect_language(transcribed_text)
                if lang_result.get('confidence', 0) > confidence:
                    detected_language = lang_result.get('language', detected_language)
                    confidence = lang_result.get('confidence', confidence)
                processing_info['language_detection'] = lang_result

                query_text = transcribed_text
                if detected_language != 'en':
                    translation_result = translator.translate(query_text, detected_language, 'en')
                    if not translation_result.get('error'):
                        query_text = translation_result['translated_text']
                        processing_info['input_translation'] = translation_result

            finally:
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)

        # ========== TEXT QUERY ==========
        elif text is not None:
            request_type = "text"
            query_text = text
            lang_result = language_detector.detect_language(text)
            detected_language = lang_result.get('detected_language', 'en')
            confidence = lang_result.get('confidence', 0.0)
            processing_info['language_detection'] = lang_result

            if detected_language != 'en':
                translation_result = translator.translate(text, detected_language, 'en')
                if not translation_result.get('error'):
                    query_text = translation_result['translated_text']
                    processing_info['input_translation'] = translation_result

        else:
            raise HTTPException(status_code=400, detail="Provide either 'text' or 'audio_file' input.")

        # ========== LLM Processing ==========
        llm_response = llm_model.chat(
            query_text,
            context={"domain": "agriculture"},
            user_id=str(current_user.id)
        )
        if llm_response.get('error'):
            raise HTTPException(status_code=500, detail=f"LLM processing failed: {llm_response['error']}")

        response_text = llm_response['response']
        processing_info['llm_response'] = {
            'model': llm_response.get('model', 'unknown'),
            'tokens': len(response_text.split())
        }

        # ========== Response Translation (only if detected_language is different) ==========
        if detected_language != 'en':
            translation_result = translator.translate(
                response_text,
                source_lang='en',
                target_lang=detected_language
            )
            if not translation_result.get('error'):
                response_text = translation_result['translated_text']
                processing_info['output_translation'] = translation_result

        # Set response language to detected language
        response_language = detected_language

        # ========== Audio Response ==========
        audio_url = None
        if audio_response or request_type == "audio":
            logger.info(f"Generating TTS audio for language: {detected_language}")
            tts_result = tts_engine.synthesize(
                response_text,
                language=detected_language
            )
            logger.info(f"TTS result: {tts_result}")

            if tts_result.get('success'):
                audio_url = tts_result.get('audio_url')
                processing_info['tts'] = {
                    'language': detected_language,
                    'audio_path': tts_result['audio_path'],
                    'audio_url': audio_url,
                    'success': True
                }
            else:
                logger.error(f"TTS failed: {tts_result.get('error', 'Unknown error')}")
                processing_info['tts'] = {
                    'language': detected_language,
                    'success': False,
                    'error': tts_result.get('error', 'Unknown error')
                }

        return UnifiedAIResponse(
            success=True,
            request_type=request_type,
            transcribed_text=transcribed_text,
            detected_language=detected_language,
            response_text=response_text,
            response_language=response_language,
            audio_url=audio_url,
            confidence=confidence,
            processing_info=processing_info
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in unified AI query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/diagnose", response_model=PlantDiagnosisResponse)
async def diagnose_plant_disease(
    image: UploadFile = File(..., description="Plant/crop image for disease diagnosis"),
    crop_type: Optional[str] = Form(None, description="Type of crop (optional)"),
    symptoms: Optional[str] = Form(None, description="Observed symptoms (optional)"),
    location: Optional[str] = Form(None, description="Geographic location (optional)"),
    current_user: User = Depends(get_current_user)
):
    """
    Plant disease diagnosis endpoint using RAG and LLM analysis.
    
    - Upload an image of a plant/crop leaf
    - Get AI-powered disease diagnosis
    - Receive treatment recommendations and advice
    """
    ensure_models_initialized()
    
    logger.info(f"Received diagnosis request - Image: {image.filename}, Content-Type: {image.content_type}, Crop: {crop_type}, Symptoms: {symptoms}, Location: {location}")
    
    if not plant_disease_rag or not plant_disease_rag.is_service_ready():
        raise HTTPException(
            status_code=503, 
            detail="Plant disease diagnosis service not available"
        )
    
    # Validate image file
    if not image.content_type or not image.content_type.startswith('image/'):
        logger.error(f"Invalid image content type: {image.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")
    
    processing_info = {}
    temp_image_path = None
    
    try:
        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            content = await image.read()
            temp_file.write(content)
            temp_image_path = temp_file.name
        
        processing_info['image_received'] = {
            'filename': image.filename,
            'size': len(content),
            'content_type': image.content_type
        }
        
        # Analyze image for symptoms (basic implementation)
        try:
            image_symptoms = plant_disease_rag.analyze_image_symptoms(temp_image_path)
            processing_info['image_analysis'] = {'symptoms_detected': image_symptoms}
        except Exception as e:
            logger.warning(f"Image analysis failed: {e}")
            image_symptoms = "Image uploaded for analysis"
        
        # Combine user symptoms with image analysis
        combined_query = []
        if crop_type:
            combined_query.append(f"Crop: {crop_type}")
        if symptoms:
            combined_query.append(f"Symptoms: {symptoms}")
        if image_symptoms:
            combined_query.append(f"Image analysis: {image_symptoms}")
        if location:
            combined_query.append(f"Location: {location}")
            
        search_query = ". ".join(combined_query) if combined_query else "Plant disease diagnosis"
        
        # Search for similar disease cases using RAG
        similar_diseases = plant_disease_rag.search_similar_diseases(search_query, top_k=5)
        processing_info['rag_search'] = {
            'query': search_query,
            'results_count': len(similar_diseases)
        }
        
        if not similar_diseases:
            # Fallback response if no matches found
            return PlantDiagnosisResponse(
                success=True,
                primary_diagnosis="Unable to identify specific disease",
                confidence="low",
                crop_type=crop_type,
                condition="Unknown",
                is_healthy=False,
                similar_cases=[],
                recommendations=["Consult with a local agricultural expert"],
                preventive_measures=["Maintain good crop hygiene", "Ensure proper spacing"],
                fertilizer_advice="Use balanced NPK fertilizer as per soil test",
                urgency="medium",
                llm_analysis="Insufficient data for diagnosis. Please provide more specific symptoms.",
                processing_info=processing_info
            )
        
        # Get treatment recommendations from RAG with LLM
        treatment_info = plant_disease_rag.get_treatment_recommendations(
            similar_diseases, 
            crop_type,
            user_id=str(current_user.id)
        )
        
        # Extract LLM analysis from treatment info
        llm_analysis = treatment_info.get('llm_analysis', 'Analysis completed using database recommendations.')
        processing_info['llm_analysis'] = {
            'model': treatment_info.get('model_used', 'unknown'),
            'response_length': len(llm_analysis)
        }
        
        # Determine crop and condition from results
        primary_case = similar_diseases[0]
        detected_crop = crop_type or primary_case['crop']
        detected_condition = primary_case['condition']
        is_healthy = primary_case['is_healthy']
        
        return PlantDiagnosisResponse(
            success=True,
            primary_diagnosis=treatment_info['primary_diagnosis'],
            confidence=treatment_info['confidence'],
            crop_type=detected_crop,
            condition=detected_condition,
            is_healthy=is_healthy,
            similar_cases=treatment_info.get('similar_cases', []),
            recommendations=treatment_info['recommendations'],
            preventive_measures=treatment_info['preventive_measures'],
            fertilizer_advice=treatment_info['fertilizer_advice'],
            urgency=treatment_info['urgency'],
            llm_analysis=llm_analysis,
            processing_info=processing_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in plant disease diagnosis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary file
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.unlink(temp_image_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {e}")

@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Serve generated audio files
    """
    try:
        # Primary path - generated audio directory
        generated_audio_dir = os.path.join(
            os.path.dirname(__file__), "..", "assets", "audio", "generated"
        )
        
        possible_paths = [
            os.path.join(generated_audio_dir, filename),
            os.path.join(tempfile.gettempdir(), filename),
            os.path.join(os.path.dirname(__file__), "..", "assets", "tts", filename)
        ]
        
        for audio_path in possible_paths:
            if os.path.exists(audio_path):
                return FileResponse(
                    audio_path,
                    media_type="audio/mpeg",  # Changed to mpeg for mp3 files
                    filename=filename,
                    headers={"Content-Disposition": f"attachment; filename={filename}"}
                )
        
        raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")
    except Exception as e:
        logger.error(f"Error serving audio file {filename}: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve audio file")

@router.get("/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """
    Get chat history for the current user from Redis (via HybridLLM)
    """
    ensure_models_initialized()
    try:
        user_id = str(current_user.id)
        history = []
        if hasattr(llm_model, "get_chat_history"):
            history = llm_model.get_chat_history(user_id)
        else:
            # Fallback: try direct Redis access
            redis_client = getattr(llm_model, "redis", None)
            if redis_client:
                key = f"chat_history:{user_id}"
                raw = redis_client.get(key)
                if raw:
                    import json
                    history = json.loads(raw)
        # Defensive: ensure history is a list of dicts
        if not isinstance(history, list):
            history = []
        return {"success": True, "history": history}
    except Exception as e:
        logger.error(f"Error fetching chat history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat history")

@router.get("/status")
async def get_system_status():
    """
    Get system status for health checks
    """
    try:
        models_ready = all([whisper_stt, language_detector, translator, tts_engine, llm_model])
        
        # Get the correct generated audio directory
        generated_audio_dir = os.path.join(
            os.path.dirname(__file__), "..", "assets", "audio", "generated"
        )
        
        # Get RAG service status
        rag_status = None
        if plant_disease_rag:
            rag_status = plant_disease_rag.get_service_info()
        
        return {
            "success": True,
            "system_ready": models_ready,
            "models_loaded": {
                "whisper_stt": whisper_stt is not None,
                "language_detector": language_detector is not None,
                "translator": translator is not None,
                "tts_engine": tts_engine is not None,
                "llm_model": llm_model is not None,
                "plant_disease_rag": plant_disease_rag is not None and plant_disease_rag.is_service_ready()
            },
            "supported_languages": ["en", "hi", "ta", "te", "ml", "kn", "gu", "bn"],
            "audio_storage_path": os.path.abspath(generated_audio_dir),
            "tts_info": tts_engine.get_model_info() if tts_engine else None,
            "rag_service": rag_status
        }
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system status")