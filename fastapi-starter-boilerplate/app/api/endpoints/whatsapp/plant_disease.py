import os
import logging
import httpx
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import GenerativeModel
import base64

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables")
    raise ValueError("GEMINI_API_KEY is required")

genai.configure(api_key=GEMINI_API_KEY)
gemini_vision_model = GenerativeModel("gemini-2.0-flash-exp")

async def analyze_plant_image(image_url: str, auth=None) -> str:
    """
    Analyzes a plant image using Google Gemini Vision API.
    """
    try:
        logger.info(f"Analyzing image from URL: {image_url}")
        logger.info(f"Auth provided: {auth is not None}")

        # Download the image content from the URL with authentication
        async with httpx.AsyncClient(follow_redirects=True) as http_client:
            logger.info("Starting image download...")
            response = await http_client.get(image_url, auth=auth)
            logger.info(f"Download response status: {response.status_code}")
            response.raise_for_status()
            image_bytes = response.content
            logger.info(f"Downloaded image size: {len(image_bytes)} bytes")

        # Convert image to base64 for Gemini
        logger.info("Converting image to base64...")
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        logger.info(f"Base64 conversion complete, length: {len(image_base64)}")
        
        # Create the prompt for plant disease analysis
        prompt = """
        Analyze this plant image for diseases or health issues. Provide:
        1. Plant type (if identifiable)
        2. Overall health status
        3. Any visible diseases, pests, or deficiencies
        4. Recommended treatment or care
        
        Keep the response under 200 words and practical for farmers.
        """

        # Prepare the image data for Gemini
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_base64
        }

        logger.info("Sending request to Gemini...")
        # Generate content with image and text
        response = gemini_vision_model.generate_content([prompt, image_part])
        
        result = response.text.strip()
        logger.info(f"Gemini analysis result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error during image analysis: {e}", exc_info=True)
        return "An error occurred while analyzing the image. Please try again or describe the plant symptoms in text."

async def analyze_plant_image_local(image_path: str) -> str:
    """
    Analyzes a local plant image file using Google Gemini Vision API.
    """
    try:
        logger.info(f"Analyzing local image: {image_path}")
        
        # Read the local image file
        with open(image_path, "rb") as image_file:
            image_bytes = image_file.read()
            logger.info(f"Read local image size: {len(image_bytes)} bytes")

        # Convert image to base64 for Gemini
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Create the prompt for plant disease analysis
        prompt = """
        Analyze this plant image for diseases or health issues. Provide:
        1. Plant type (if identifiable)
        2. Overall health status
        3. Any visible diseases, pests, or deficiencies
        4. Recommended treatment or care
        
        Keep the response under 200 words and practical for farmers.
        """

        # Prepare the image data for Gemini
        image_part = {
            "mime_type": "image/jpeg",
            "data": image_base64
        }

        logger.info("Sending request to Gemini...")
        # Generate content with image and text
        response = gemini_vision_model.generate_content([prompt, image_part])
        
        result = response.text.strip()
        logger.info(f"Gemini analysis result: {result}")
        return result

    except Exception as e:
        logger.error(f"Error during local image analysis: {e}")
        return "An error occurred while analyzing the image. Please try again."
