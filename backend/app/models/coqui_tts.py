"""
Coqui TTS (Text-to-Speech) Model Wrapper for AGRI AI

This module provides high-quality text-to-speech synthesis
for multiple Indian languages in agricultural applications.
"""

import os
import logging
import tempfile
from typing import Optional, Dict, List
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to import TTS dependencies
try:
    from TTS.api import TTS
    from TTS.utils.manage import ModelManager
    import torch
    from pydub import AudioSegment
    TTS_AVAILABLE = True
except ImportError:
    logger.warning("TTS library or pydub not available. Text-to-speech features will be limited.")
    TTS_AVAILABLE = False

class CoquiTTS:
    """
    Coqui TTS wrapper for agricultural multilingual voice synthesis
    """
    
    # Language models available for agricultural use
    SUPPORTED_MODELS = {
        'en': 'tts_models/en/ljspeech/tacotron2-DDC',
        'hi': 'tts_models/hi/male/fairseq',
        'ta': 'tts_models/ta/male/fairseq',
        'ml': 'tts_models/ml/male/fairseq',
        'te': 'tts_models/te/male/fairseq',
        'kn': 'tts_models/kn/male/fairseq',
        'gu': 'tts_models/gu/male/fairseq',
        'bn': 'tts_models/bn/male/fairseq'
    }
    
    # Fallback multilingual model
    MULTILINGUAL_MODEL = 'tts_models/multilingual/multi-dataset/xtts_v2'
    
    # Default speakers for XTTS multilingual model
    DEFAULT_SPEAKERS = {
        'en': 'Claribel Dervla',      # English female voice
        'hi': 'Claribel Dervla',      # Use same for Hindi
        'ta': 'Claribel Dervla',      # Use same for Tamil
        'te': 'Claribel Dervla',      # Use same for Telugu
        'ml': 'Claribel Dervla',      # Use same for Malayalam
        'kn': 'Claribel Dervla',      # Use same for Kannada
        'gu': 'Claribel Dervla',      # Use same for Gujarati
        'bn': 'Claribel Dervla'       # Use same for Bengali
    }
    
    # Voice settings for agricultural context
    VOICE_SETTINGS = {
        'speaking_rate': 0.9,  # Slightly slower for clarity
        'pitch': 0.0,          # Neutral pitch
        'volume': 0.8,         # Clear but not too loud
        'emotion': 'neutral'   # Professional tone
    }
    
    def __init__(self, 
                 model_dir: Optional[str] = None,
                 device: Optional[str] = None,
                 use_gpu: bool = True):
        """
        Initialize Coqui TTS
        
        Args:
            model_dir: Directory to store TTS models
            device: Device to run on (cuda/cpu)
            use_gpu: Whether to use GPU if available
        """
        self.model_dir = model_dir or os.path.join(
            os.path.dirname(__file__), "..", "assets", "tts"
        )
        
        # Directory for generated audio files
        self.generated_audio_dir = os.path.join(
            os.path.dirname(__file__), "..", "assets", "audio", "generated"
        )
        
        # Set TTS model cache directory environment variables
        # Convert to absolute path to ensure consistency
        abs_model_dir = os.path.abspath(self.model_dir)
        os.environ['TTS_CACHE_PATH'] = abs_model_dir
        os.environ['COQUI_TTS_CACHE_PATH'] = abs_model_dir
        
        # Set device and GPU usage only if TTS is available
        if TTS_AVAILABLE:
            self.device = device or ("cuda" if torch.cuda.is_available() and use_gpu else "cpu")
            self.use_gpu = use_gpu and torch.cuda.is_available()
        else:
            self.device = "cpu"
            self.use_gpu = False
        
        self.models = {}  # Cache for loaded models
        self.current_model = None
        self.current_language = None
        self.multilingual_tts = None
        self.model_manager = None
        
        # Create model directory
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Create generated audio directory
        os.makedirs(self.generated_audio_dir, exist_ok=True)
        
        # DON'T automatically initialize models - only when needed
        self.initialized = TTS_AVAILABLE
        
        if not TTS_AVAILABLE:
            logger.error("TTS library or pydub not available")
        else:
            logger.info(f"TTS initialized with model directory: {self.model_dir}")
            logger.info(f"Generated audio will be stored in: {self.generated_audio_dir}")
    
    def _get_tts_model(self, language: str):
        """
        Load and cache the TTS model for the given language.
        If unavailable, fallback to the multilingual model.
        """
        if not TTS_AVAILABLE:
            return None
        if language in self.models:
            return self.models[language]
        model_name = self.SUPPORTED_MODELS.get(language, self.MULTILINGUAL_MODEL)
        try:
            # Initialize TTS model
            tts_model = TTS(
                model_name, 
                progress_bar=False, 
                gpu=self.use_gpu
            )
            
            self.models[language] = tts_model
            logger.info(f"Loaded TTS model: {model_name}")
            return tts_model
        except Exception as e:
            logger.warning(f"Could not load TTS model for {language} ({model_name}): {e}")
            # Fallback to multilingual model if not already loaded
            if self.MULTILINGUAL_MODEL not in self.models:
                try:
                    tts_model = TTS(
                        self.MULTILINGUAL_MODEL, 
                        progress_bar=False, 
                        gpu=self.use_gpu
                    )
                    
                    self.models[self.MULTILINGUAL_MODEL] = tts_model
                    logger.info(f"Loaded fallback multilingual TTS model.")
                    return tts_model
                except Exception as e2:
                    logger.error(f"Failed to load fallback multilingual TTS model: {e2}")
                    return None
            return self.models[self.MULTILINGUAL_MODEL]

    def synthesize(self, 
                   text: str,
                   language: str = 'en',
                   output_path: Optional[str] = None,
                   speaker: Optional[str] = None,
                   speed: float = 1.0) -> Dict[str, any]:
        """
        Synthesize speech from text and save as mp3
        
        Args:
            text: Text to synthesize
            language: Language code
            output_path: Path to save audio file
            speaker: Speaker voice (for multilingual models)
            speed: Speaking speed multiplier
            
        Returns:
            Dict containing synthesis result and metadata
        """
        try:
            if not TTS_AVAILABLE:
                return {
                    'success': False,
                    'audio_path': None,
                    'audio_url': None,
                    'audio_data': None,
                    'error': 'TTS library or pydub not available'
                }
            
            if not text or not text.strip():
                return {
                    'success': False,
                    'audio_path': None,
                    'audio_url': None,
                    'audio_data': None,
                    'error': 'Empty text'
                }
            
            logger.info(f"TTS synthesis requested: '{text}' in {language}")
            
            # Output file path as mp3
            if output_path is None:
                # Generate filename with timestamp
                import time
                timestamp = int(time.time())
                filename = f"tts_{language}_{timestamp}.mp3"
                output_path = os.path.join(self.generated_audio_dir, filename)

            # Step 1: Synthesize to WAV (temp)
            wav_path = tempfile.NamedTemporaryFile(
                suffix='.wav', delete=False
            ).name

            tts_model = self._get_tts_model(language)
            if not tts_model:
                return {
                    'success': False,
                    'audio_path': None,
                    'audio_url': None,
                    'audio_data': None,
                    'error': f'No TTS model available for language {language}'
                }

            # Synthesize speech
            try:
                # Check if this is the multilingual model by checking the loaded model name
                model_name = ""
                is_multilingual = False
                
                # Try to get the model name from various attributes
                if hasattr(tts_model, 'model_name'):
                    model_name = tts_model.model_name
                elif hasattr(tts_model, 'synthesizer') and hasattr(tts_model.synthesizer, 'tts_config'):
                    model_name = getattr(tts_model.synthesizer.tts_config, 'model_name', '')
                elif hasattr(tts_model, 'synthesizer') and hasattr(tts_model.synthesizer, 'tts_model'):
                    model_name = str(type(tts_model.synthesizer.tts_model).__name__)
                
                # Check if it's multilingual
                is_multilingual = (
                    'xtts' in model_name.lower() or 
                    'multilingual' in model_name.lower() or
                    'multi_dataset' in model_name.lower() or
                    self.MULTILINGUAL_MODEL in self.models and self.models[self.MULTILINGUAL_MODEL] == tts_model
                )
                
                logger.info(f"Model detection: {model_name}, is_multilingual: {is_multilingual}")
                
                if is_multilingual:
                    # For multilingual models (XTTS), we need to specify the language and speaker
                    # Use default speaker for the language if none provided
                    default_speaker = speaker or self.DEFAULT_SPEAKERS.get(language, "Claribel Dervla")
                    
                    logger.info(f"Using speaker: {default_speaker} for language: {language}")
                    
                    tts_model.tts_to_file(
                        text=text, 
                        speaker=default_speaker, 
                        language=language, 
                        file_path=wav_path, 
                        speed=speed
                    )
                else:
                    # For single-language models
                    if speaker:
                        tts_model.tts_to_file(text=text, speaker=speaker, file_path=wav_path, speed=speed)
                    else:
                        tts_model.tts_to_file(text=text, file_path=wav_path, speed=speed)
            except Exception as e:
                logger.error(f"Speech synthesis with TTS failed: {e}")
                return {
                    'success': False,
                    'audio_path': None,
                    'audio_url': None,
                    'audio_data': None,
                    'error': f'Speech synthesis failed: {e}'
                }

            # Step 2: Convert WAV to MP3 using pydub
            try:
                audio = AudioSegment.from_wav(wav_path)
                audio.export(output_path, format="mp3")
                os.remove(wav_path)
            except Exception as e:
                logger.error(f"Failed to convert WAV to MP3: {e}")
                # Clean up possibly left-over wav
                if os.path.exists(wav_path):
                    os.remove(wav_path)
                return {
                    'success': False,
                    'audio_path': None,
                    'audio_url': None,
                    'audio_data': None,
                    'error': f'Audio conversion failed: {e}'
                }

            # Compute the relative URL for FastAPI endpoint
            # e.g. /ai/audio/tts_xxx.mp3 if you serve with such route
            audio_url = f"/ai/audio/{os.path.basename(output_path)}"

            return {
                'success': True,
                'audio_path': output_path,
                'audio_url': audio_url,
                'audio_data': None,
                'language': language,
                'message': 'TTS synthesis successful (mp3)'
            }
            
        except Exception as e:
            logger.error(f"Speech synthesis failed: {e}")
            return {
                'success': False,
                'audio_path': None,
                'audio_url': None,
                'audio_data': None,
                'error': str(e)
            }

    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        return list(self.SUPPORTED_MODELS.keys())
    
    def get_available_speakers(self, language: str = 'en') -> List[str]:
        """Get list of available speakers for multilingual model"""
        if not TTS_AVAILABLE:
            return []
        
        try:
            # Try to get speakers from loaded multilingual model
            if self.MULTILINGUAL_MODEL in self.models:
                tts_model = self.models[self.MULTILINGUAL_MODEL]
                if hasattr(tts_model, 'speakers'):
                    return list(tts_model.speakers)
            
            # Return default speakers if model not loaded or no speakers attribute
            return list(self.DEFAULT_SPEAKERS.values())
        except Exception as e:
            logger.warning(f"Could not get available speakers: {e}")
            return ["Claribel Dervla"]
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about the TTS model"""
        return {
            'tts_available': TTS_AVAILABLE,
            'supported_languages': self.get_supported_languages(),
            'default_speakers': self.DEFAULT_SPEAKERS,
            'available_speakers': self.get_available_speakers(),
            'device': self.device,
            'use_gpu': self.use_gpu,
            'model_dir': self.model_dir,
            'generated_audio_dir': self.generated_audio_dir,
            'initialized': self.initialized,
            'cache_env_vars': {
                'TTS_CACHE_PATH': os.environ.get('TTS_CACHE_PATH'),
                'COQUI_TTS_CACHE_PATH': os.environ.get('COQUI_TTS_CACHE_PATH')
            }
        }

    def set_model_cache_directory(self, directory: str) -> bool:
        """
        Explicitly set the model cache directory
        
        Args:
            directory: Path to store TTS models
            
        Returns:
            bool: True if directory was set successfully
        """
        try:
            # Update instance variable
            self.model_dir = os.path.abspath(directory)
            
            # Create directory if it doesn't exist
            os.makedirs(self.model_dir, exist_ok=True)
            
            # Set environment variables
            os.environ['TTS_CACHE_PATH'] = self.model_dir
            os.environ['COQUI_TTS_CACHE_PATH'] = self.model_dir
            
            # Update any existing model managers
            for model in self.models.values():
                if hasattr(model, 'model_manager'):
                    model.model_manager.output_path = self.model_dir
            
            logger.info(f"TTS model cache directory set to: {self.model_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set model cache directory: {e}")
            return False

    def is_available(self) -> bool:
        """Check if TTS is available"""
        return TTS_AVAILABLE
    
    def cleanup(self):
        """Clean up resources"""
        if hasattr(self, 'models'):
            self.models.clear()
        if hasattr(self, 'multilingual_tts'):
            self.multilingual_tts = None
        if hasattr(self, 'model_manager'):
            self.model_manager = None