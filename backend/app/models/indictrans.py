"""
IndicTrans2 Translation Model Wrapper for AGRI AI

This module provides translation capabilities between English and 
Indian languages for agricultural applications.
"""

import os
import logging
import torch
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import re

logger = logging.getLogger(__name__)

# Try to import IndicTrans2 dependencies
try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
    # Try to import IndicProcessor
    try:
        from IndicTransToolkit.processor import IndicProcessor
        INDIC_PROCESSOR_AVAILABLE = True
    except ImportError:
        logger.warning("IndicTransToolkit not available. Using fallback preprocessing.")
        INDIC_PROCESSOR_AVAILABLE = False
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger.warning("Transformers not available. Translation features will be limited.")
    TRANSFORMERS_AVAILABLE = False
    INDIC_PROCESSOR_AVAILABLE = False

class IndicTrans2Translator:
    """
    IndicTrans2 translation wrapper for agricultural multilingual support
    """
    
    # IndicTrans2 specific language codes
    INDICTRANS2_CODES = {
        'en': 'eng_Latn',
        'hi': 'hin_Deva', 
        'ta': 'tam_Taml',
        'ml': 'mal_Mlym',
        'te': 'tel_Telu',
        'kn': 'kan_Knda',
        'gu': 'guj_Gujr',
        'pa': 'pan_Guru',
        'bn': 'ben_Beng',
        'mr': 'mar_Deva',
        'as': 'asm_Beng',
        'or': 'ory_Orya'
    }
    
    # Legacy Language mappings for IndicTrans2
    LANGUAGE_CODES = {
        'english': 'en',
        'hindi': 'hi', 
        'tamil': 'ta',
        'malayalam': 'ml',
        'telugu': 'te',
        'kannada': 'kn',
        'gujarati': 'gu',
        'punjabi': 'pa',
        'bengali': 'bn',
        'marathi': 'mr',
        'assamese': 'as',
        'odia': 'or'
    }
    
    # Reverse mapping
    CODE_TO_LANGUAGE = {v: k for k, v in LANGUAGE_CODES.items()}
    
    # Agricultural priority language pairs
    PRIORITY_PAIRS = [
        ('en', 'hi'), ('en', 'ta'), ('en', 'ml'), ('en', 'te'),
        ('hi', 'en'), ('ta', 'en'), ('ml', 'en'), ('te', 'en')
    ]
    
    def __init__(self, 
                 model_dir: Optional[str] = None,
                 device: Optional[str] = None,
                 use_m2m100_fallback: bool = True):
        """
        Initialize IndicTrans2 translator
        
        Args:
            model_dir: Directory containing IndicTrans2 models
            device: Device to run model on
            use_m2m100_fallback: Use M2M100 as fallback if IndicTrans2 unavailable
        """
        self.model_dir = model_dir or os.path.join(
            os.path.dirname(__file__), "..", "assets", "indictrans2"
        )
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.use_m2m100_fallback = use_m2m100_fallback
        
        self.model = None
        self.tokenizer = None
        self.indic_processor = None
        self.fallback_model = None
        self.fallback_tokenizer = None
        
        # Initialize IndicProcessor if available
        if INDIC_PROCESSOR_AVAILABLE:
            try:
                self.indic_processor = IndicProcessor(inference=True)
                logger.info("✓ IndicProcessor initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize IndicProcessor: {e}")
                self.indic_processor = None
        
        self._load_models()
    
    def _load_models(self):
        """Load translation models with fallback options"""
        if not TRANSFORMERS_AVAILABLE:
            logger.error("Transformers library not available")
            return
        
        try:
            # Try to load IndicTrans2 first
            self._load_indictrans2()
        except Exception as e:
            logger.warning(f"Failed to load IndicTrans2: {e}")
            
            # Fall back to M2M100 if available
            if self.use_m2m100_fallback:
                try:
                    self._load_m2m100_fallback()
                except Exception as e:
                    logger.error(f"Failed to load fallback model: {e}")
    
    def _load_indictrans2(self):
        """Load IndicTrans2 model"""
        try:
            logger.info("Loading IndicTrans2 model...")
            
            # Check if model exists locally (HuggingFace cache format)
            cache_model_path = os.path.join(self.model_dir, "models--ai4bharat--indictrans2-en-indic-1B")
            simple_model_path = os.path.join(self.model_dir, "indictrans2-en-indic")
            
            if os.path.exists(cache_model_path):
                logger.info(f"Loading local IndicTrans2 from HuggingFace cache: {cache_model_path}")
                model_name = "ai4bharat/indictrans2-en-indic-1B"
                
                self.tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    cache_dir=self.model_dir,
                    local_files_only=True,  # Force offline mode
                    trust_remote_code=True
                )
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    model_name,
                    cache_dir=self.model_dir,
                    local_files_only=True,  # Force offline mode
                    trust_remote_code=True
                )
                logger.info("✓ Loaded IndicTrans2 from local cache (offline mode)")
                
            elif os.path.exists(simple_model_path):
                logger.info(f"Loading local IndicTrans2 from simple path: {simple_model_path}")
                self.tokenizer = AutoTokenizer.from_pretrained(
                    simple_model_path,
                    trust_remote_code=True
                )
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    simple_model_path,
                    trust_remote_code=True
                )
                logger.info("✓ Loaded IndicTrans2 from local directory")
                
            else:
                # Only download if absolutely necessary
                logger.info("No local IndicTrans2 found. Downloading from HuggingFace Hub...")
                model_name = "ai4bharat/indictrans2-en-indic-1B"
                
                self.tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    cache_dir=self.model_dir,
                    trust_remote_code=True
                )
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    model_name,
                    cache_dir=self.model_dir,
                    trust_remote_code=True
                )
                logger.info("✓ Downloaded and cached IndicTrans2 model")
            
            self.model.to(self.device)
            logger.info("IndicTrans2 model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load IndicTrans2: {e}")
            raise
    
    def _load_m2m100_fallback(self):
        """Load M2M100 as fallback translation model"""
        try:
            logger.info("Loading M2M100 fallback model...")
            
            model_name = "facebook/m2m100_418M"
            
            self.fallback_tokenizer = M2M100Tokenizer.from_pretrained(
                model_name,
                cache_dir=os.path.join(self.model_dir, "m2m100")
            )
            self.fallback_model = M2M100ForConditionalGeneration.from_pretrained(
                model_name,
                cache_dir=os.path.join(self.model_dir, "m2m100")
            )
            
            self.fallback_model.to(self.device)
            logger.info("M2M100 fallback model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load M2M100 fallback: {e}")
            raise
    
    def translate(self, 
                  text: str,
                  source_lang: str,
                  target_lang: str,
                  max_length: int = 256) -> Dict[str, any]:
        """
        Translate text between languages
        
        Args:
            text: Text to translate
            source_lang: Source language code
            target_lang: Target language code
            max_length: Maximum length of translation
            
        Returns:
            Dict containing translation result and metadata
        """
        try:
            if not text or not text.strip():
                return {
                    'translated_text': '',
                    'source_lang': source_lang,
                    'target_lang': target_lang,
                    'confidence': 0.0,
                    'error': 'Empty input text'
                }
            
            # Preprocess text
            clean_text = self._preprocess_text(text)
            
            # Choose translation method
            if self.model and self.tokenizer:
                result = self._translate_indictrans2(clean_text, source_lang, target_lang, max_length)
            elif self.fallback_model and self.fallback_tokenizer:
                result = self._translate_m2m100(clean_text, source_lang, target_lang, max_length)
            else:
                return {
                    'translated_text': text,  # Return original if no model
                    'source_lang': source_lang,
                    'target_lang': target_lang,
                    'confidence': 0.0,
                    'error': 'No translation model available'
                }
            
            # Post-process for agricultural context
            enhanced_result = self._enhance_agricultural_translation(result, source_lang, target_lang)
            
            return enhanced_result
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                'translated_text': text,  # Return original on error
                'source_lang': source_lang,
                'target_lang': target_lang,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def _translate_indictrans2(self, 
                              text: str, 
                              source_lang: str, 
                              target_lang: str,
                              max_length: int) -> Dict[str, any]:
        """Translate using IndicTrans2 model"""
        try:
            # Convert language codes to IndicTrans2 format
            src_lang_code = self.INDICTRANS2_CODES.get(source_lang, source_lang)
            tgt_lang_code = self.INDICTRANS2_CODES.get(target_lang, target_lang)
            
            # Use IndicProcessor if available for preprocessing
            if self.indic_processor:
                batch = self.indic_processor.preprocess_batch(
                    [text],
                    src_lang=src_lang_code,
                    tgt_lang=tgt_lang_code
                )
                input_text = batch[0]
            else:
                # Fallback: manual preprocessing in IndicTrans2 format
                input_text = text
            
            # Tokenize
            inputs = self.tokenizer(
                input_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            ).to(self.device)
            
            # Generate translation
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=4,
                    early_stopping=True,
                    do_sample=False
                )
            
            # Decode
            generated_text = self.tokenizer.decode(
                outputs[0], 
                skip_special_tokens=True
            )
            
            # Use IndicProcessor for postprocessing if available
            if self.indic_processor:
                translated_text = self.indic_processor.postprocess_batch(
                    [generated_text], 
                    lang=tgt_lang_code
                )[0]
            else:
                translated_text = generated_text
            
            return {
                'translated_text': translated_text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'confidence': 0.9,  # IndicTrans2 generally high quality
                'model_used': 'indictrans2'
            }
            
        except Exception as e:
            logger.error(f"IndicTrans2 translation failed: {e}")
            raise
    
    def _translate_m2m100(self, 
                         text: str, 
                         source_lang: str, 
                         target_lang: str,
                         max_length: int) -> Dict[str, any]:
        """Translate using M2M100 fallback model"""
        try:
            # Set source language
            self.fallback_tokenizer.src_lang = source_lang
            
            # Tokenize
            inputs = self.fallback_tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=max_length
            ).to(self.device)
            
            # Generate translation
            with torch.no_grad():
                generated_tokens = self.fallback_model.generate(
                    **inputs,
                    forced_bos_token_id=self.fallback_tokenizer.get_lang_id(target_lang),
                    max_length=max_length,
                    num_beams=4,
                    early_stopping=True
                )
            
            # Decode
            translated_text = self.fallback_tokenizer.batch_decode(
                generated_tokens, 
                skip_special_tokens=True
            )[0]
            
            return {
                'translated_text': translated_text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'confidence': 0.8,  # M2M100 good but not specialized for Indic
                'model_used': 'm2m100'
            }
            
        except Exception as e:
            logger.error(f"M2M100 translation failed: {e}")
            raise
    
    def translate_batch(self, 
                       texts: List[str],
                       source_lang: str,
                       target_lang: str) -> List[Dict[str, any]]:
        """
        Translate multiple texts
        
        Args:
            texts: List of texts to translate
            source_lang: Source language code
            target_lang: Target language code
            
        Returns:
            List of translation results
        """
        results = []
        
        for text in texts:
            result = self.translate(text, source_lang, target_lang)
            results.append(result)
        
        return results
    
    def is_supported_pair(self, source_lang: str, target_lang: str) -> bool:
        """Check if language pair is supported"""
        return (source_lang, target_lang) in self.PRIORITY_PAIRS or \
               (target_lang, source_lang) in self.PRIORITY_PAIRS
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes"""
        return list(self.LANGUAGE_CODES.values())
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for better translation"""
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Handle agricultural terms (preserve them)
        agricultural_terms = [
            'NPK', 'pH', 'GPS', 'AI', 'IoT', 'SMS', 'API'
        ]
        
        # This could be expanded with more preprocessing
        return text.strip()
    
    def _enhance_agricultural_translation(self, 
                                        result: Dict[str, any],
                                        source_lang: str,
                                        target_lang: str) -> Dict[str, any]:
        """Enhance translation with agricultural context"""
        enhanced = result.copy()
        
        # Agricultural term corrections
        agricultural_corrections = {
            ('en', 'hi'): {
                'crop': 'फसल',
                'farmer': 'किसान',
                'soil': 'मिट्टी',
                'water': 'पानी',
                'weather': 'मौसम'
            },
            ('en', 'ta'): {
                'crop': 'பயிர்',
                'farmer': 'விவசாயி', 
                'soil': 'மண்',
                'water': 'நீர்',
                'weather': 'வானிலை'
            }
        }
        
        # Apply corrections if available
        pair = (source_lang, target_lang)
        if pair in agricultural_corrections:
            translated = enhanced['translated_text']
            for en_term, local_term in agricultural_corrections[pair].items():
                if source_lang == 'en':
                    # This is a simplified approach - in practice, you'd need more sophisticated matching
                    pass
        
        enhanced['agricultural_enhanced'] = True
        return enhanced
    
    def get_model_info(self) -> Dict[str, any]:
        """Get model information"""
        # Check if models are cached locally
        cache_model_path = os.path.join(self.model_dir, "models--ai4bharat--indictrans2-en-indic-1B")
        simple_model_path = os.path.join(self.model_dir, "indictrans2-en-indic")
        local_model_available = os.path.exists(cache_model_path) or os.path.exists(simple_model_path)
        
        return {
            'model_dir': self.model_dir,
            'device': self.device,
            'indictrans2_loaded': self.model is not None,
            'fallback_loaded': self.fallback_model is not None,
            'supported_languages': self.get_supported_languages(),
            'priority_pairs': self.PRIORITY_PAIRS,
            'transformers_available': TRANSFORMERS_AVAILABLE,
            'local_model_available': local_model_available,
            'offline_ready': local_model_available and self.model is not None
        }
    
    def is_offline_ready(self) -> bool:
        """Check if model can work offline"""
        cache_model_path = os.path.join(self.model_dir, "models--ai4bharat--indictrans2-en-indic-1B")
        simple_model_path = os.path.join(self.model_dir, "indictrans2-en-indic")
        return (os.path.exists(cache_model_path) or os.path.exists(simple_model_path)) and self.model is not None


