"""
Hybrid LLM Model Wrapper for AGRI AI

This module provides AI inference with Gemini 2.5 Flash as primary
and Ollama as backup for agricultural question answering and advice.
"""

import os
import json
import requests
import logging
from typing import Dict, List, Optional, Any

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("Google Generative AI not installed. Install with: pip install google-generativeai")

logger = logging.getLogger(__name__)

class HybridLLM:
    def get_chat_history(self, user_id: str) -> list:
        """
        Return per-user chat history in frontend-compatible format
        """
        history = []
        if self.redis_client:
            try:
                history_key = f"chat_history:{user_id}"
                history_json = self.redis_client.get(history_key)
                if history_json:
                    raw = json.loads(history_json)
                    # Convert to frontend Message format
                    for idx, msg in enumerate(raw):
                        # Gemini/Ollama history: {'role': 'user'/'assistant', 'content': ...}
                        history.append({
                            'id': str(idx),
                            'text': msg.get('content', ''),
                            'isUser': msg.get('role', '') == 'user',
                            'timestamp': None,  # Optionally add timestamp if available
                            'audioUrl': msg.get('audioUrl', None)
                        })
            except Exception as e:
                logger.warning(f"Failed to get chat history for user {user_id}: {e}")
        return history
    """
    Hybrid LLM manager with Gemini 2.5 Flash primary and Ollama backup
    """
    
    # Recommended Ollama models for agricultural use
    OLLAMA_MODELS = {
        'llama3': {
            'model_name': 'llama3:8b',
            'description': 'Latest LLaMA 3 model with improved reasoning',
            'size': '4.7GB',
            'languages': ['en']
        },
        'llama2': {
            'model_name': 'llama2:7b',
            'description': 'General purpose model, good for basic queries',
            'size': '3.8GB',
            'languages': ['en']
        },
        'mistral': {
            'model_name': 'mistral:7b',
            'description': 'Fast and efficient for quick responses',
            'size': '4.1GB',
            'languages': ['en']
        }
    }
    
    # Default agricultural system prompt
    AGRICULTURAL_SYSTEM_PROMPT = """You are an expert agricultural AI assistant helping farmers with:
- Crop management and cultivation advice
- Plant disease identification and treatment
- Soil health and fertilization guidance  
- Weather-based farming recommendations
- Irrigation and water management
- Pest control strategies
- Harvest timing and post-harvest handling
- Sustainable farming practices

Provide practical, actionable advice based on scientific agricultural knowledge.
Keep responses clear, concise, and appropriate for farmers of all experience levels.
When discussing treatments or chemicals, always emphasize safety precautions."""

    def __init__(self, 
                 gemini_api_key: Optional[str] = os.getenv('GEMINI_API_KEY'),
                 ollama_base_url: str = "http://localhost:11434",
                 ollama_model: str = "llama3:8b",
                 timeout: int = 300,
                 prefer_gemini: bool = True):
        """
        Initialize Hybrid LLM client
        
        Args:
            gemini_api_key: Google Gemini API key (primary)
            ollama_base_url: Ollama server URL (backup)
            ollama_model: Ollama model name (backup)
            timeout: Request timeout in seconds
            prefer_gemini: Whether to prefer Gemini over Ollama when both available
        """
        # Gemini setup (primary)
        self.gemini_api_key = gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.gemini_available = False
        self.gemini_model = None
        self.prefer_gemini = prefer_gemini
        
        if GEMINI_AVAILABLE and self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
                self.gemini_available = self._check_gemini_connection()
                logger.info(f"Gemini 2.0 Flash initialized: {self.gemini_available}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")
                
        # Ollama setup (backup)
        self.ollama_base_url = ollama_base_url.rstrip('/')
        self.ollama_model = ollama_model
        self.timeout = timeout
        self.ollama_available = self._check_ollama_connection()
        
        # Common settings
        self.conversation_history = []
        self.system_prompt = self.AGRICULTURAL_SYSTEM_PROMPT
        self.redis_client = None
        
        # Initialize Redis if available
        try:
            from app.database.mongodb import get_redis_client
            self.redis_client = get_redis_client()
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
        
        # Determine active model
        self.active_model = self._determine_active_model()
        logger.info(f"Active model: {self.active_model}")
        
    def _check_gemini_connection(self) -> bool:
        """Check if Gemini API is accessible"""
        try:
            if not self.gemini_model:
                return False
            # Test with a simple prompt
            test_response = self.gemini_model.generate_content("Hello", 
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=10,
                    temperature=0.1
                ))
            return test_response.text is not None
        except Exception as e:
            logger.warning(f"Gemini connection failed: {e}")
            return False
    
    def _check_ollama_connection(self) -> bool:
        """Check if Ollama server is running"""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                logger.info("Connected to Ollama server successfully")
                return True
            else:
                logger.warning(f"Ollama server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.warning(f"Cannot connect to Ollama server: {e}")
            return False
    
    def _determine_active_model(self) -> str:
        """Determine which model to use"""
        if self.prefer_gemini and self.gemini_available:
            return "gemini-2.0-flash"
        elif self.ollama_available:
            return f"ollama-{self.ollama_model}"
        elif self.gemini_available:
            return "gemini-2.0-flash"
        else:
            return "none"
    
    def _retry_with_fallback(func):
        """Decorator to retry with fallback model"""
        def wrapper(self, *args, **kwargs):
            try:
                # Try primary model first
                if self.prefer_gemini and self.gemini_available:
                    try:
                        return func(self, *args, use_model="gemini", **kwargs)
                    except Exception as e:
                        logger.warning(f"Gemini failed, falling back to Ollama: {e}")
                        if self.ollama_available:
                            return func(self, *args, use_model="ollama", **kwargs)
                        raise e
                else:
                    # Try Ollama first
                    try:
                        if self.ollama_available:
                            return func(self, *args, use_model="ollama", **kwargs)
                        else:
                            return func(self, *args, use_model="gemini", **kwargs)
                    except Exception as e:
                        logger.warning(f"Ollama failed, falling back to Gemini: {e}")
                        if self.gemini_available:
                            return func(self, *args, use_model="gemini", **kwargs)
                        raise e
            except Exception as e:
                return {
                    'success': False, 
                    'response': f'Both models failed: {str(e)}', 
                    'error': str(e),
                    'model': 'none'
                }
        return wrapper

    @_retry_with_fallback
    def chat(self, message: str, context: Optional[Dict[str, Any]] = None, 
             stream: bool = False, temperature: float = 0.7, 
             max_tokens: Optional[int] = None, user_id: Optional[str] = None,
             use_model: str = "auto") -> Dict[str, Any]:
        """
        Chat with AI using primary model with fallback
        """
        # Load per-user chat history from Redis
        if user_id and self.redis_client:
            try:
                history_key = f"chat_history:{user_id}"
                history_json = self.redis_client.get(history_key)
                if history_json:
                    self.conversation_history = json.loads(history_json)
                else:
                    self.conversation_history = []
            except Exception as e:
                logger.warning(f"Failed to load chat history for user {user_id}: {e}")
        # Store user context in Redis if provided
        if user_id and self.redis_client and context:
            try:
                user_data_key = f"user_context:{user_id}"
                # Store context data for this user
                for key, value in context.items():
                    if isinstance(value, (str, int, float)):
                        self.redis_client.hset(user_data_key, key, str(value))
                # Set expiration (24 hours)
                self.redis_client.expire(user_data_key, 86400)
            except Exception as e:
                logger.warning(f"Failed to store user context in Redis: {e}")
        enhanced_message = self._enhance_message_with_context(message, context)
        if use_model == "gemini" and self.gemini_available:
            result = self._chat_with_gemini(enhanced_message, temperature, max_tokens)
        elif use_model == "ollama" and self.ollama_available:
            result = self._chat_with_ollama(enhanced_message, stream, temperature, max_tokens)
        else:
            raise Exception(f"Requested model {use_model} not available")
        # Save updated chat history to Redis
        if user_id and self.redis_client:
            try:
                history_key = f"chat_history:{user_id}"
                self.redis_client.set(history_key, json.dumps(self.conversation_history), ex=86400)
            except Exception as e:
                logger.warning(f"Failed to save chat history for user {user_id}: {e}")
        return result
    
    def _chat_with_gemini(self, message: str, temperature: float = 0.7, 
                         max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Chat with Gemini model"""
        try:
            # Build conversation for Gemini
            conversation_text = self._build_gemini_conversation(message)
            
            generation_config = genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens or 1000,
                top_p=0.9,
                top_k=40
            )
            
            response = self.gemini_model.generate_content(
                conversation_text,
                generation_config=generation_config
            )
            
            ai_message = response.text
            
            # Update conversation history
            self.conversation_history.append({'role': 'user', 'content': message})
            self.conversation_history.append({'role': 'assistant', 'content': ai_message})
            
            # Keep conversation history manageable
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            return {
                'success': True, 
                'response': ai_message, 
                'model': 'gemini-2.0-flash'
            }
            
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            raise e
    
    def _chat_with_ollama(self, message: str, stream: bool = False, 
                         temperature: float = 0.7, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """Chat with Ollama model"""
        try:
            payload = {
                "model": self.ollama_model,
                "messages": self._build_ollama_messages(message),
                "stream": stream,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens or 1000,
                    "top_p": 0.9,
                    "top_k": 40
                }
            }
            
            response = requests.post(
                f"{self.ollama_base_url}/api/chat", 
                json=payload, 
                timeout=self.timeout
            )
            response.raise_for_status()
            
            result = response.json()
            ai_message = result.get('message', {}).get('content', '')
            
            # Update conversation history
            self.conversation_history.append({'role': 'user', 'content': message})
            self.conversation_history.append({'role': 'assistant', 'content': ai_message})
            
            # Keep conversation history manageable
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            return {
                'success': True, 
                'response': ai_message, 
                'model': f'ollama-{self.ollama_model}'
            }
            
        except Exception as e:
            logger.error(f"Ollama chat error: {e}")
            raise e
    
    def _build_gemini_conversation(self, message: str) -> str:
        """Build conversation text for Gemini"""
        conversation_parts = [f"System: {self.system_prompt}"]
        
        # Add recent conversation history
        for msg in self.conversation_history[-10:]:
            role = "Human" if msg['role'] == 'user' else "Assistant"
            conversation_parts.append(f"{role}: {msg['content']}")
        
        conversation_parts.append(f"Human: {message}")
        conversation_parts.append("Assistant:")
        
        return "\n\n".join(conversation_parts)
    
    def _build_ollama_messages(self, message: str) -> List[Dict[str, str]]:
        """Build message array for Ollama"""
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(self.conversation_history[-10:])
        messages.append({"role": "user", "content": message})
        return messages
    
    def _enhance_message_with_context(self, message: str, context: Optional[Dict[str, Any]]) -> str:
        """Enhance message with context information"""
        if not context:
            return message
            
        context_parts = []
        for key in ['location', 'crop_type', 'season', 'weather', 'farm_size', 'soil_type']:
            if key in context:
                context_parts.append(f"{key.replace('_', ' ').title()}: {context[key]}")
        
        if 'user_data' in context:
            user_data = context['user_data']
            if isinstance(user_data, dict):
                for key, value in user_data.items():
                    context_parts.append(f"{key.replace('_', ' ').title()}: {value}")
        
        if context_parts:
            context_str = " | ".join(context_parts)
            return f"Context: {context_str}\n\nQuestion: {message}"
        
        return message

    def get_agricultural_advice(self, query: str, category: str = "general", 
                               location: Optional[str] = None, crop: Optional[str] = None, 
                               user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get specific agricultural advice with fallback support
        """
        specialized_prompts = {
            'crop': f"As a crop specialist, provide detailed advice about: {query}",
            'soil': f"As a soil scientist, provide soil management advice for: {query}",
            'pest': f"As a pest management expert, provide IPM advice for: {query}",
            'disease': f"As a plant pathologist, provide disease management advice for: {query}",
            'weather': f"As an agricultural meteorologist, provide weather-based advice for: {query}",
            'irrigation': f"As an irrigation specialist, provide water management advice for: {query}",
            'fertilizer': f"As a soil fertility expert, provide fertilization advice for: {query}",
            'harvest': f"As a post-harvest specialist, provide harvest and storage advice for: {query}"
        }
        
        specialized_query = specialized_prompts.get(category, query)
        context = {'category': category}
        
        # Get user data from Redis if user_id provided
        if user_id and self.redis_client:
            try:
                user_data_key = f"user_data:{user_id}"
                user_data = self.redis_client.hgetall(user_data_key)
                if user_data:
                    context['user_data'] = user_data
                    # Use location/crop from user_data if not provided
                    if not location and user_data.get('location'):
                        location = user_data['location']
                    if not crop and user_data.get('crop_type'):
                        crop = user_data['crop_type']
            except Exception as e:
                logger.warning(f"Failed to get user data from Redis: {e}")
        
        if location:
            context['location'] = location
        if crop:
            context['crop_type'] = crop
        
        result = self.chat(specialized_query, context=context)
        
        if result.get('success'):
            result['advice_category'] = category
            result['agricultural_context'] = context
            result['model_used'] = result.get('model', self.active_model)
        
        return result
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all available models"""
        return {
            'gemini': {
                'available': self.gemini_available,
                'model': 'gemini-2.0-flash' if self.gemini_available else None,
                'api_key_configured': bool(self.gemini_api_key)
            },
            'ollama': {
                'available': self.ollama_available,
                'model': self.ollama_model if self.ollama_available else None,
                'base_url': self.ollama_base_url
            },
            'active_model': self.active_model,
            'prefer_gemini': self.prefer_gemini,
            'conversation_length': len(self.conversation_history)
        }
    
    def switch_preference(self, prefer_gemini: bool = True):
        """Switch model preference"""
        self.prefer_gemini = prefer_gemini
        self.active_model = self._determine_active_model()
        logger.info(f"Switched preference. Active model: {self.active_model}")
    
    def clear_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def test_connectivity(self) -> Dict[str, Any]:
        """Test connectivity to both models"""
        results = {}
        
        # Test Gemini
        if GEMINI_AVAILABLE and self.gemini_api_key:
            try:
                test_response = self._chat_with_gemini("Hello, just testing connectivity", temperature=0.1)
                results['gemini'] = {
                    'status': 'connected',
                    'response_length': len(test_response.get('response', '')),
                    'model': 'gemini-2.0-flash-exp'
                }
            except Exception as e:
                results['gemini'] = {
                    'status': 'failed',
                    'error': str(e),
                    'model': 'gemini-2.0-flash-exp'
                }
        else:
            results['gemini'] = {
                'status': 'not_configured',
                'model': 'gemini-2.0-flash-exp'
            }
        
        # Test Ollama
        try:
            test_response = self._chat_with_ollama("Hello, just testing connectivity", temperature=0.1)
            results['ollama'] = {
                'status': 'connected',
                'response_length': len(test_response.get('response', '')),
                'model': self.ollama_model
            }
        except Exception as e:
            results['ollama'] = {
                'status': 'failed',
                'error': str(e),
                'model': self.ollama_model
            }
        
        return results


# Create alias for backward compatibility
OllamaLLM = HybridLLM

# Utility functions
def get_agricultural_prompt_templates() -> Dict[str, str]:
    """Get pre-built prompt templates for agricultural queries"""
    return {
        'disease_diagnosis': """Based on the following symptoms: {symptoms}
Crop: {crop}
Location: {location}
Please provide:
1. Most likely disease(s)
2. Immediate treatment steps
3. Prevention measures
4. When to seek expert help""",
        
        'fertilizer_recommendation': """For the following crop and conditions:
Crop: {crop}
Soil type: {soil_type}
Growth stage: {stage}
Location: {location}
Please recommend:
1. Appropriate fertilizer type and ratio
2. Application timing and method
3. Dosage per acre
4. Safety precautions""",
        
        'pest_management': """For pest control in:
Crop: {crop}
Pest observed: {pest}
Severity: {severity}
Location: {location}
Please provide:
1. IPM strategy
2. Biological control options
3. Chemical control if necessary
4. Prevention for next season""",
        
        'irrigation_planning': """For irrigation planning:
Crop: {crop}
Soil type: {soil_type}
Season: {season}
Water source: {water_source}
Please advise:
1. Irrigation frequency
2. Water quantity per application
3. Best irrigation method
4. Water conservation tips"""
    }

def format_agricultural_query(template_name: str, **kwargs) -> str:
    """Format agricultural query using templates"""
    templates = get_agricultural_prompt_templates()
    
    if template_name not in templates:
        return kwargs.get('query', '')
    
    try:
        return templates[template_name].format(**kwargs)
    except KeyError as e:
        logger.warning(f"Missing parameter for template {template_name}: {e}")
        return kwargs.get('query', '')
