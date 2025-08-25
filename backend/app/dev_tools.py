#!/usr/bin/env python3
"""
AGRI AI Development and Testing Script

This script provides utilities for testing and developing with AGRI AI models.
It includes interactive testing, model debugging, and development helpers.
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional

# Add the app directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    get_whisper_model,
    get_fasttext_model,
    get_indictrans_model, 
    get_coqui_model,
    get_ollama_model
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AGRIDevelopmentTools:
    """Development and testing utilities for AGRI AI"""
    
    def __init__(self):
        self.test_data = {
            'agricultural_questions': [
                "What is the best fertilizer for rice crops?",
                "How often should I water tomato plants?",
                "What are the signs of nitrogen deficiency in corn?",
                "When is the best time to plant wheat?",
                "How to prevent pest attacks on cotton crops?"
            ],
            'multilingual_text': {
                'english': "Rice is an important staple crop in India.",
                'hindi': "चावल भारत में एक महत्वपूर्ण मुख्य फसल है।",
                'tamil': "அரிசி இந்தியாவில் ஒரு முக்கியமான முக்கிய பயிர் ஆகும்।",
                'telugu': "బియ్యం భారతదేశంలో ఒక ముఖ్యమైన ప్రధాన పంట.",
                'bengali': "ধান ভারতে একটি গুরুত্বপূর্ণ প্রধান ফসল।"
            }
        }
    
    def test_whisper_interactive(self):
        """Interactive testing for Whisper STT"""
        print("\\n" + "="*50)
        print("WHISPER SPEECH-TO-TEXT TESTING")
        print("="*50)
        
        try:
            whisper_model = get_whisper_model()
            
            print("Model Status:")
            print(f"- Loaded: {whisper_model.is_model_loaded()}")
            print(f"- Model Size: {whisper_model.model_name}")
            
            print("\\nSupported Languages:")
            for lang in whisper_model.get_supported_languages()[:10]:
                print(f"- {lang}")
            print("... and more")
            
            # Test audio file (if available)
            print("\\nTo test with audio:")
            print("1. Place an audio file in backend/app/assets/audio/")
            print("2. Run: whisper_model.transcribe_audio('path/to/audio.wav')")
            
        except Exception as e:
            print(f"Error testing Whisper: {e}")
    
    def test_fasttext_interactive(self):
        """Interactive testing for FastText language detection"""
        print("\\n" + "="*50)
        print("FASTTEXT LANGUAGE DETECTION TESTING")
        print("="*50)
        
        try:
            fasttext_model = get_fasttext_model()
            
            print("Testing language detection:")
            
            for lang, text in self.test_data['multilingual_text'].items():
                result = fasttext_model.detect_language(text)
                print(f"\\n{lang.upper()}: {text}")
                print(f"Detected: {result['detected_language']} (confidence: {result['confidence']:.3f})")
            
            # Test agricultural context enhancement
            print("\\nTesting agricultural context:")
            ag_text = "Nitrogen deficiency in crops leads to yellowing of leaves"
            result = fasttext_model.detect_language(ag_text, agricultural_context=True)
            print(f"Text: {ag_text}")
            print(f"Enhanced detection: {result}")
            
        except Exception as e:
            print(f"Error testing FastText: {e}")
    
    def test_indictrans_interactive(self):
        """Interactive testing for IndicTrans2 translation"""
        print("\\n" + "="*50) 
        print("INDICTRANS2 TRANSLATION TESTING")
        print("="*50)
        
        try:
            indictrans_model = get_indictrans_model()
            
            print("Model Info:")
            model_info = indictrans_model.get_model_info()
            for key, value in model_info.items():
                print(f"- {key}: {value}")
            
            print("\\nSupported Languages:")
            for lang in indictrans_model.get_supported_languages():
                print(f"- {lang}")
            
            # Test translation
            print("\\nTesting English to Hindi translation:")
            test_text = "Rice farming requires proper irrigation and fertilization."
            
            result = indictrans_model.translate(
                text=test_text,
                source_lang='en',
                target_lang='hi'
            )
            
            print(f"English: {test_text}")
            if result['success']:
                print(f"Hindi: {result['translated_text']}")
            else:
                print(f"Translation failed: {result['error']}")
            
        except Exception as e:
            print(f"Error testing IndicTrans: {e}")
    
    def test_coqui_interactive(self):
        """Interactive testing for Coqui TTS"""
        print("\\n" + "="*50)
        print("COQUI TEXT-TO-SPEECH TESTING") 
        print("="*50)
        
        try:
            coqui_model = get_coqui_model()
            
            print("Model Info:")
            model_info = coqui_model.get_model_info()
            for key, value in model_info.items():
                print(f"- {key}: {value}")
            
            print("\\nAvailable Voices:")
            voices = coqui_model.get_available_voices()
            for voice in voices[:5]:
                print(f"- {voice}")
            
            # Test synthesis
            print("\\nTesting speech synthesis:")
            test_text = "Welcome to AGRI AI, your agricultural assistant."
            
            result = coqui_model.synthesize_speech(
                text=test_text,
                language='en',
                agricultural_context=True
            )
            
            if result['success']:
                print(f"✓ Speech synthesis successful")
                print(f"Output file: {result['audio_path']}")
            else:
                print(f"✗ Speech synthesis failed: {result['error']}")
            
        except Exception as e:
            print(f"Error testing Coqui TTS: {e}")
    
    def test_ollama_interactive(self):
        """Interactive testing for Ollama LLM"""
        print("\\n" + "="*50)
        print("OLLAMA LLM TESTING")
        print("="*50)
        
        try:
            ollama_model = get_ollama_model()
            
            print("Model Info:")
            model_info = ollama_model.get_model_info()
            for key, value in model_info.items():
                print(f"- {key}: {value}")
            
            if not model_info.get('server_connected'):
                print("\\n⚠️  Ollama server not connected!")
                print("Start server with: ollama serve")
                return
            
            print("\\nAvailable Models:")
            models = ollama_model.list_available_models()
            for model in models:
                print(f"- {model['name']} ({model['size']})")
            
            # Test chat
            print("\\nTesting agricultural chat:")
            for question in self.test_data['agricultural_questions'][:3]:
                print(f"\\nQ: {question}")
                
                result = ollama_model.chat(
                    message=question,
                    agricultural_context=True
                )
                
                if result['success']:
                    response = result['response'][:200] + "..." if len(result['response']) > 200 else result['response']
                    print(f"A: {response}")
                else:
                    print(f"Error: {result['error']}")
                
                time.sleep(1)  # Rate limiting
            
        except Exception as e:
            print(f"Error testing Ollama: {e}")
    
    def test_full_pipeline(self):
        """Test the complete AI pipeline"""
        print("\\n" + "="*50)
        print("FULL AI PIPELINE TESTING")
        print("="*50)
        
        try:
            # Initialize all models
            print("Initializing models...")
            fasttext_model = get_fasttext_model()
            indictrans_model = get_indictrans_model() 
            ollama_model = get_ollama_model()
            coqui_model = get_coqui_model()
            
            # Test pipeline with agricultural question
            test_input = "धान की फसल में कीट नियंत्रण कैसे करें?"
            
            print(f"\\nInput: {test_input}")
            
            # Step 1: Language detection
            lang_result = fasttext_model.detect_language(test_input)
            detected_lang = lang_result['detected_language']
            print(f"1. Detected language: {detected_lang}")
            
            # Step 2: Translation to English (if needed)
            if detected_lang != 'en':
                trans_result = indictrans_model.translate(
                    text=test_input,
                    source_lang=detected_lang,
                    target_lang='en'
                )
                
                if trans_result['success']:
                    english_text = trans_result['translated_text']
                    print(f"2. Translated to English: {english_text}")
                else:
                    print(f"2. Translation failed: {trans_result['error']}")
                    return
            else:
                english_text = test_input
                print("2. Already in English")
            
            # Step 3: LLM processing
            llm_result = ollama_model.chat(
                message=english_text,
                agricultural_context=True
            )
            
            if llm_result['success']:
                response = llm_result['response']
                print(f"3. LLM response: {response[:100]}...")
            else:
                print(f"3. LLM failed: {llm_result['error']}")
                return
            
            # Step 4: Translate response back (if needed)
            if detected_lang != 'en':
                response_trans = indictrans_model.translate(
                    text=response,
                    source_lang='en',
                    target_lang=detected_lang
                )
                
                if response_trans['success']:
                    final_response = response_trans['translated_text']
                    print(f"4. Response in {detected_lang}: {final_response[:100]}...")
                else:
                    print(f"4. Response translation failed")
                    final_response = response
            else:
                final_response = response
                print("4. Response already in English")
            
            # Step 5: Text-to-speech (optional)
            tts_result = coqui_model.synthesize_speech(
                text=final_response[:100],  # Limit length for demo
                language=detected_lang,
                agricultural_context=True
            )
            
            if tts_result['success']:
                print(f"5. ✓ Speech synthesis completed: {tts_result['audio_path']}")
            else:
                print(f"5. Speech synthesis failed: {tts_result['error']}")
            
            print("\\n🎉 Full pipeline test completed!")
            
        except Exception as e:
            print(f"Pipeline test failed: {e}")
    
    def benchmark_models(self):
        """Benchmark model performance"""
        print("\\n" + "="*50)
        print("MODEL PERFORMANCE BENCHMARKING")
        print("="*50)
        
        benchmarks = {}
        
        # Benchmark FastText
        try:
            fasttext_model = get_fasttext_model()
            start_time = time.time()
            
            for text in self.test_data['multilingual_text'].values():
                fasttext_model.detect_language(text)
            
            fasttext_time = time.time() - start_time
            benchmarks['fasttext'] = fasttext_time
            print(f"FastText: {fasttext_time:.3f}s for 5 detections")
            
        except Exception as e:
            print(f"FastText benchmark failed: {e}")
        
        # Benchmark IndicTrans
        try:
            indictrans_model = get_indictrans_model()
            start_time = time.time()
            
            result = indictrans_model.translate(
                text="This is a test sentence for translation benchmarking.",
                source_lang='en',
                target_lang='hi'
            )
            
            indictrans_time = time.time() - start_time
            benchmarks['indictrans'] = indictrans_time
            print(f"IndicTrans: {indictrans_time:.3f}s for 1 translation")
            
        except Exception as e:
            print(f"IndicTrans benchmark failed: {e}")
        
        # Benchmark Ollama
        try:
            ollama_model = get_ollama_model()
            start_time = time.time()
            
            result = ollama_model.chat("What is agriculture?")
            
            ollama_time = time.time() - start_time
            benchmarks['ollama'] = ollama_time
            print(f"Ollama: {ollama_time:.3f}s for 1 response")
            
        except Exception as e:
            print(f"Ollama benchmark failed: {e}")
        
        return benchmarks
    
    def interactive_menu(self):
        """Interactive testing menu"""
        while True:
            print("\\n" + "="*50)
            print("AGRI AI DEVELOPMENT TOOLS")
            print("="*50)
            print("1. Test Whisper STT")
            print("2. Test FastText Language Detection")
            print("3. Test IndicTrans2 Translation")
            print("4. Test Coqui TTS")
            print("5. Test Ollama LLM")
            print("6. Test Full Pipeline")
            print("7. Benchmark Models")
            print("8. Exit")
            print("="*50)
            
            try:
                choice = input("Select option (1-8): ").strip()
                
                if choice == '1':
                    self.test_whisper_interactive()
                elif choice == '2':
                    self.test_fasttext_interactive()
                elif choice == '3':
                    self.test_indictrans_interactive()
                elif choice == '4':
                    self.test_coqui_interactive()
                elif choice == '5':
                    self.test_ollama_interactive()
                elif choice == '6':
                    self.test_full_pipeline()
                elif choice == '7':
                    self.benchmark_models()
                elif choice == '8':
                    print("Goodbye!")
                    break
                else:
                    print("Invalid option. Please try again.")
                    
                input("\\nPress Enter to continue...")
                
            except KeyboardInterrupt:
                print("\\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")
                input("Press Enter to continue...")

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="AGRI AI Development Tools")
    parser.add_argument(
        '--test',
        choices=['whisper', 'fasttext', 'indictrans', 'coqui', 'ollama', 'pipeline', 'all'],
        help='Run specific test'
    )
    parser.add_argument(
        '--benchmark',
        action='store_true',
        help='Run performance benchmarks'
    )
    parser.add_argument(
        '--interactive',
        action='store_true',
        help='Launch interactive menu'
    )
    
    args = parser.parse_args()
    
    dev_tools = AGRIDevelopmentTools()
    
    if args.test:
        if args.test == 'whisper':
            dev_tools.test_whisper_interactive()
        elif args.test == 'fasttext':
            dev_tools.test_fasttext_interactive()
        elif args.test == 'indictrans':
            dev_tools.test_indictrans_interactive()
        elif args.test == 'coqui':
            dev_tools.test_coqui_interactive()
        elif args.test == 'ollama':
            dev_tools.test_ollama_interactive()
        elif args.test == 'pipeline':
            dev_tools.test_full_pipeline()
        elif args.test == 'all':
            dev_tools.test_whisper_interactive()
            dev_tools.test_fasttext_interactive()
            dev_tools.test_indictrans_interactive()
            dev_tools.test_coqui_interactive()
            dev_tools.test_ollama_interactive()
            dev_tools.test_full_pipeline()
    
    elif args.benchmark:
        dev_tools.benchmark_models()
    
    elif args.interactive:
        dev_tools.interactive_menu()
    
    else:
        # Default to interactive if no args
        dev_tools.interactive_menu()

if __name__ == '__main__':
    main()
