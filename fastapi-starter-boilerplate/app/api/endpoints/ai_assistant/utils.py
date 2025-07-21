from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForCausalLM
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import os
import tempfile
import subprocess
import httpx
import whisper
import base64
import logging
import uuid
from pathlib import Path
import requests
import json

logger = logging.getLogger(__name__)


SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")


from IndicTransToolkit.processor import IndicProcessor

import langid

async def detect_language(text: str) -> str:
    lang, confidence = langid.classify(text)
    print(f"Detected language: {lang} (confidence={confidence:.2f})")
    return lang


async def handle_text(text: str) -> str:
    text = text.strip()
    detected_lang = await detect_language(text)
    text_en = await translate_to_english(text) if detected_lang != "en" else text
    print(f"Translated to English: {text_en}")
    answer_en = await query_gemini(text_en)
    print(f"Gemini response in English: {answer_en}")
    answer = await translate_from_english(answer_en) if detected_lang != "en" else answer_en
    print(f"Final response in {detected_lang}: {answer}")
    reply = answer
    return reply



DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Model for English -> Indic
model_name_en_indic = "ai4bharat/indictrans2-en-indic-1B"
tokenizer_en_indic = AutoTokenizer.from_pretrained(model_name_en_indic, trust_remote_code=True)
model_en_indic = AutoModelForSeq2SeqLM.from_pretrained(
    model_name_en_indic,
    trust_remote_code=True,
    torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
    attn_implementation="flash_attention_2" if DEVICE == "cuda" else None
).to(DEVICE)

ip_en_indic = IndicProcessor(inference=True)

# Model for Indic -> English
model_name_indic_en = "ai4bharat/indictrans2-indic-en-1B"
tokenizer_indic_en = AutoTokenizer.from_pretrained(model_name_indic_en, trust_remote_code=True)
model_indic_en = AutoModelForSeq2SeqLM.from_pretrained(
    model_name_indic_en,
    trust_remote_code=True,
    torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
    attn_implementation="flash_attention_2" if DEVICE == "cuda" else None
).to(DEVICE)

ip_indic_en = IndicProcessor(inference=True)


async def translate_from_english(text: str, tgt_lang: str = "tam_Taml") -> str:
    """
    Translate English text to Indic language (e.g., Tamil).
    """
    src_lang = "eng_Latn"
    batch = ip_en_indic.preprocess_batch(
        [text],
        src_lang=src_lang,
        tgt_lang=tgt_lang,
    )
    inputs = tokenizer_en_indic(
        batch,
        truncation=True,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    with torch.no_grad():
        generated_tokens = model_en_indic.generate(
            **inputs,
            use_cache=True,
            min_length=0,
            max_length=256,
            num_beams=5,
            num_return_sequences=1,
        )

    decoded = tokenizer_en_indic.batch_decode(
        generated_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )
    translated = ip_en_indic.postprocess_batch(decoded, lang=tgt_lang)
    return translated[0]


async def translate_to_english(text: str, src_lang: str = "tam_Taml") -> str:
    """
    Translate Indic language text (e.g., Tamil) to English.
    """
    tgt_lang = "eng_Latn"
    batch = ip_indic_en.preprocess_batch(
        [text],
        src_lang=src_lang,
        tgt_lang=tgt_lang,
    )
    inputs = tokenizer_indic_en(
        batch,
        truncation=True,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    with torch.no_grad():
        generated_tokens = model_indic_en.generate(
            **inputs,
            use_cache=True,
            min_length=0,
            max_length=256,
            num_beams=5,
            num_return_sequences=1,
        )

    decoded = tokenizer_indic_en.batch_decode(
        generated_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )
    translated = ip_indic_en.postprocess_batch(decoded, lang=tgt_lang)
    return translated[0]


import google.generativeai as genai
from google.generativeai import GenerativeModel

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required")

genai.configure(api_key=GEMINI_API_KEY)
gemini_model = GenerativeModel("gemini-2.5-flash")

async def query_gemini(prompt: str) -> str:
    """Query Gemini AI model with a prompt"""
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini query error: {e}")
        return "I'm having trouble processing your request right now. Please try again."


# Use Sarvam API key from environment
if not SARVAM_API_KEY:
    logger.error("SARVAM_API_KEY not found in environment variables")
    raise ValueError("SARVAM_API_KEY is required")

# ---------- Speech To Text ----------
async def speech_to_text(file_path):
    url = "https://api.sarvam.ai/speech-to-text"
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }
    
    # Add language parameter to help with recognition
    data = {
        "language": "auto"  # or try "en" for English
    }
    
    with open(file_path, 'rb') as audio_file:
        files = {
            'file': (os.path.basename(file_path), audio_file, 'audio/wav')
        }
        response = requests.post(url, headers=headers, data=data, files=files)
    
    if response.ok:
        result = response.json()
        print("STT Response:", result)
        
        # Check if transcript is empty and log file info
        if not result.get("transcript", "").strip():
            file_size = os.path.getsize(file_path)
            print(f"Empty transcript - File size: {file_size} bytes, Path: {file_path}")
            
        return result
    else:
        print("STT Error:", response.status_code, response.text)
        return {"transcript": "", "error": f"STT API error: {response.status_code}"}


# ---------- Text To Speech ----------
async def text_to_speech(text, target_language_code , output_path):
    url = "https://api.sarvam.ai/text-to-speech"

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "target_language_code": target_language_code
    }

    response = requests.post(url, headers=headers, json=payload)

    # If TTS returns binary audio (check Sarvam API), save it:
    if response.ok and "audio/wav" in response.headers.get("Content-Type", ""):
        with open(output_path, "wb") as f:
            f.write(response.content)
        # print(f"TTS audio saved to {output_path}")
        return output_path
    else:
        try:
            # If it returned JSON metadata (like a URL), print it
            data = response.json()
            # print("TTS Response JSON:", data)
            return data
        except Exception:
            # Otherwise, print raw text
            print("TTS Error:", response.status_code, response.text)
            return None
