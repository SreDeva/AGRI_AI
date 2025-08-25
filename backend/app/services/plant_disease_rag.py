"""
Plant Disease RAG Service for AGRI AI

This service provides plant disease diagnosis using FAISS vector search
and image similarity matching with LLM-powered recommendations.
"""

import os
import csv
import json
import logging
import numpy as np
import faiss
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import tempfile

# Import LLM model
try:
    import sys
    import os
    # Add backend directory to path for imports
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.append(backend_dir)
    
    from app.models.llm_ollama import HybridLLM
    LLM_AVAILABLE = True
except ImportError as e:
    LLM_AVAILABLE = False
    logging.warning(f"LLM model not available: {e}. Install dependencies or check import path.")

logger = logging.getLogger(__name__)

class PlantDiseaseRAG:
    """Plant Disease Retrieval-Augmented Generation Service"""
    
    def __init__(self, 
                 base_dir: str = ".",
                 faiss_index_path: str = "plant_disease_index.faiss",
                 metadata_path: str = "plant_disease_index_metadata.csv",
                 initialize_llm: bool = True):
        """
        Initialize Plant Disease RAG service
        
        Args:
            base_dir: Base directory containing index files
            faiss_index_path: Path to FAISS index file
            metadata_path: Path to metadata CSV file
            initialize_llm: Whether to initialize LLM for recommendations
        """
        self.base_dir = Path(base_dir)
        self.faiss_index_path = self.base_dir / faiss_index_path
        self.metadata_path = self.base_dir / metadata_path
        self.index = None
        self.metadata = []
        self.model = None
        self.index_type = "unknown"
        self.llm = None
        
        # Load index and metadata
        self._load_index()
        self._load_metadata()
        self._load_embedding_model()
        
        # Initialize LLM if requested and available
        if initialize_llm and LLM_AVAILABLE:
            self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the LLM for generating recommendations"""
        try:
            # Initialize with agricultural-specific system prompt
            agricultural_prompt = """You are an expert agricultural AI specializing in plant disease diagnosis and treatment recommendations. 

When providing treatment recommendations, always respond in valid JSON format with these exact fields:
{
    "primary_diagnosis": "clear diagnosis statement",
    "confidence": "high/medium/low",
    "recommendations": ["list of 4-6 specific treatment steps"],
    "preventive_measures": ["list of 4-6 prevention strategies"],
    "fertilizer_advice": "specific fertilizer recommendation",
    "urgency": "low/medium/high"
}

Provide practical, science-based advice that farmers can implement. Consider:
- Immediate actions needed
- Chemical vs organic treatment options
- Environmental management
- Safety precautions
- Cost-effective solutions
- Local availability of treatments

