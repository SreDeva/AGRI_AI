# Authentication System Documentation

## Overview

This authentication system provides a complete login and onboarding flow for the Farmer Assistant application. It uses MongoDB for data storage and JWT tokens for authentication.

## Features

- **Phone-based Authentication**: Users login with their phone number
- **Role-based Access**: Support for different user roles (farmer, admin, expert)
- **Progressive Onboarding**: Different flows based on user status
- **JWT Token Authentication**: Secure token-based authentication
- **Farmer Profile Management**: Complete farmer onboarding with detailed information

## API Endpoints

### 1. Login
**POST** `/auth/login`

Login with phone number and get appropriate redirect based on user status.

**Request Body:**
```json
{
  "phone_number": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome back!",
  "user_exists": true,
  "redirect_to": "home",
  "access_token": "jwt_token_here",
  "user_id": "user_id_here",
  "user_role": "farmer"
}
```

**Redirect Logic:**
- New user → `roles` (role selection page)
- Existing user without role → `roles`
- User with role but not onboarded → `onboarding`
- Fully onboarded user → `home`

### 2. Role Selection
**POST** `/auth/select-role`

Set user role after login (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "role": "farmer"
}
```

**Available Roles:**
- `farmer`: Agricultural users
- `admin`: System administrators
- `expert`: Agricultural experts

### 3. Farmer Onboarding
**POST** `/auth/onboard`

Complete farmer profile (requires authentication and farmer role).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Farmer",
  "age": 35,
  "location": "Tamil Nadu, India",
  "farm_size": 5.5,
  "crops": ["rice", "wheat", "tomato"],
  "experience_years": 10,
  "education_level": "High School",
  "annual_income": 150000,
  "has_irrigation": true,
  "farming_type": "mixed"
}
```

### 4. User Profile
**GET** `/auth/profile`

Get current user profile with farmer details if available.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Database Schema

### Users Collection
```javascript
{
  "_id": ObjectId,
  "phone_number": "9876543210",
  "role": "farmer", // null initially
  "is_onboarded": false,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Farmers Collection
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId, // Reference to users collection
  "phone_number": "9876543210",
  "name": "John Farmer",
  "age": 35,
  "location": "Tamil Nadu, India",
  "farm_size": 5.5,
  "crops": ["rice", "wheat", "tomato"],
  "experience_years": 10,
  "education_level": "High School",
  "annual_income": 150000,
  "has_irrigation": true,
  "farming_type": "mixed",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   pip install motor pymongo python-jose[cryptography] passlib[bcrypt]
   ```

2. **MongoDB Setup:**
   - Install MongoDB locally or use MongoDB Atlas
   - Default connection: `mongodb://localhost:27017`
   - Default database: `farmer_app`

3. **Environment Variables:**
   Copy `.env.example` to `.env` and update:
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=farmer_app
   SECRET_KEY=your-secret-key-here
   ```

4. **Run the Application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Testing

Run the test script to verify the authentication flow:

```bash
python test_auth.py
```

This will test:
- New user login and role selection
- Farmer onboarding process
- Profile retrieval
- Existing user login

## Security Features

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: Uses bcrypt for secure password hashing (if needed)
- **Role-based Access**: Different endpoints for different user roles
- **Token Expiration**: Configurable token expiration (default: 30 days)

## Error Handling

The API provides comprehensive error handling with appropriate HTTP status codes:

- `400`: Bad Request (invalid data)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error (server issues)

## Integration with Frontend

The authentication system is designed to work with a progressive web app flow:

1. **Login Page**: Collect phone number
2. **Role Selection**: If new user or no role set
3. **Onboarding Form**: If farmer role selected
4. **Home Page**: After successful authentication/onboarding

Each response includes a `redirect_to` field indicating the next page to show.
