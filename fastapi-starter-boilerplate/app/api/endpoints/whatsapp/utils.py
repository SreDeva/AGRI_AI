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

logger = logging.getLogger(__name__)


SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")


from IndicTransToolkit.processor import IndicProcessor

import langid

async def detect_language(text: str) -> str:
    lang, confidence = langid.classify(text)
    print(f"Detected language: {lang} (confidence={confidence:.2f})")
    langid_to_script_code = {
        "hi": "hin_Deva",
        "ta": "tam_Taml",
        "te": "tel_Telu",
        "kn": "kan_Knda",
        "ml": "mal_Mlym",
        "bn": "ben_Beng",
        "mr": "mar_Deva",
        "gu": "guj_Gujr",
        "en": "eng_Latn"
    }

    return langid_to_script_code[lang]


async def handle_text(text: str) -> str:
    text = text.strip()
    detected_lang = await detect_language(text)
    text_en = await translate_to_english(text, detected_lang) if detected_lang != "eng_Latn" else text
    print(f"Translated to English: {text_en}")
    answer_en = await query_gemini(text_en)
    print(f"Gemini response in English: {answer_en}")
    answer = await translate_from_english(answer_en, detected_lang) if detected_lang != "eng_Latn" else answer_en
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


async def translate_from_english(text: str, tgt_lang: str = "eng_Latn") -> str:
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
genai.configure(api_key="AIzaSyCE4kX0GKDxEgQHxYBG_AiFuHBDb1pDrx0")
gemini_model = GenerativeModel("gemini-2.5-flash")

async def query_gemini(input: str) -> str:
    """Query Gemini AI model with a prompt"""

    try:
        prompt = f"""

        ## Few-Shot Prompt Template

        System Instruction:
        You are an Agri-Expert AI specializing in Indian agriculture. Your goal is to provide farmers with practical, step-by-step, and cost-effective advice. Always consider the local climate, soil type, and common pests. Use clear, simple language for better context.
        limit the response to 1600 characters
        Example 1

        User: My paddy crop near Thanjavur has leaves that are turning yellow from the tip downwards, and I see some brown spots. What should I do?

        Model:
        This sounds like Bacterial Leaf Blight (Nellithal Karugal Noi), which is common during the monsoon season. Here's what you should do immediately:

            Stop Nitrogen: Immediately stop the application of nitrogen-rich fertilizers like Urea, as they make the problem worse.

            Water Management: Drain the water from the field for a day or two if possible, then allow fresh water in. Avoid water stagnation.

            Chemical Control: Spray a solution of Copper Hydroxide 53.8% DF. Mix about 2.5 grams per litre of water and spray it evenly over the affected crop during the morning or evening.

            Organic Option: As a preventive measure for the future, you can use Pseudomonas fluorescens during planting.

        Example 2

        User: What is the correct fertilizer for my brinjal (kathiri) plants? They are in the flowering stage now.

        Model:
        For the flowering and fruit-setting stage in brinjal, the plant needs more Potassium (K).

            Primary Advice: Apply an NPK fertilizer with a higher K value, like 13:0:45 (Potassium Nitrate) or 19:19:19. Mix about 5 grams per litre of water and drench the soil around the plant base once every 10-15 days.

            Organic Booster: For better flowering and fruit quality, you can supplement with a foliar spray of Panchagavya (30 ml per litre of water) or Fish Amino Acid (10 ml per litre of water).

        Example 3

        User: My coconut trees have small, black insects under the leaves, which are turning yellow. The coconuts also have some black spots. What is this?

        Model:
        This is a classic case of Rugose Spiralling Whitefly (Soorulai Ee). It's a serious pest. Here's how to manage it:

            Introduce Predator Insects: The most effective and natural method is to introduce the parasitoid wasp, Encarsia GWH. Contact your local Krishi Vigyan Kendra (KVK) or agricultural university; they can provide these parasitoid cards to place on the trees.

            Yellow Sticky Traps: Place large, yellow sticky traps coated with castor oil or grease throughout your grove to attract and trap the adult whiteflies.

            Foliar Spray: As an immediate measure, spray a solution of Neem Oil (20 ml) and soap powder (10 grams) mixed in 1 litre of water on the underside of the leaves. This will suffocate the pests. Do this once a week.

            Avoid Chemical Insecticides: Do not spray broad-spectrum chemical insecticides, as they will kill the helpful predator insects and make the problem worse in the long run.
        
        User: {input}
        Model:
        """
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini query error: {e}")
        return "I'm having trouble processing your request right now. Please try again."


