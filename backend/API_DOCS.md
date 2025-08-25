# AGRI AI Backend API Documentation

## Overview

The AGRI AI Backend provides a comprehensive RESTful API for agricultural applications with phone number-based authentication using Twilio OTP. This API enables user registration, authentication, and profile management specifically designed for farmers and agricultural professionals.

## Base URL

```
Development: http://localhost:8000
Production: https://your-domain.com
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. After successful login/signup, include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 🏥 Health Check

#### GET /
Root endpoint with basic information.

**Response:**
```json
{
  "message": "Welcome to AGRI AI Backend API",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-29",
  "version": "1.0.0"
}
```

#### GET /api/v1/health
API-specific health check.

**Response:**
```json
{
  "status": "healthy",
  "api_version": "v1",
  "timestamp": "2025-07-29"
}
```

### 🔐 Authentication Endpoints

#### POST /api/v1/auth/send-otp
Send OTP to phone number for verification.

**Request Body:**
```json
{
  "phone_number": "+919629321301"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully to +919629321301",
  "success": true
}
```

**Error Responses:**
- `400`: Invalid phone number format
- `500`: Failed to send OTP via Twilio

---

#### POST /api/v1/auth/verify-otp
Verify OTP without creating user account.

**Request Body:**
```json
{
  "phone_number": "+919629321301",
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "message": "OTP verified successfully",
  "success": true
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `400`: Invalid phone number or OTP format

---

#### POST /api/v1/auth/signup
Create new user account with complete profile.

**Request Body:**
```json
{
  "phone_number": "+919629321301",
  "otp_code": "123456",
  "name": "Deva",
  "email": "deva@example.com",
  "age": 34,
  "gender": "Male",
  "education_level": "Higher Secondary",
  "farm_name": "Green Fields Farm",
  "farm_size": "4 acres",
  "location": "Palani",
  "experience": 7,
  "farm_type": "Medium Scale (2-10 acres)",
  "farm_ownership": "Own Land",
  "soil_type": "Red Soil",
  "climate_zone": "Tropical",
  "primary_crop": "Rice",
  "farming_method": "Traditional",
  "irrigation_type": "Bore Well",
  "marketing_channel": "Local Market",
  "annual_income": "600000",
  "crops": ["Rice", "Sugarcane"],
  "livestock": ["Cattle"],
  "equipment": ["Tractor", "Plough"],
  "challenges": [
    "Pest/Disease Management",
    "Market Price Fluctuation",
    "Lack of Modern Equipment",
    "Poor Soil Quality",
    "Weather Uncertainty"
  ]
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "6884a7e182b4b80f10667d56",
    "phone_number": "+919629321301",
    "name": "Deva",
    "email": "deva@example.com",
    "age": 34,
    "gender": "Male",
    "education_level": "Higher Secondary",
    "farm_name": "Green Fields Farm",
    "farm_size": "4 acres",
    "location": "Palani",
    "experience": 7,
    "farm_type": "Medium Scale (2-10 acres)",
    "farm_ownership": "Own Land",
    "soil_type": "Red Soil",
    "climate_zone": "Tropical",
    "primary_crop": "Rice",
    "farming_method": "Traditional",
    "irrigation_type": "Bore Well",
    "marketing_channel": "Local Market",
    "annual_income": "600000",
    "crops": ["Rice", "Sugarcane"],
    "livestock": ["Cattle"],
    "equipment": ["Tractor", "Plough"],
    "challenges": [
      "Pest/Disease Management",
      "Market Price Fluctuation",
      "Lack of Modern Equipment",
      "Poor Soil Quality",
      "Weather Uncertainty"
    ],
    "is_phone_verified": true,
    "is_profile_complete": true,
    "role": "USER"
  }
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `400`: User with phone number already exists
- `400`: Validation errors in request data

---

#### POST /api/v1/auth/login
Login existing user with phone number and OTP.

**Request Body:**
```json
{
  "phone_number": "+919629321301",
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "6884a7e182b4b80f10667d56",
    "phone_number": "+919629321301",
    "name": "Deva",
    "email": "deva@example.com",
    // ... complete user object
  }
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `404`: User not found (need to signup first)

---

#### GET /api/v1/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "6884a7e182b4b80f10667d56",
  "phone_number": "+919629321301",
  "name": "Deva",
  "email": "deva@example.com",
  // ... complete user object
}
```

**Error Responses:**
- `401`: Invalid or expired token
- `403`: Phone number not verified

---

#### PUT /api/v1/auth/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "age": 35,
  "location": "Updated Location",
  "crops": ["Rice", "Wheat", "Sugarcane"],
  "annual_income": "700000"
}
```

**Response (200):**
```json
{
  "id": "6884a7e182b4b80f10667d56",
  "phone_number": "+919629321301",
  "name": "Updated Name",
  // ... updated user object
}
```

**Error Responses:**
- `401`: Invalid or expired token
- `400`: No changes were made
- `400`: Validation errors

---

#### POST /api/v1/auth/refresh-token
Refresh JWT access token.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    // ... complete user object
  }
}
```

### 👤 User Management Endpoints

#### GET /api/v1/users/profile
Get current user's profile (alias for /auth/me).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "6884a7e182b4b80f10667d56",
  "phone_number": "+919629321301",
  // ... complete user object
}
```

