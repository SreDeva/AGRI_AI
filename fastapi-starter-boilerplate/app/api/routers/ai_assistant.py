from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
from app.api.endpoints.ai_assistant.utils import (
    handle_text,
    text_to_speech,
    speech_to_text
)
from app.api.endpoints.whatsapp.plant_disease import analyze_plant_image_local
import tempfile
import os
import subprocess
import uuid


router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

@router.post("/text")
async def process_text(request: Request):
    """
    Receives text via JSON, detects language, translates if needed, queries Gemini, translates response if needed, and returns reply.
    """
    try:
        # Get raw request body and parse JSON manually
        print("the req is ", request)
        body = await request.json()
        print("the req is ", body)

        # Parse JSON manually to avoid Pydantic issues
        import json
        try:
            data = json.loads(body.decode('utf-8'))
            print("the data in /text is ",data)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail="Invalid JSON in request body")

        # Extract text from the JSON data
        text = data.get('text')
        if not text:
            raise HTTPException(status_code=400, detail="Missing 'text' field in request")

        print(f"🤖 AI Assistant received text: {text}")
        reply = await handle_text(text)
        print(f"🤖 AI Assistant reply: {reply}")

        return JSONResponse({"reply": reply})

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in AI assistant text endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/audio")
async def process_audio(request: Request, file: UploadFile = File(...)):
    """
    Receives an audio file, transcribes it, gets a text reply,
    converts the reply to audio, and returns a public URL to that audio.
    """
    try:
        # Use a temporary directory for intermediate processing files
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save uploaded file with its original extension.
            # The filename from Expo AV will be like 'audio-167...m4a'
            input_path = os.path.join(tmpdir, file.filename or "input.m4a")
            with open(input_path, "wb") as f_out:
                content = await file.read()
                f_out.write(content)
            
            # Convert the input audio to a standardized 16kHz mono WAV file for STT
            converted_path = os.path.join(tmpdir, "converted.wav")
            subprocess.run([
                "ffmpeg",
                "-y",           # Overwrite output file if it exists
                "-i", input_path,
                "-ac", "1",     # Set audio channels to 1 (mono)
                "-ar", "16000", # Set audio sampling rate to 16000 Hz
                converted_path
            ], check=True, capture_output=True) # Use capture_output to hide ffmpeg logs
            
            # Transcribe the standardized audio file
            transcript_data = await speech_to_text(converted_path)
            
            # Fallback to Whisper if the primary STT service fails
            if not transcript_data.get("transcript", "").strip():
                print("Primary STT failed, trying Whisper fallback...")
                import whisper
                model = whisper.load_model("base")
                result = model.transcribe(converted_path)
                transcript_data = {"transcript": result["text"]}
                print(f"Whisper transcript: {transcript_data['transcript']}")

            if not transcript_data.get("transcript", "").strip():
                raise ValueError("Transcription failed for both primary and fallback services.")

            transcript_text = transcript_data["transcript"]

            # Process the transcript to get a text reply
            reply_text = await handle_text(transcript_text)
            
            # --- Generate Reply Audio and Public URL ---

            # 1. Create a unique filename for the reply audio
            reply_filename = f"reply_{uuid.uuid4()}.wav"

            # 2. Ensure the generated_audio directory exists
            generated_audio_dir = "generated_audio"
            os.makedirs(generated_audio_dir, exist_ok=True)

            # 3. Define the path inside your static directory (e.g., 'generated_audio')
            static_output_path = os.path.join(generated_audio_dir, reply_filename)

            # 4. Generate the speech file and save it to the static path
            await text_to_speech(reply_text, "ta-IN", static_output_path)
            
            # 5. Construct the full, public URL for the client app
            # request.base_url gives you http://your-ip:port/
            # We append the static path and filename.
            full_audio_url = f"{str(request.base_url)}audio-files/{reply_filename}"

            return JSONResponse({
                "transcript": transcript_text,  
                "reply": reply_text,
                "audio_path": full_audio_url, # This is now a working URL
                "status": "success"
            })

    except subprocess.CalledProcessError as e:
        print(f"FFmpeg Error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail=f"FFmpeg failed: {e.stderr.decode()}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return JSONResponse({
            "error": str(e),
            "status": "error"
        }, status_code=500)
    

@router.post("/image-analysis")
async def analyze_image_with_context(
    image: UploadFile = File(...)
):
    """
    Analyze plant image only (no additional context for simplicity).
    """
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            image_path = os.path.join(tmpdir, image.filename)
            with open(image_path, "wb") as f:
                f.write(await image.read())
            
            # Analyze the plant image
            prediction = await analyze_plant_image_local(image_path)
            reply = await handle_text(f"PlantVillage Analysis: {prediction}")
            
            return JSONResponse({
                "image_analysis": prediction,
                "final_reply": reply,
                "status": "success"
            })
            
    except Exception as e:
        return JSONResponse({
            "error": str(e),
            "status": "error"
        }, status_code=500)