# Utility functions for agricultural translation

def get_agricultural_vocabulary() -> Dict[str, Dict[str, str]]:
    """Get agricultural vocabulary mappings"""
    return {
        'en': {
            'basic_terms': ['crop', 'farmer', 'soil', 'water', 'seed', 'harvest'],
            'diseases': ['blight', 'rust', 'mildew', 'wilt', 'rot'],
            'equipment': ['tractor', 'plow', 'harvester', 'sprayer'],
            'weather': ['rainfall', 'humidity', 'temperature', 'wind']
        },
        'hi': {
            'basic_terms': ['फसल', 'किसान', 'मिट्टी', 'पानी', 'बीज', 'फसल काटना'],
            'diseases': ['अंगमारी', 'जंग', 'फफूंदी', 'मुरझाना', 'सड़न'],
            'equipment': ['ट्रैक्टर', 'हल', 'फसल काटने की मशीन', 'छिड़काव मशीन'],
            'weather': ['वर्षा', 'नमी', 'तापमान', 'हवा']
        }
    }

def detect_agricultural_context(text: str) -> Dict[str, any]:
    """Detect agricultural context in text"""
    vocab = get_agricultural_vocabulary()
    
    context_scores = {}
    text_lower = text.lower()
    
    for category, terms in vocab.get('en', {}).items():
        score = sum(1 for term in terms if term in text_lower)
        context_scores[category] = score / len(terms) if terms else 0
    
    return {
        'is_agricultural': any(score > 0 for score in context_scores.values()),
        'category_scores': context_scores,
        'primary_category': max(context_scores.keys(), key=lambda k: context_scores[k]) if context_scores else None
    }
