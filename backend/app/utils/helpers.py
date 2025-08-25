from datetime import datetime, timezone
import json
from typing import Any, Dict
from bson import ObjectId
from decimal import Decimal


def datetime_to_str(dt: datetime) -> str:
    """Convert datetime to ISO string"""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def str_to_datetime(dt_str: str) -> datetime:
    """Convert ISO string to datetime"""
    return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB objects"""
    
    def default(self, obj: Any) -> Any:
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, datetime):
            return datetime_to_str(obj)
        elif isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def serialize_dict(data: Dict) -> Dict:
    """Serialize dictionary with MongoDB objects"""
    if not isinstance(data, dict):
        return data
    
    serialized = {}
    for key, value in data.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = datetime_to_str(value)
        elif isinstance(value, dict):
            serialized[key] = serialize_dict(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_dict(item) if isinstance(item, dict) else item for item in value]
        else:
            serialized[key] = value
    
    return serialized


def convert_objectid_to_str(data: Any) -> Any:
    """Recursively convert ObjectId to string in nested data structures"""
    if isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, dict):
        return {key: convert_objectid_to_str(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    else:
        return data


def safe_dict_get(data: dict, key: str, default: Any = None) -> Any:
    """Safely get value from dictionary"""
    try:
        return data.get(key, default)
    except (AttributeError, TypeError):
        return default


def remove_none_values(data: dict) -> dict:
    """Remove None values from dictionary"""
    return {k: v for k, v in data.items() if v is not None}


def flatten_dict(data: dict, parent_key: str = '', sep: str = '.') -> dict:
    """Flatten nested dictionary"""
    items = []
    for key, value in data.items():
        new_key = f"{parent_key}{sep}{key}" if parent_key else key
        if isinstance(value, dict):
            items.extend(flatten_dict(value, new_key, sep=sep).items())
        else:
            items.append((new_key, value))
    return dict(items)


def unflatten_dict(data: dict, sep: str = '.') -> dict:
    """Unflatten dictionary"""
    result = {}
    for key, value in data.items():
        keys = key.split(sep)
        d = result
        for k in keys[:-1]:
            if k not in d:
                d[k] = {}
            d = d[k]
        d[keys[-1]] = value
    return result