Always prioritize farmer safety and environmental sustainability."""

            self.llm = HybridLLM(
                prefer_gemini=True,
                timeout=60
            )
            
            # Set agricultural system prompt
            self.llm.system_prompt = agricultural_prompt
            
            logger.info("LLM initialized successfully for plant disease recommendations")
            
        except Exception as e:
            logger.warning(f"Failed to initialize LLM: {e}")
            self.llm = None
    
    def _load_index(self):
        """Load FAISS index"""
        try:
            if self.faiss_index_path.exists():
                self.index = faiss.read_index(str(self.faiss_index_path))
                logger.info(f"Loaded FAISS index from {self.faiss_index_path}")
                
                # Check index type
                index_info_path = self.base_dir / "plant_disease_index_type.json"
                if index_info_path.exists():
                    try:
                        info = json.loads(index_info_path.read_text(encoding="utf-8"))
                        self.index_type = info.get("type", "sbert")
                    except Exception:
                        self.index_type = "sbert"
                else:
                    self.index_type = "sbert"
                    
                logger.info(f"Index type: {self.index_type}")
            else:
                logger.warning(f"FAISS index not found at {self.faiss_index_path}")
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
    
    def _load_metadata(self):
        """Load metadata CSV"""
        try:
            if self.metadata_path.exists():
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    self.metadata = list(reader)
                logger.info(f"Loaded {len(self.metadata)} metadata entries")
            else:
                logger.warning(f"Metadata file not found at {self.metadata_path}")
        except Exception as e:
            logger.error(f"Failed to load metadata: {e}")
    
    def _load_embedding_model(self):
        """Load embedding model based on index type"""
        try:
            if self.index_type == "tfidf":
                # Load TF-IDF vectorizer
                import pickle
                vectorizer_path = self.base_dir / "plant_disease_vectorizer.pkl"
                if vectorizer_path.exists():
                    with open(vectorizer_path, 'rb') as f:
                        self.model = pickle.load(f)
                    logger.info("Loaded TF-IDF vectorizer")
                else:
                    logger.warning("TF-IDF vectorizer not found")
            else:
                # Load sentence transformer
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
                logger.info("Loaded SentenceTransformer model")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
    
    def search_similar_diseases(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar plant diseases based on text query
        
        Args:
            query: Text description of symptoms or disease
            top_k: Number of results to return
            
        Returns:
            List of similar disease cases with metadata
        """
        if not self.index or not self.model or not self.metadata:
            logger.error("RAG service not properly initialized")
            return []
        
        try:
            # Generate query embedding
            if self.index_type == "tfidf":
                from sklearn.preprocessing import normalize
                q_vec = self.model.transform([query])
                q_vec = normalize(q_vec)
                query_embedding = q_vec.toarray().astype('float32')
            else:
                query_embedding = self.model.encode([query], 
                                                  normalize_embeddings=True, 
                                                  convert_to_numpy=True).astype("float32")
            
            # Search FAISS index
            scores, indices = self.index.search(query_embedding, top_k)
            
            # Compile results
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < len(self.metadata):
                    result = {
                        "score": float(score),
                        "crop": self.metadata[idx]["crop"],
                        "condition": self.metadata[idx]["condition"],
                        "is_healthy": self.metadata[idx]["is_healthy"].lower() == "true",
                        "class_name": self.metadata[idx]["class_name"],
                        "image_path": self.metadata[idx].get("image_path", ""),
                        "text": self.metadata[idx].get("text", ""),
                        "metadata_id": idx
                    }
                    results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in disease search: {e}")
            return []
    
    def analyze_image_symptoms(self, image_path: str) -> str:
        """
        Analyze image and generate symptom description
        
        Args:
            image_path: Path to the uploaded image
            
        Returns:
            Text description of observed symptoms
        """
        try:
            # Basic image analysis - this is a placeholder
            # In a real implementation, you might use computer vision
            # to detect leaf spots, discoloration, etc.
            
            # For now, we'll return a generic description
            # that can be enhanced with actual CV analysis
            return (
                "Plant leaf showing potential disease symptoms. "
                "Analyzing for spots, discoloration, wilting, or other abnormalities. "
                "Please provide additional context about the crop type and observed symptoms."
            )
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            return "Unable to analyze image automatically. Please describe the symptoms you observe."
    
    def get_treatment_recommendations(self, disease_matches: List[Dict[str, Any]], 
                                    crop_type: str = None, user_id: str = None) -> Dict[str, Any]:
        """
        Generate treatment recommendations using LLM based on disease matches
        
        Args:
            disease_matches: List of matched diseases from search
            crop_type: Type of crop (optional)
            user_id: User ID for personalized recommendations
            
        Returns:
            LLM-generated treatment recommendations and advice
        """
        # Use the initialized LLM if available
        llm_model = self.llm
        
        if not disease_matches:
            # Fallback for no matches - still use LLM if available
            if llm_model:
                fallback_prompt = f"""
                No specific disease matches found for the plant image analysis.
                Crop type: {crop_type or 'Unknown'}
                
                Please provide general plant health recommendations in JSON format:
                {{
                    "primary_diagnosis": "Unable to identify specific disease",
                    "confidence": "low",
                    "recommendations": ["list of 3-5 treatment steps"],
                    "preventive_measures": ["list of 3-5 prevention strategies"],
                    "fertilizer_advice": "specific fertilizer recommendation",
                    "urgency": "low/medium/high"
                }}
                """
                try:
                    llm_response = llm_model.chat(
                        fallback_prompt, 
                        user_id=user_id,
                        context={"task": "general_plant_health", "crop": crop_type}
                    )
                    if llm_response.get('success'):
                        return self._parse_llm_recommendations(llm_response['response'])
                except Exception as e:
                    logger.warning(f"LLM fallback failed: {e}")
            
            # Hard fallback if LLM fails
            return {
                "primary_diagnosis": "Unable to identify specific disease",
                "confidence": "low",
                "recommendations": ["Consult with a local agricultural expert"],
                "preventive_measures": ["Maintain good crop hygiene", "Ensure proper spacing"],
                "fertilizer_advice": "Use balanced NPK fertilizer as per soil test",
                "urgency": "medium",
                "llm_analysis": "LLM analysis not available"
            }
        
        # Get the most likely diagnosis
        primary_match = disease_matches[0]
        crop = crop_type or primary_match["crop"]
        condition = primary_match["condition"]
        is_healthy = primary_match["is_healthy"]
        
        # Build context from similar cases for LLM
        similar_cases_context = []
        for i, match in enumerate(disease_matches[:3]):
            similar_cases_context.append(
                f"Case {i+1}: {match['crop']} with {match['condition']} (similarity: {match['score']:.2f})"
            )
        
        # Create comprehensive prompt for LLM
        if is_healthy:
            llm_prompt = f"""
            Analysis shows a healthy {crop} leaf with high confidence.
            Similar healthy cases found:
            {chr(10).join(similar_cases_context)}
            
            Please provide maintenance recommendations in JSON format:
            {{
                "primary_diagnosis": "Healthy {crop} leaf",
                "confidence": "high",
                "recommendations": ["list of 3-5 maintenance practices"],
                "preventive_measures": ["list of 3-5 disease prevention strategies"],
                "fertilizer_advice": "specific fertilizer recommendation for healthy {crop}",
                "urgency": "low"
            }}
            """
        else:
            llm_prompt = f"""
            Plant disease diagnosis based on image analysis and database matching:
            
            Primary diagnosis: {crop} - {condition}
            Confidence level: {"high" if primary_match["score"] > 0.7 else "medium"}
            
            Similar cases found in database:
            {chr(10).join(similar_cases_context)}
            
            Please provide comprehensive treatment recommendations in JSON format:
            {{
                "primary_diagnosis": "{crop} - {condition}",
                "confidence": "{"high" if primary_match["score"] > 0.7 else "medium"}",
                "recommendations": ["list of 4-6 specific treatment steps"],
                "preventive_measures": ["list of 4-6 prevention strategies"],
                "fertilizer_advice": "specific fertilizer recommendation for this condition",
                "urgency": "low/medium/high based on disease severity"
            }}
            
            Consider:
            - Immediate treatment actions
            - Chemical/organic treatment options
            - Environmental management
            - Timing of treatments
            - Safety precautions
            - Follow-up monitoring
            """
        
        # Get LLM recommendations
        if llm_model:
            try:
                llm_response = llm_model.chat(
                    llm_prompt,
                    user_id=user_id,
                    context={
                        "domain": "agriculture",
                        "task": "disease_treatment",
                        "crop": crop,
                        "condition": condition,
                        "healthy": is_healthy
                    }
                )
                
                if llm_response.get('success'):
                    recommendations = self._parse_llm_recommendations(llm_response['response'])
                    
                    # Add similar cases to the response
                    recommendations["similar_cases"] = [
                        {
                            "crop": match["crop"],
                            "condition": match["condition"],
                            "similarity": f"{match['score']:.2f}"
                        }
                        for match in disease_matches[:3]
                    ]
                    
                    # Add model information
                    recommendations["model_used"] = llm_response.get('model', 'unknown')
                    
                    return recommendations
                else:
                    logger.warning(f"LLM recommendation failed: {llm_response.get('error')}")
                    
            except Exception as e:
                logger.error(f"Error getting LLM recommendations: {e}")
        
        # Fallback to basic recommendations if LLM fails
        return self._get_fallback_recommendations(crop, condition, disease_matches)
        """
        Generate treatment recommendations using LLM based on disease matches
        
        Args:
            disease_matches: List of matched diseases from search
            crop_type: Type of crop (optional)
            llm_model: LLM instance for generating recommendations
            
        Returns:
            LLM-generated treatment recommendations and advice
        """
        if not disease_matches:
            # Fallback for no matches - still use LLM if available
            if llm_model:
                fallback_prompt = f"""
                No specific disease matches found for the plant image analysis.
                Crop type: {crop_type or 'Unknown'}
                
                Please provide general plant health recommendations in JSON format:
                {{
                    "primary_diagnosis": "Unable to identify specific disease",
                    "confidence": "low",
                    "recommendations": ["list of 3-5 treatment steps"],
                    "preventive_measures": ["list of 3-5 prevention strategies"],
                    "fertilizer_advice": "specific fertilizer recommendation",
                    "urgency": "low/medium/high"
                }}
                """
                try:
                    llm_response = llm_model.chat(fallback_prompt)
                    if llm_response.get('success'):
                        return self._parse_llm_recommendations(llm_response['response'])
                except Exception as e:
                    logger.warning(f"LLM fallback failed: {e}")
            
            # Hard fallback if LLM fails
            return {
                "primary_diagnosis": "Unable to identify specific disease",
                "confidence": "low",
                "recommendations": ["Consult with a local agricultural expert"],
                "preventive_measures": ["Maintain good crop hygiene", "Ensure proper spacing"],
                "fertilizer_advice": "Use balanced NPK fertilizer as per soil test",
                "urgency": "medium"
            }
        
        # Get the most likely diagnosis
        primary_match = disease_matches[0]
        crop = crop_type or primary_match["crop"]
        condition = primary_match["condition"]
        is_healthy = primary_match["is_healthy"]
        
        # Build context from similar cases for LLM
        similar_cases_context = []
        for i, match in enumerate(disease_matches[:3]):
            similar_cases_context.append(
                f"Case {i+1}: {match['crop']} with {match['condition']} (similarity: {match['score']:.2f})"
            )
        
        # Create comprehensive prompt for LLM
        if is_healthy:
            llm_prompt = f"""
            Analysis shows a healthy {crop} leaf with high confidence.
            Similar healthy cases found:
            {chr(10).join(similar_cases_context)}
            
            Please provide maintenance recommendations in JSON format:
            {{
                "primary_diagnosis": "Healthy {crop} leaf",
                "confidence": "high",
                "recommendations": ["list of 3-5 maintenance practices"],
                "preventive_measures": ["list of 3-5 disease prevention strategies"],
                "fertilizer_advice": "specific fertilizer recommendation for healthy {crop}",
                "urgency": "low"
            }}
            """
        else:
            llm_prompt = f"""
            Plant disease diagnosis based on image analysis and database matching:
            
            Primary diagnosis: {crop} - {condition}
            Confidence level: {"high" if primary_match["score"] > 0.7 else "medium"}
            
            Similar cases found in database:
            {chr(10).join(similar_cases_context)}
            
            Please provide comprehensive treatment recommendations in JSON format:
            {{
                "primary_diagnosis": "{crop} - {condition}",
                "confidence": "{"high" if primary_match["score"] > 0.7 else "medium"}",
                "recommendations": ["list of 4-6 specific treatment steps"],
                "preventive_measures": ["list of 4-6 prevention strategies"],
                "fertilizer_advice": "specific fertilizer recommendation for this condition",
                "urgency": "low/medium/high based on disease severity"
            }}
            
            Consider:
            - Immediate treatment actions
            - Chemical/organic treatment options
            - Environmental management
            - Timing of treatments
            - Safety precautions
            - Follow-up monitoring
            """
        
        # Get LLM recommendations
        if llm_model:
            try:
                llm_response = llm_model.chat(
                    llm_prompt,
                    context={
                        "domain": "agriculture",
                        "task": "disease_treatment",
                        "crop": crop,
                        "condition": condition
                    }
                )
                
                if llm_response.get('success'):
                    recommendations = self._parse_llm_recommendations(llm_response['response'])
                    
                    # Add similar cases to the response
                    recommendations["similar_cases"] = [
                        {
                            "crop": match["crop"],
                            "condition": match["condition"],
                            "similarity": f"{match['score']:.2f}"
                        }
                        for match in disease_matches[:3]
                    ]
                    
                    return recommendations
                else:
                    logger.warning(f"LLM recommendation failed: {llm_response.get('error')}")
                    
            except Exception as e:
                logger.error(f"Error getting LLM recommendations: {e}")
        
        # Fallback to basic recommendations if LLM fails
        return self._get_fallback_recommendations(crop, condition, disease_matches)
    
    def _parse_llm_recommendations(self, llm_response: str) -> Dict[str, Any]:
        """
        Parse LLM response and extract recommendations
        
        Args:
            llm_response: Raw LLM response text
            
        Returns:
            Parsed recommendations dictionary
        """
        try:
            # Try to extract JSON from the response
            import re
            
            # Look for JSON block in the response
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                recommendations = json.loads(json_str)
                
                # Validate required fields
                required_fields = ["primary_diagnosis", "confidence", "recommendations", 
                                 "preventive_measures", "fertilizer_advice"]
                
                for field in required_fields:
                    if field not in recommendations:
                        recommendations[field] = f"Not specified in LLM response"
                
                # Ensure urgency field
                if "urgency" not in recommendations:
                    recommendations["urgency"] = "medium"
                
                # Add LLM analysis if not present
                if "llm_analysis" not in recommendations:
                    recommendations["llm_analysis"] = llm_response
                
                return recommendations
            else:
                # If no JSON found, parse as text and structure it
                return self._structure_text_response(llm_response)
                
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse LLM JSON response: {e}")
            return self._structure_text_response(llm_response)
        except Exception as e:
            logger.error(f"Error parsing LLM recommendations: {e}")
            return self._structure_text_response(llm_response)
    
    def _structure_text_response(self, text_response: str) -> Dict[str, Any]:
        """
        Structure a text response into recommendation format
        
        Args:
            text_response: Free-form text response from LLM
            
        Returns:
            Structured recommendations dictionary
        """
        # Basic text parsing to extract information
        lines = text_response.split('\n')
        
        recommendations = []
        preventive_measures = []
        fertilizer_advice = "Apply balanced fertilizer as recommended"
        urgency = "medium"
        
        # Simple parsing logic
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Look for section headers
            if any(keyword in line.lower() for keyword in ['treatment', 'recommend', 'apply']):
                current_section = 'recommendations'
            elif any(keyword in line.lower() for keyword in ['prevent', 'avoid', 'maintain']):
                current_section = 'preventive_measures'
            elif any(keyword in line.lower() for keyword in ['fertilizer', 'nutrient', 'npk']):
                fertilizer_advice = line
                current_section = None
            elif any(keyword in line.lower() for keyword in ['urgent', 'immediate', 'critical']):
                urgency = "high"
                current_section = None
            elif line.startswith('-') or line.startswith('•') or line.startswith('*'):
                # Bullet points
                clean_line = line.lstrip('- •*').strip()
                if current_section == 'recommendations':
                    recommendations.append(clean_line)
                elif current_section == 'preventive_measures':
                    preventive_measures.append(clean_line)
        
        # Ensure we have some content
        if not recommendations:
            recommendations = ["Follow agricultural best practices for the identified condition"]
        if not preventive_measures:
            preventive_measures = ["Maintain good plant hygiene", "Monitor plants regularly"]
        
        return {
            "primary_diagnosis": "AI analysis completed",
            "confidence": "medium",
            "recommendations": recommendations[:6],  # Limit to 6 items
            "preventive_measures": preventive_measures[:6],
            "fertilizer_advice": fertilizer_advice,
            "urgency": urgency,
            "llm_analysis": text_response
        }
    
    def _get_fallback_recommendations(self, crop: str, condition: str, 
                                    disease_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Fallback recommendations when LLM is not available
        
        Args:
            crop: Crop type
            condition: Disease condition
            disease_matches: Matched diseases
            
        Returns:
            Basic recommendations
        """
        return {
            "primary_diagnosis": f"{crop} - {condition}",
            "confidence": "medium",
            "similar_cases": [
                {
                    "crop": match["crop"],
                    "condition": match["condition"],
                    "similarity": f"{match['score']:.2f}"
                }
                for match in disease_matches[:3]
            ],
            "recommendations": [
                "Remove affected plant parts",
                "Apply appropriate treatment based on disease type",
                "Improve environmental conditions",
                "Monitor plant closely for changes"
            ],
            "preventive_measures": [
                "Ensure proper plant spacing",
                "Maintain good air circulation",
                "Avoid overhead watering",
                "Practice crop rotation"
            ],
            "fertilizer_advice": f"Apply balanced fertilizer suitable for {crop}",
            "urgency": "medium",
            "llm_analysis": "LLM analysis not available - using fallback recommendations"
        }
    
    def is_service_ready(self) -> bool:
        """Check if the RAG service is ready to use"""
        return (self.index is not None and 
                self.model is not None and 
                len(self.metadata) > 0)
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the service status"""
        return {
            "ready": self.is_service_ready(),
            "index_loaded": self.index is not None,
            "model_loaded": self.model is not None,
            "metadata_count": len(self.metadata),
            "index_type": self.index_type,
            "base_directory": str(self.base_dir),
            "llm_available": self.llm is not None,
            "llm_status": self.llm.get_model_status() if self.llm else "Not initialized"
        }
