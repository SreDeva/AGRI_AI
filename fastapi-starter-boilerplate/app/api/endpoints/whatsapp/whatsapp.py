from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse
from twilio.rest import Client
from dotenv import load_dotenv
from app.api.endpoints.whatsapp.utils import (
    transcribe_audio_from_url,
    text_to_speech,
    handle_text,
    handle_weather_request,
    should_offer_weather_service,
    extract_location_from_text,
    detect_language,
    analyze_weather_response,
    get_weather_offer_message,
    get_location_request_message,
    get_clarification_message
)
from app.api.endpoints.whatsapp.plant_disease import analyze_plant_image
from app.api.endpoints.whatsapp.rag_utils import (
    handle_text_with_rag,
    handle_image_with_rag,
    handle_audio_with_rag,
    get_user_conversation_summary,
    search_knowledge_base
)

import os

# Load the .env file
load_dotenv()

# Read environment variables
ACCOUNT_SID = os.getenv("ACCOUNT_SID")
AUTH_TOKEN = os.getenv("AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_NUMBER")

# Create the router
whatsapp_module = APIRouter()

# Initialize Twilio client
client = Client(ACCOUNT_SID, AUTH_TOKEN)

# Store user conversation state
user_states = {}

# Helper to send WhatsApp messages
def send_whatsapp_message(to: str, message: str):
    sent_message = client.messages.create(
        body=message,
        from_=TWILIO_NUMBER,
        to=f"whatsapp:{to}"
    )
    return sent_message.sid

# Helper to send audio files via WhatsApp
def send_whatsapp_audio(to: str, audio_url: str, caption: str = None):
    media_url = audio_url  # Directly use the audio URL
    sent_message = client.messages.create(
        body=caption,
        from_=TWILIO_NUMBER,
        to=f"whatsapp:{to}",
        media_url=[media_url]  # Send the audio file as media
    )
    return sent_message.sid


# POST endpoint to receive incoming WhatsApp messages
@whatsapp_module.post("/incoming")
async def read_incoming_message(request: Request):
    form = await request.form()
    from_number = form.get("From").replace("whatsapp:", "")
    body = form.get("Body")
    num_media = int(form.get("NumMedia", 0))
    location_latitude = form.get("Latitude")
    location_longitude = form.get("Longitude")

    print("Incoming message:", dict(form))

    # Initialize user state if not exists
    if from_number not in user_states:
        user_states[from_number] = {"awaiting_weather_response": False, "last_language": "en"}

    user_state = user_states[from_number]
    reply = ""

    # Handle location sharing
    if location_latitude and location_longitude:
        location_data = {
            "latitude": float(location_latitude),
            "longitude": float(location_longitude)
        }
        reply = await handle_weather_request("", location_data)
        user_state["awaiting_weather_response"] = False
    
    # Handle media messages
    elif num_media > 0:
        media_url = form.get("MediaUrl0")
        media_type = form.get("MessageType")

        if "image" in media_type:
            prediction = await analyze_plant_image(media_url, auth=(ACCOUNT_SID, AUTH_TOKEN))
            
            if body and body.strip():
                combined_input = f"Image Analysis: {prediction}\nUser Question: {body}"
                reply = await handle_text(combined_input)
            else:
                reply = await handle_text(f"PlantVillage Analysis: {prediction}")

        elif "audio" in media_type:
            try:
                transcript = await transcribe_audio_from_url(media_url, auth=(ACCOUNT_SID, AUTH_TOKEN))
                
                if body and body.strip():
                    combined_input = f"Voice message: {transcript}\nText message: {body}"
                    reply = await handle_text(combined_input)
                else:
                    reply = await handle_text(transcript)
            except Exception as e:
                print("Transcription error:", e)
                reply = "I received your voice message but couldn't understand it."
        else:
            reply = "I received a file!"

    # Handle text messages
    elif body:
        detected_lang = await detect_language(body)
        user_state["last_language"] = detected_lang
        
        # Check if user is responding to weather offer
        if user_state["awaiting_weather_response"]:
            location_data = await extract_location_from_text(body)
            
            if location_data:
                # Location provided in text
                reply = await handle_weather_request(body, location_data)
                user_state["awaiting_weather_response"] = False
            else:
                # Check if user agreed to share location
                response_analysis = await analyze_weather_response(body, detected_lang)
                
                if response_analysis["wants_weather"]:
                    reply = await get_location_request_message(detected_lang)
                elif response_analysis["declined"]:
                    reply = await handle_text(body)  # Process as normal query
                    user_state["awaiting_weather_response"] = False
                else:
                    # Unclear response, ask for clarification
                    reply = await get_clarification_message(detected_lang)
        else:
            # Normal conversation flow
            reply = await handle_text(body)
            
            # Check if we should offer weather service
            if await should_offer_weather_service(body):
                weather_offer = await get_weather_offer_message(detected_lang)
                reply = f"{reply}\n\n{weather_offer}"
                user_state["awaiting_weather_response"] = True

    else:
        reply = "Sorry, I couldn't understand your message."

    # Send the reply
    sid = send_whatsapp_message(to=from_number, message=reply)
    print("Sent message SID:", sid)

    return PlainTextResponse("OK")