async def transcribe_audio_from_url(audio_url: str, language: str = "auto", auth=None) -> str:
    """
    Downloads an audio file from a URL, uploads it to Sarvam AI, and returns the transcribed text.

    Args:
        audio_url: Public URL to the audio file.
        language: "auto", "en", "ta", etc.
        auth: Optional HTTP basic auth for downloading.
    """

    
    api_url = "https://api.sarvam.ai/speech-to-text"
    headers = {
        "api-subscription-key": "sk_saeeog0v_lOjJPExQHFTY83DR5FbvqEgf"
    }

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "downloaded_audio")

        # Download the audio file
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(audio_url, auth=auth)
            resp.raise_for_status()
            with open(audio_path, "wb") as f:
                f.write(resp.content)

        # After downloading
        converted_path = os.path.join(tmpdir, "converted.wav")
        subprocess.run([
            "ffmpeg", "-y", "-i", audio_path,
            "-ac", "1", "-ar", "16000", converted_path
        ], check=True)
        # Upload converted_path as "audio/wav"
        with open(converted_path, "rb") as f:
            files = {
                "file": (os.path.basename(converted_path), f, "audio/wav")
            }
            data = {
                "language": language
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(api_url, headers=headers, data=data, files=files)
                response.raise_for_status()
                result = response.json()

        # Return the transcription text
        print("Transcription result:", result)
        return result.get("transcript", "").strip()
    

async def save_base64_audio_to_file(base64_audio: str, file_path: str) -> str:
    """
    Decodes base64 audio and saves to file.
    Returns the file path.
    """
    with open(file_path, "wb") as f:
        f.write(base64.b64decode(base64_audio))
    return file_path


async def text_to_speech(text: str, target_language_code: str = "hi-IN") -> dict:
    """Converts text to speech, saves as WAV, then converts to OGG with Opus codec."""
    api_url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": "sk_saeeog0v_lOjJPExQHFTY83DR5FbvqEgf",
        "Content-Type": "application/json"
    }
    payload = {"inputs": [text], "target_language_code": target_language_code}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(api_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

        audio_base64 = result.get("audios")[0]
        if not audio_base64:
            logger.error("TTS API returned empty audio.")
            return {"error": "TTS API returned empty audio"}

        audio_id = uuid.uuid4()
        static_dir = Path("static/audio")
        static_dir.mkdir(parents=True, exist_ok=True)
        
        # Paths for temporary WAV and final OGG
        wav_path = static_dir / f"tts_{audio_id}.wav"
        ogg_path = static_dir / f"tts_{audio_id}.ogg"

        # Save the initial WAV file from the API
        with open(wav_path, "wb") as f:
            f.write(base64.b64decode(audio_base64))

        # --- THIS IS THE FIX ---
        # Convert WAV to OGG using the libopus codec
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", str(wav_path),
                "-c:a", "libopus",  # Specify the Opus codec for audio
                "-b:a", "16k",      # Set a reasonable audio bitrate
                str(ogg_path),
            ],
            check=True,
            capture_output=True # Hides ffmpeg logs unless there's an error
        )
        
        # Clean up the temporary WAV file
        wav_path.unlink()
        
        logger.info(f"TTS audio successfully converted and saved to: {ogg_path}")
        return {"media_path": f"/static/audio/{ogg_path.name}"}

    except Exception as e:
        logger.error(f"Error in text_to_speech: {e}", exc_info=True)
        return {"error": f"An unexpected error occurred: {e}"}


from app.api.endpoints.weather.weather_service import weather_service

async def handle_weather_request(text: str, location_data: dict = None) -> str:
    """Handle weather-related queries"""
    if not location_data:
        return "Please share your location to get weather-based farming advice. You can do this by sending your location in WhatsApp."
    
    try:
        weather_data = await weather_service.get_weather_forecast(
            location_data['latitude'], 
            location_data['longitude'], 
            days=3
        )
        advice = weather_service.generate_farming_advice(weather_data)
        
        response = "🌤️ 3-Day Weather Advisory:\n\n"
        for day in advice[:3]:
            response += f"📅 {day['date']}\n"
            response += f"🌡️ {day['temperature']}\n"
            response += f"💧 Rain: {day['precipitation']} ({day['rain_probability']})\n"
            for rec in day['recommendations'][:2]:  # Limit recommendations
                response += f"• {rec}\n"
            response += "\n"
            
        return response[:1500]  # Limit message length
        
    except Exception as e:
        return "Sorry, I couldn't fetch weather data right now. Please try again later."


async def analyze_plant_image_local(image_path: str) -> str:
    """
    Analyze plant image from local file path using Gemini Vision API.
    """
    try:
        logger.info(f"Analyzing local image: {image_path}")
        
        # Read the image file
        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()
        
        # Convert image to base64 for Gemini
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Create the prompt for plant disease analysis
        prompt = """
        Analyze this plant image for diseases or health issues. Provide:
        1. Plant type (if identifiable)
        2. Overall health status
        3. Any visible diseases, pests, or deficiencies
        4. Recommended treatment or care
        
        Keep the response under 1600 characters and practical for farmers.
        """

        # Prepare the image data for Gemini
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_base64
        }

        logger.info("Sending request to Gemini...")
        # Generate content with image and text
        response = gemini_model.generate_content([prompt, image_part])
        
        result = response.text.strip()
        logger.info(f"Gemini analysis result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error during local image analysis: {e}")
        return "An error occurred while analyzing the image. Please try again."