---

#### GET /api/v1/users/{user_id}
Get user by ID (Admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200):**
```json
{
  "id": "6884a7e182b4b80f10667d56",
  "phone_number": "+919629321301",
  // ... complete user object
}
```

**Error Responses:**
- `403`: Admin access required
- `404`: User not found

## Data Models

### User Object

```json
{
  "id": "string",                        // MongoDB ObjectId
  "phone_number": "string",              // Phone with country code
  "name": "string | null",               // User's full name
  "email": "string | null",              // Email address
  "age": "integer | null",               // Age (18-100)
  "gender": "enum | null",               // Male, Female, Other
  "education_level": "enum | null",      // Educational qualification
  "farm_name": "string | null",          // Name of the farm
  "farm_size": "string | null",          // Size of farm (e.g., "4 acres")
  "location": "string | null",           // Geographic location
  "experience": "integer | null",        // Years of farming experience
  "farm_type": "enum | null",            // Farm scale category
  "farm_ownership": "enum | null",       // Ownership type
  "soil_type": "enum | null",            // Type of soil
  "climate_zone": "enum | null",         // Climate classification
  "primary_crop": "string | null",       // Main crop grown
  "farming_method": "enum | null",       // Farming approach
  "irrigation_type": "enum | null",      // Irrigation method
  "marketing_channel": "enum | null",    // How products are sold
  "annual_income": "string | null",      // Yearly income
  "crops": "array<string>",              // List of crops grown
  "livestock": "array<string>",          // List of livestock
  "equipment": "array<string>",          // List of equipment owned
  "challenges": "array<string>",         // List of farming challenges
  "is_phone_verified": "boolean",        // Phone verification status
  "is_profile_complete": "boolean",      // Profile completion status
  "role": "enum"                         // USER or ADMIN
}
```

### Enums

#### Gender
- `Male`
- `Female`
- `Other`

#### Education Level
- `Elementary`
- `Higher Secondary`
- `Graduate`
- `Post Graduate`
- `Diploma`
- `Others`

#### Farm Type
- `Small Scale (0-2 acres)`
- `Medium Scale (2-10 acres)`
- `Large Scale (10+ acres)`

#### Farm Ownership
- `Own Land`
- `Rented`
- `Sharecropping`
- `Leased`

#### Soil Type
- `Red Soil`
- `Black Soil`
- `Alluvial Soil`
- `Clay Soil`
- `Sandy Soil`
- `Loamy Soil`

#### Climate Zone
- `Tropical`
- `Subtropical`
- `Temperate`
- `Arid`
- `Semi-Arid`

#### Farming Method
- `Traditional`
- `Organic`
- `Integrated`
- `Precision`

#### Irrigation Type
- `Rain Fed`
- `Bore Well`
- `Canal`
- `Drip Irrigation`
- `Sprinkler`

#### Marketing Channel
- `Local Market`
- `Wholesale`
- `Direct to Consumer`
- `Online Platform`
- `Cooperative`
- `Mandis`

#### Role
- `USER`
- `ADMIN`

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Invalid or missing authentication
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **422**: Validation Error - Request data validation failed
- **500**: Internal Server Error - Server-side error

## Rate Limiting

- **OTP Generation**: 1 request per minute per phone number
- **OTP Verification**: Maximum 3 attempts per OTP
- **OTP Expiration**: 5 minutes

## Security Features

1. **Phone Number Validation**: Ensures proper format with country code
2. **OTP Security**: Time-limited with attempt restrictions
3. **JWT Tokens**: Secure authentication with configurable expiration
4. **Input Validation**: Comprehensive data validation
5. **CORS Protection**: Configurable allowed origins

## Example Usage Flow

### 1. Complete Registration Flow

```bash
# Step 1: Send OTP
curl -X POST "http://localhost:8000/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919629321301"}'

# Step 2: Sign up with OTP and profile data
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919629321301",
    "otp_code": "123456",
    "name": "Farmer Name",
    "age": 34,
    "gender": "Male",
    "location": "Farm Location",
    "farm_size": "4 acres",
    "primary_crop": "Rice"
  }'

# Step 3: Use the returned token for authenticated requests
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <token_from_signup>"
```

### 2. Login Flow

```bash
# Step 1: Send OTP
curl -X POST "http://localhost:8000/api/v1/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919629321301"}'

# Step 2: Login with OTP
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919629321301",
    "otp_code": "123456"
  }'
```

## Integration Notes

### Frontend Integration

1. **React Native**: Use AsyncStorage to persist JWT tokens
2. **React Web**: Use localStorage or secure cookies
3. **Flutter**: Use flutter_secure_storage for token storage

### Mobile App Considerations

1. **Auto OTP Detection**: Implement SMS auto-read functionality
2. **Biometric Auth**: Store JWT securely and use biometrics for app unlock
3. **Offline Support**: Cache user profile data for offline access

## Development Tools

- **Interactive Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)
- **Health Check**: `http://localhost:8000/health`

This API documentation provides complete coverage of all available endpoints and their usage patterns for the AGRI AI Backend system.
