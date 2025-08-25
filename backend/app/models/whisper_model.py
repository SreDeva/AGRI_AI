"""
Whisper Speech-to-Text Model Wrapper for AGRI AI

This module provides a wrapper for OpenAI's Whisper model for 
speech-to-text conversion supporting multiple Indian languages.
"""

import os
import logging
import torch
import whisper
import numpy as np
from typing import Optional, Dict, Any, Union
from pathlib import Path
import tempfile
import librosa

logger = logging.getLogger(__name__)

class WhisperSTT:
    """
    Whisper Speech-to-Text wrapper with support for Indian languages
    """
    
    # Supported languages for agricultural context
    SUPPORTED_LANGUAGES = {
        'en': 'english',
        'hi': 'hindi', 
        'ta': 'tamil',
        'ml': 'malayalam',
        'te': 'telugu',
        'kn': 'kannada',
        'gu': 'gujarati',
        'pa': 'punjabi',
        'bn': 'bengali',
        'mr': 'marathi'
    }
    
    def __init__(self, 
                 model_size: str = "base",
                 device: Optional[str] = None,
                 model_dir: Optional[str] = None):
        """
        Initialize Whisper STT model
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
            device: Device to run model on (cuda/cpu)
            model_dir: Directory to store model files
        """
        self.model_size = model_size
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_dir = model_dir or os.path.join(
            os.path.dirname(__file__), "..", "assets", "whisper"
        )
        
        self.model = None
        self._load_model()
        
    def _load_model(self):
        """Load Whisper model with error handling"""
        try:
            logger.info(f"Loading Whisper {self.model_size} model on {self.device}")
            
            # Set download root for model files
            os.makedirs(self.model_dir, exist_ok=True)
            
            # Load model
            self.model = whisper.load_model(
                self.model_size, 
                device=self.device,
                download_root=self.model_dir
            )
            
            logger.info("Whisper model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def transcribe_audio(self, 
                        audio_path: Union[str, Path],
                        language: Optional[str] = None,
                        task: str = "transcribe") -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Language code (auto-detect if None)
            task: 'transcribe' or 'translate' to English
            
        Returns:
            Dict containing transcribed text and metadata
        """
        try:
            if not self.model:
                raise RuntimeError("Whisper model not loaded")
                
            logger.info(f"Transcribing audio: {audio_path}")
            
            # Validate language
            if language and language not in self.SUPPORTED_LANGUAGES:
                logger.warning(f"Language {language} not officially supported, using auto-detect")
                language = None
            
            # Transcribe
            result = self.model.transcribe(
                str(audio_path),
                language=language,
                task=task,
                verbose=False
            )
            
            # Extract information
            transcription = {
                'text': result['text'].strip(),
                'language': result.get('language', 'unknown'),
                'segments': result.get('segments', []),
                'confidence': self._calculate_confidence(result.get('segments', [])),
                'duration': self._get_audio_duration(audio_path)
            }
            
            logger.info(f"Transcription completed - Language: {transcription['language']}")
            return transcription
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return {
                'text': '',
                'language': 'unknown',
                'segments': [],
                'confidence': 0.0,
                'error': str(e)
            }
    
    def transcribe_numpy_array(self,
                              audio_array: np.ndarray,
                              sample_rate: int = 16000,
                              language: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribe audio from numpy array
        
        Args:
            audio_array: Audio data as numpy array
            sample_rate: Sample rate of audio
            language: Language code
            
        Returns:
            Dict containing transcribed text and metadata
        """
        try:
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                # Ensure audio is at 16kHz (Whisper requirement)
                if sample_rate != 16000:
                    audio_array = librosa.resample(
                        audio_array, 
                        orig_sr=sample_rate, 
                        target_sr=16000
                    )
                
                # Save as WAV
                import soundfile as sf
                sf.write(tmp_file.name, audio_array, 16000)
                
                # Transcribe
                result = self.transcribe_audio(tmp_file.name, language)
                
                # Cleanup
                os.unlink(tmp_file.name)
                
                return result
                
        except Exception as e:
            logger.error(f"Array transcription failed: {e}")
            return {
                'text': '',
                'language': 'unknown',
                'segments': [],
                'confidence': 0.0,
                'error': str(e)
            }
    
    def detect_language(self, audio_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Detect language of audio file
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Dict with detected language and confidence
        """
        try:
            if not self.model:
                raise RuntimeError("Whisper model not loaded")
            
            # Load audio
            audio = whisper.load_audio(str(audio_path))
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
            
            # Detect language
            _, probs = self.model.detect_language(mel)
            
            # Get top languages
            top_languages = sorted(probs.items(), key=lambda x: x[1], reverse=True)[:3]
            
            return {
                'detected_language': top_languages[0][0],
                'confidence': top_languages[0][1],
                'all_probabilities': dict(top_languages),
                'supported': top_languages[0][0] in self.SUPPORTED_LANGUAGES
            }
            
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return {
                'detected_language': 'unknown',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def _calculate_confidence(self, segments: list) -> float:
        """Calculate average confidence from segments"""
        if not segments:
            return 0.0
        
        # Whisper doesn't provide explicit confidence scores
        # We can estimate based on segment consistency
        total_confidence = 0.0
        for segment in segments:
            # Use available metrics to estimate confidence
            confidence = 1.0  # Default high confidence
            
            # Adjust based on segment properties
            if 'no_speech_prob' in segment:
                confidence *= (1.0 - segment['no_speech_prob'])
            
            total_confidence += confidence
        
        return total_confidence / len(segments)
    
    def _get_audio_duration(self, audio_path: Union[str, Path]) -> float:
        """Get audio duration in seconds"""
        try:
            audio = whisper.load_audio(str(audio_path))
            return len(audio) / whisper.audio.SAMPLE_RATE
        except:
            return 0.0
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        return {
            'model_size': self.model_size,
            'device': self.device,
            'model_dir': self.model_dir,
            'supported_languages': self.SUPPORTED_LANGUAGES,
            'is_loaded': self.is_model_loaded()
        }


# Agricultural-specific prompts and context
AGRICULTURAL_CONTEXT = {
    'crop_names': ['rice', 'wheat', 'corn', 'tomato', 'potato', 'onion', 'sugarcane'],
    'farming_terms': ['irrigation', 'fertilizer', 'pesticide', 'harvest', 'planting', 'soil'],
    'common_phrases': {
        'en': ['crop disease', 'plant health', 'weather forecast', 'soil testing'],
        'hi': ['फसल की बीमारी', 'पौधे का स्वास्थ्य', 'मौसम का पूर्वानुमान'],
        'ta': ['பயிர் நோய்', 'தாவர நலம்', 'வானிலை முன்னறிவிப்பு'],
    }
}

def enhance_transcription_for_agriculture(transcription: str, language: str) -> str:
    """
    Enhance transcription with agricultural context
    
    Args:
        transcription: Original transcription
        language: Detected language
        
    Returns:
        Enhanced transcription with agricultural terminology
    """
    # This could be expanded with agricultural NLP models
    # For now, basic keyword enhancement
    
    enhanced = transcription
    
    # Add agricultural context corrections
    agricultural_corrections = {
        'en': {
            'corp': 'crop',
            'pest inside': 'pesticide',
            'farming': 'farming',
        },
        'hi': {
            # Add Hindi corrections
        },
        'ta': {
            # Add Tamil corrections  
        }
    }
    
    if language in agricultural_corrections:
        for wrong, correct in agricultural_corrections[language].items():
            enhanced = enhanced.replace(wrong, correct)
    
    return enhanced
