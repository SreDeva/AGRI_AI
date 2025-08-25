import re
from typing import Optional


def validate_phone_number(phone_number: str) -> bool:
    """Validate phone number format"""
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)
    
    # Check if it starts with + and has country code
    if not cleaned.startswith('+'):
        return False
    
    # Check if it has at least 10 digits after country code
    if len(cleaned) < 10:
        return False
    
    return True


def format_phone_number(phone_number: str) -> str:
    """Format phone number to standard format"""
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)
    return cleaned


def mask_phone_number(phone_number: str) -> str:
    """Mask phone number for display (e.g., +91******1301)"""
    if len(phone_number) < 8:
        return phone_number
    
    return phone_number[:3] + "*" * (len(phone_number) - 7) + phone_number[-4:]


def generate_username_from_phone(phone_number: str) -> str:
    """Generate username from phone number"""
    # Remove + and country code, take last 6 digits
    digits_only = re.sub(r'[^\d]', '', phone_number)
    return f"user_{digits_only[-6:]}"


def validate_email(email: str) -> bool:
    """Validate email format"""
    if not email:
        return True  # Email is optional
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None


def clean_string(text: str) -> str:
    """Clean and normalize string input"""
    if not text:
        return text
    
    # Remove extra whitespace and normalize
    return " ".join(text.strip().split())


def format_farm_size(farm_size: str) -> str:
    """Format farm size input"""
    if not farm_size:
        return farm_size
    
    # Clean the input
    cleaned = clean_string(farm_size)
    
    # If it's just a number, assume acres
    if cleaned.replace('.', '').isdigit():
        return f"{cleaned} acres"
    
    return cleaned


def validate_age(age: int) -> bool:
    """Validate age range"""
    return 18 <= age <= 100 if age else True


def capitalize_name(name: str) -> str:
    """Capitalize each word in a name"""
    if not name:
        return name
    
    return " ".join(word.capitalize() for word in name.split())


class ValidationError(Exception):
    """Custom validation error"""
    pass


def validate_user_input(data: dict) -> dict:
    """Validate and clean user input data"""
    cleaned_data = {}
    
    for key, value in data.items():
        if value is None:
            cleaned_data[key] = value
            continue
            
        if key == 'phone_number':
            if not validate_phone_number(value):
                raise ValidationError("Invalid phone number format")
            cleaned_data[key] = format_phone_number(value)
            
        elif key == 'email':
            if not validate_email(value):
                raise ValidationError("Invalid email format")
            cleaned_data[key] = value.lower().strip() if value else None
            
        elif key == 'name':
            cleaned_data[key] = capitalize_name(clean_string(value))
            
        elif key == 'age':
            if not validate_age(value):
                raise ValidationError("Age must be between 18 and 100")
            cleaned_data[key] = value
            
        elif key == 'farm_size':
            cleaned_data[key] = format_farm_size(value)
            
        elif isinstance(value, str):
            cleaned_data[key] = clean_string(value)
            
        else:
            cleaned_data[key] = value
    
    return cleaned_data
