# Models package
"""
ML Models Package for AGRI AI

This package contains all machine learning model wrappers for:
- Speech-to-Text (Whisper)
- Language Detection (with fallbacks)
- Translation (IndicTrans2)
- Text-to-Speech (multiple backends)
- LLM Inference (Ollama)

All models include agricultural optimizations and fallback support.
"""

import logging
import warnings
from typing import Optional, Dict, Any

# Suppress warnings from ML libraries
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

# Configure logging
logger = logging.getLogger(__name__)

# Global model instances (lazy loading)
_whisper_model = None
_language_detector = None
_indictrans_model = None
_tts_model = None
_ollama_model = None

def get_whisper_model():
    """Get or create Whisper STT model instance"""
    global _whisper_model
    if _whisper_model is None:
        try:
            from .whisper_model import WhisperSTT
            _whisper_model = WhisperSTT()
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    return _whisper_model

def get_language_detector():
    """Get or create Language Detection model instance"""
    global _language_detector
    if _language_detector is None:
        try:
            from .language_detector import AGRILanguageDetector
            _language_detector = AGRILanguageDetector()
            logger.info("Language detector loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load language detector: {e}")
            raise
    return _language_detector

def get_indictrans_model():
    """Get or create IndicTrans2 translation model instance"""
    global _indictrans_model
    if _indictrans_model is None:
        try:
            from .indictrans import IndicTrans2Translator
            _indictrans_model = IndicTrans2Translator()
            logger.info("IndicTrans2 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load IndicTrans2 model: {e}")
            raise
    return _indictrans_model

def get_coqui_model():
    """Get or create TTS model instance"""
    global _tts_model
    if _tts_model is None:
        try:
            from .coqui_tts import CoquiTTS
            _tts_model = CoquiTTS()
            logger.info("Coqui TTS model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Coqui TTS model: {e}")
            raise
    return _tts_model

def get_ollama_model():
    """Get or create Ollama LLM model instance"""
    global _ollama_model
    if _ollama_model is None:
        try:
            from .llm_ollama import OllamaLLM
            _ollama_model = OllamaLLM()
            logger.info("Ollama model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Ollama model: {e}")
            raise
    return _ollama_model

def get_model_status() -> Dict[str, Any]:
    """Get status of all models"""
    status = {}
    
    # Check each model
    models = [
        ('whisper', get_whisper_model),
        ('language_detector', get_language_detector),
        ('indictrans', get_indictrans_model),
        ('tts', get_coqui_model),
        ('ollama', get_ollama_model)
    ]
    
    for name, getter in models:
        try:
            model = getter()
            status[name] = {
                'available': True,
                'loaded': model is not None,
                'type': type(model).__name__
            }
        except Exception as e:
            status[name] = {
                'available': False,
                'error': str(e),
                'loaded': False
            }
    
    return status

# Convenience functions for quick access
def transcribe_audio(audio_path: str, language: str = "auto") -> Dict[str, Any]:
    """Quick audio transcription"""
    whisper = get_whisper_model()
    return whisper.transcribe_audio(audio_path, language)

def detect_language(text: str, agricultural_context: bool = False) -> Dict[str, Any]:
    """Quick language detection"""
    detector = get_language_detector()
    return detector.detect_language(text, agricultural_context)

def translate_text(text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
    """Quick text translation"""
    translator = get_indictrans_model()
    return translator.translate(text, source_lang, target_lang)

def synthesize_speech(text: str, language: str = "en", **kwargs) -> Dict[str, Any]:
    """Quick speech synthesis"""
    tts = get_coqui_model()
    return tts.synthesize(text, language, **kwargs)

def chat_with_llm(message: str, agricultural_context: bool = True) -> Dict[str, Any]:
    """Quick LLM chat"""
    llm = get_ollama_model()
    return llm.chat(message, agricultural_context)

# Export main functions
__all__ = [
    'get_whisper_model',
    'get_language_detector', 
    'get_indictrans_model',
    'get_coqui_model',
    'get_ollama_model',
    'get_model_status',
    'transcribe_audio',
    'detect_language',
    'translate_text',
    'synthesize_speech',
    'chat_with_llm'
]
