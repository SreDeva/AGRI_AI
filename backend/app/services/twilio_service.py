import random
import string
from datetime import datetime, timedelta
from typing import Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from app.core.config import settings


class TwilioService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER

    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP of specified length"""
        return ''.join(random.choices(string.digits, k=length))

    async def send_otp(self, phone_number: str, otp: str) -> dict:
        """Send OTP via SMS using Twilio"""
        try:
            message_body = f"Your AGRI AI verification code is: {otp}. This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes."
            
            message = self.client.messages.create(
                from_=self.from_number,
                body=message_body,
                to=phone_number
            )
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "error": None
            }
            
        except TwilioException as e:
            return {
                "success": False,
                "message_sid": None,
                "status": "failed",
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "message_sid": None,
                "status": "failed",
                "error": f"Unexpected error: {str(e)}"
            }

    async def send_welcome_message(self, phone_number: str, name: str) -> dict:
        """Send welcome message to new users"""
        try:
            message_body = f"Welcome to AGRI AI, {name}! Your account has been successfully created. We're here to help you with your farming journey."
            
            message = self.client.messages.create(
                from_=self.from_number,
                body=message_body,
                to=phone_number
            )
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "error": None
            }
            
        except TwilioException as e:
            return {
                "success": False,
                "message_sid": None,
                "status": "failed",
                "error": str(e)
            }
        except Exception as e:
            return {
                "success": False,
                "message_sid": None,
                "status": "failed",
                "error": f"Unexpected error: {str(e)}"
            }


# Global instance
twilio_service = TwilioService()
