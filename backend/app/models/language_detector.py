"""
AGRI AI Language Detection with Fallback Support

This module provides language detection capabilities with multiple fallback options:
1. FastText (if available)
2. Built-in heuristic detection
3. Basic pattern matching

Optimized for agricultural content and Indian languages.
"""

import os
import re
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logger = logging.getLogger(__name__)

class AGRILanguageDetector:
    """Enhanced language detection with agricultural context and fallback methods"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), 
            "..", "assets", 
            "fasttext", 
            "lid.176.bin"
        )
        self.fasttext_model = None
        self.fasttext_available = False
        
        # Try to initialize FastText
        self._try_initialize_fasttext()
        
        # Agricultural terminology patterns for enhanced detection
        self.agricultural_terms = {
            'en': [
                'crop', 'farm', 'soil', 'fertilizer', 'harvest', 'seed', 'plant', 
                'agriculture', 'irrigation', 'farming', 'cultivation', 'pesticide',
                'wheat', 'rice', 'corn', 'tomato', 'potato', 'onion', 'cotton'
            ],
            'hi': [
                'फसल', 'खेत', 'मिट्टी', 'उर्वरक', 'कटाई', 'बीज', 'पौधा', 'कृषि', 
                'सिंचाई', 'खेती', 'गेहूं', 'चावल', 'मक्का', 'टमाटर', 'आलू', 'प्याज'
            ],
            'ta': [
                'பயிர்', 'விவசாயம்', 'மண்', 'உரம்', 'அறுவடை', 'விதை', 'செடி',
                'நெல்', 'கோதுமை', 'சோளம்', 'தக்காளி', 'உருளைக்கிழங்கு'
            ],
            'te': [
                'పంట', 'వ్యవసాయం', 'మట్టి', 'ఎరువు', 'కోత', 'విత్తనం', 'మొక్క',
                'వరి', 'గోధుమ', 'మొక్కజొన్న', 'టమోట', 'బంగాళదుంప'
            ],
            'bn': [
                'ফসল', 'কৃষি', 'মাটি', 'সার', 'ফসল কাটা', 'বীজ', 'গাছ',
                'ধান', 'গম', 'ভুট্টা', 'টমেটো', 'আলু'
            ],
            'mr': [
                'पीक', 'शेती', 'माती', 'खत', 'कापणी', 'बियाणे', 'रोप',
                'भात', 'गहू', 'मका', 'टोमॅटो', 'बटाटा'
            ],
            'gu': [
                'પાક', 'ખેતી', 'માટી', 'ખાતર', 'લણણી', 'બીજ', 'છોડ',
                'ચોખા', 'ઘઉં', 'મકાઈ', 'ટામેટાં', 'બટાકા'
            ]
        }
        
        # Script patterns for Indian languages
        self.script_patterns = {
            'hi': re.compile(r'[\u0900-\u097F]+'),  # Devanagari
            'ta': re.compile(r'[\u0B80-\u0BFF]+'),  # Tamil
            'te': re.compile(r'[\u0C00-\u0C7F]+'),  # Telugu
            'bn': re.compile(r'[\u0980-\u09FF]+'),  # Bengali
            'gu': re.compile(r'[\u0A80-\u0AFF]+'),  # Gujarati
            'mr': re.compile(r'[\u0900-\u097F]+'),  # Marathi (Devanagari)
            'kn': re.compile(r'[\u0C80-\u0CFF]+'),  # Kannada
            'ml': re.compile(r'[\u0D00-\u0D7F]+'),  # Malayalam
            'pa': re.compile(r'[\u0A00-\u0A7F]+'),  # Punjabi (Gurmukhi)
            'or': re.compile(r'[\u0B00-\u0B7F]+'),  # Odia
        }
        
        # Language code mappings
        self.language_names = {
            'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
            'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati', 'kn': 'Kannada',
            'ml': 'Malayalam', 'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese',
            'ur': 'Urdu', 'ne': 'Nepali', 'si': 'Sinhala'
        }
    
    def _try_initialize_fasttext(self):
        """Try to initialize FastText model"""
        try:
            import fasttext
            
            logger.info(f"Looking for FastText model at: {self.model_path}")
            
            if os.path.exists(self.model_path):
                logger.info("FastText model file found, loading...")
                self.fasttext_model = fasttext.load_model(self.model_path)
                self.fasttext_available = True
                logger.info("FastText model loaded successfully")
            else:
                logger.info(f"FastText model not found at {self.model_path}, using robust fallback detection")
                self.fasttext_available = False
                
        except ImportError:
            logger.info("FastText not available, using robust fallback language detection")
            self.fasttext_available = False
        except Exception as e:
            logger.warning(f"Error loading FastText model: {e}")
            self.fasttext_available = False
    
    def _detect_with_fasttext(self, text: str) -> Dict[str, Any]:
        """Detect language using FastText model"""
        try:
            # Clean text for FastText
            cleaned_text = re.sub(r'[^\w\s]', ' ', text)
            cleaned_text = re.sub(r'\s+', ' ', cleaned_text.strip())
            
            if len(cleaned_text) < 2:
                return {'detected_language': 'en', 'confidence': 0.5}
            
            # Handle NumPy compatibility issues
            try:
                predictions = self.fasttext_model.predict(cleaned_text, k=3)
                labels, scores = predictions
                
                # Process FastText output
                detected_lang = labels[0].replace('__label__', '')
                confidence = float(scores[0])
                
                return {
                    'detected_language': detected_lang,
                    'confidence': confidence,
                    'method': 'fasttext'
                }
            except Exception as numpy_error:
                # Fall back to heuristics if NumPy issues occur
                logger.warning(f"FastText NumPy compatibility issue: {numpy_error}")
                return self._detect_with_heuristics(text)
            
        except Exception as e:
            logger.error(f"FastText detection failed: {e}")
            return self._detect_with_heuristics(text)
    
    def _detect_with_heuristics(self, text: str) -> Dict[str, Any]:
        """Enhanced fallback language detection using multiple heuristics"""
        text = text.strip()
        
        if not text:
            return {'detected_language': 'en', 'confidence': 0.3, 'method': 'fallback'}
        
        # Check script patterns first (most reliable)
        script_scores = {}
        
        for lang, pattern in self.script_patterns.items():
            matches = pattern.findall(text)
            if matches:
                # Calculate script coverage
                script_chars = len(''.join(matches))
                total_chars = len(re.sub(r'\s+', '', text))
                if total_chars > 0:
                    coverage = script_chars / total_chars
                    script_scores[lang] = coverage
        
        # If script detection found something with high confidence, use it
        if script_scores:
            best_script_lang = max(script_scores.items(), key=lambda x: x[1])
            if best_script_lang[1] > 0.2:  # 20% script coverage is sufficient
                return {
                    'detected_language': best_script_lang[0],
                    'confidence': min(0.9, best_script_lang[1] + 0.3),
                    'method': 'script_analysis'
                }
        
        # Check for agricultural terminology
        text_lower = text.lower()
        term_scores = {}
        
        for lang, terms in self.agricultural_terms.items():
            score = 0
            for term in terms:
                if term.lower() in text_lower:
                    score += 1
            
            if len(terms) > 0:
                term_scores[lang] = score / len(terms)
        
        # Enhanced English detection patterns
        english_patterns = [
            r'\b(the|and|or|but|in|on|at|to|for|of|with|by)\b',
            r'\b(is|are|was|were|am|be|been|being)\b',
            r'\b(have|has|had|do|does|did|will|would|could|should)\b',
            r'\b(this|that|these|those|what|where|when|why|how)\b'
        ]
        
        english_score = 0
        for pattern in english_patterns:
            matches = re.findall(pattern, text_lower)
            english_score += len(matches)
        
        # Normalize English score
        word_count = len(text_lower.split())
        if word_count > 0:
            english_normalized = english_score / word_count
            term_scores['en'] = max(term_scores.get('en', 0), english_normalized)
        
        # Combine script and terminology scores
        combined_scores = {}
        for lang in set(list(script_scores.keys()) + list(term_scores.keys())):
            script_score = script_scores.get(lang, 0)
            term_score = term_scores.get(lang, 0)
            # Weight script detection more heavily
            combined_scores[lang] = (script_score * 0.8) + (term_score * 0.2)
        
        if combined_scores:
            best_lang = max(combined_scores.items(), key=lambda x: x[1])
            confidence = min(0.85, max(0.4, best_lang[1] + 0.2))
            return {
                'detected_language': best_lang[0],
                'confidence': confidence,
                'method': 'enhanced_heuristic'
            }
        
        # Default to English with moderate confidence
        return {
            'detected_language': 'en',
            'confidence': 0.5,
            'method': 'default_fallback'
        }
    
    def detect_language(
        self, 
        text: str, 
        agricultural_context: bool = False
    ) -> Dict[str, Any]:
        """
        Detect language of given text
        
        Args:
            text: Input text to analyze
            agricultural_context: Whether to prioritize agricultural terms
            
        Returns:
            Dictionary containing detection results
        """
        if not text or not text.strip():
            return {
                'detected_language': 'en',
                'confidence': 0.3,
                'language_name': 'English',
                'alternative_languages': [],
                'method': 'empty_input'
            }
        
        # Use FastText if available
        if self.fasttext_available and self.fasttext_model:
            result = self._detect_with_fasttext(text)
        else:
            result = self._detect_with_heuristics(text)
        
        # Enhance with agricultural context if requested
        if agricultural_context:
            result = self._enhance_agricultural_context(text, result)
        
        # Add language name and format response
        detected_lang = result['detected_language']
        
        return {
            'detected_language': detected_lang,
            'confidence': result['confidence'],
            'language_name': self.language_names.get(detected_lang, detected_lang.title()),
            'alternative_languages': self._get_alternative_languages(text, detected_lang),
            'method': result.get('method', 'unknown'),
            'agricultural_enhanced': agricultural_context
        }
    
    def _enhance_agricultural_context(self, text: str, base_result: Dict) -> Dict:
        """Enhance detection with agricultural terminology"""
        text_lower = text.lower()
        
        # Check for agricultural terms in detected language
        detected_lang = base_result['detected_language']
        
        if detected_lang in self.agricultural_terms:
            ag_terms = self.agricultural_terms[detected_lang]
            found_terms = [term for term in ag_terms if term.lower() in text_lower]
            
            if found_terms:
                # Boost confidence for agricultural content
                enhanced_confidence = min(0.95, base_result['confidence'] + 0.1)
                base_result['confidence'] = enhanced_confidence
                base_result['agricultural_terms_found'] = found_terms
        
        return base_result
    
    def _get_alternative_languages(self, text: str, primary_lang: str) -> List[str]:
        """Get alternative language possibilities"""
        alternatives = []
        
        # Quick heuristic check for other languages
        for lang, pattern in self.script_patterns.items():
            if lang != primary_lang and pattern.search(text):
                alternatives.append(lang)
        
        return alternatives[:3]  # Return top 3 alternatives
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        return list(self.language_names.keys())
    
    def is_indian_language(self, language_code: str) -> bool:
        """Check if language is an Indian language"""
        indian_languages = {
            'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 
            'pa', 'or', 'as', 'ur', 'ne', 'si'
        }
        return language_code in indian_languages
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the language detection model"""
        return {
            'fasttext_available': self.fasttext_available,
            'model_path': self.model_path,
            'supported_languages': len(self.get_supported_languages()),
            'agricultural_enhanced': True,
            'fallback_methods': ['script_analysis', 'terminology_matching', 'heuristic_analysis']
        }


# Create global instance for easy access
_global_detector = None

def get_language_detector() -> AGRILanguageDetector:
    """Get or create global language detector instance"""
    global _global_detector
    if _global_detector is None:
        _global_detector = AGRILanguageDetector()
    return _global_detector


# Convenience functions for backward compatibility
def detect_language(text: str, agricultural_context: bool = False) -> Dict[str, Any]:
    """Convenience function for language detection"""
    detector = get_language_detector()
    return detector.detect_language(text, agricultural_context)


def get_supported_languages() -> List[str]:
    """Get supported languages"""
    detector = get_language_detector()
    return detector.get_supported_languages()


# For compatibility with existing FastTextLanguageDetector class name
FastTextLanguageDetector = AGRILanguageDetector