async def should_offer_weather_service(text: str) -> bool:
    """Check if we should offer weather service based on user's question"""
    prompt = f"""
    Analyze if this farming question would benefit from weather information. 
    Return only "true" or "false".
    
    Examples:
    - "How to grow rice" -> true (weather affects rice growing)
    - "What is photosynthesis" -> false (general knowledge)
    - "When to plant tomatoes" -> true (planting timing depends on weather)
    - "My plant has yellow leaves" -> false (specific disease question)

    Keep the response under 1600 characters and practical for farmers.
    
    Question: {text}
    """
    
    response = await query_gemini(prompt)
    return "true" in response.lower()

async def extract_location_from_text(text: str) -> dict:
    """Extract location information from text using Gemini"""
    prompt = f"""
    Extract location information from this text. If you can identify a specific city/place, 
    provide approximate coordinates. If no location is found, return "NONE".
    
    Format your response as: "LOCATION: city_name, LATITUDE: xx.xxxx, LONGITUDE: yy.yyyy"
    Or just "NONE" if no location found.
    
    Examples:
    - "Yes I am from Chennai" -> "LOCATION: Chennai, LATITUDE: 13.0827, LONGITUDE: 80.2707"
    - "I live in Mumbai" -> "LOCATION: Mumbai, LATITUDE: 19.0760, LONGITUDE: 72.8777"
    - "Yes please" -> "NONE"

    Keep the response under 1600 characters and practical for farmers.
    
    Text: {text}
    """
    
    response = await query_gemini(prompt)
    
    if "NONE" in response:
        return None
    
    try:
        # Parse the response to extract coordinates
        lines = response.split(',')
        lat_line = [line for line in lines if 'LATITUDE' in line][0]
        lon_line = [line for line in lines if 'LONGITUDE' in line][0]
        
        latitude = float(lat_line.split(':')[1].strip())
        longitude = float(lon_line.split(':')[1].strip())
        
        return {"latitude": latitude, "longitude": longitude}
    except:
        return None

async def analyze_weather_response(text: str, language: str) -> dict:
    """Analyze user's response to weather offer"""
    prompt = f"""
    Analyze this response to determine user's intent regarding weather service.
    The user was asked if they want weather information.
    
    Return in this format:
    WANTS_WEATHER: true/false
    DECLINED: true/false
    
    Examples:
    - "Yes" -> WANTS_WEATHER: true, DECLINED: false
    - "No thanks" -> WANTS_WEATHER: false, DECLINED: true  
    - "Maybe later" -> WANTS_WEATHER: false, DECLINED: true
    - "What is weather service?" -> WANTS_WEATHER: false, DECLINED: false

    Keep the response under 1600 characters and practical for farmers.
    
    Response: {text}
    Language: {language}
    """
    
    response = await query_gemini(prompt)
    
    wants_weather = "WANTS_WEATHER: true" in response
    declined = "DECLINED: true" in response
    
    return {"wants_weather": wants_weather, "declined": declined}

async def get_weather_offer_message(language: str) -> str:
    """Generate weather offer message in user's language"""
    prompt = f"""
    Generate a friendly message offering weather service for farmers in {language} language.
    Keep it brief and natural. Ask if they want to share location for daily weather analysis.
    
    If language is English, use: "Would you like to share your location to get daily weather analysis for better farming decisions?"
    
    For other languages, translate appropriately while keeping the same meaning.

    Keep the response under 1600 characters and practical for farmers.
    Language: {language}
    """
    
    if language == "en":
        return "🌤️ Would you like to share your location to get daily weather analysis for better farming decisions?"
    
    response = await query_gemini(prompt)
    return f"🌤️ {response.strip()}"

async def get_location_request_message(language: str) -> str:
    """Generate location request message in user's language"""
    prompt = f"""
    Generate a message asking user to share their location for weather service in {language} language.
    Keep it brief and explain they can either share GPS location or mention their city name.

    Keep the response under 1600 characters and practical for farmers.
    
    Language: {language}
    """
    
    if language == "en":
        return "📍 Please share your location using WhatsApp's location feature, or simply tell me your city name (e.g., 'I am from Chennai')."
    
    response = await query_gemini(prompt)
    return f"📍 {response.strip()}"

async def get_clarification_message(language: str) -> str:
    """Generate clarification message in user's language"""
    prompt = f"""
    Generate a brief message asking for clarification about weather service in {language} language.
    Ask if they want weather information or have another question.

    Keep the response under 1600 characters and practical for farmers.
    
    Language: {language}
    """
    
    if language == "en":
        return "I'm not sure about your response. Do you want weather information, or do you have another farming question?"
    
    response = await query_gemini(prompt)
    return response.strip()
