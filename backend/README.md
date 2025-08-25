# AGRI AI Backend

A comprehensive FastAPI backend with phone number authentication using Twilio OTP for agricultural applications.

## Features

- 📱 **Phone Number Authentication**: Secure signup/login using phone numbers with OTP verification
- 📧 **Twilio Integration**: SMS OTP delivery using Twilio service
- 👤 **User Management**: Complete user profiles with agricultural information
- 🔐 **JWT Authentication**: Secure token-based authentication
- 🗄️ **MongoDB Integration**: NoSQL database for flexible data storage
- 📊 **Comprehensive User Profiles**: Detailed farmer information including crops, livestock, equipment, and challenges
- 🔒 **Role-based Access Control**: User and Admin roles
- 📝 **Input Validation**: Comprehensive data validation and sanitization
- 🚀 **FastAPI**: High-performance, modern Python web framework
- 📖 **Auto-generated API Documentation**: Interactive Swagger UI documentation

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py          # App configuration and settings
│   ├── database/
│   │   ├── __init__.py
│   │   └── mongodb.py         # MongoDB connection and setup
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py            # User and OTP data models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── auth.py            # Pydantic schemas for API requests/responses
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py    # JWT token management
│   │   ├── twilio_service.py  # Twilio SMS integration
│   │   └── user_service.py    # User and OTP business logic
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication endpoints
│   │   └── users.py           # User management endpoints
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py            # Authentication middleware
│   │   └── logging.py         # Request logging middleware
│   └── utils/
│       ├── __init__.py
│       ├── helpers.py         # Utility helper functions
│       └── validators.py      # Data validation utilities
├── main.py                    # FastAPI application entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Installation

### Prerequisites

- Python 3.8+
- MongoDB
- Twilio Account

### Setup

1. **Clone the repository and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` file with your configurations:
   ```env
   # Twilio Configuration
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   
   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=agri_ai
   
   # JWT Configuration
   SECRET_KEY=your-super-secret-key-here
   ```

5. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

6. **Run the application**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Authentication Endpoints

#### Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone_number": "+919629321301"
}
```

#### Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone_number": "+919629321301",
  "otp_code": "123456"
}
```

#### User Signup
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "phone_number": "+919629321301",
  "otp_code": "123456",
  "name": "Deva",
  "email": "deva@example.com",
  "age": 34,
  "gender": "Male",
  "education_level": "Higher Secondary",
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
    "Lack of Modern Equipment"
  ]
}
```

#### User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone_number": "+919629321301",
  "otp_code": "123456"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer your_jwt_token
```

#### Update Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "name": "Updated Name",
  "location": "Updated Location",
  "crops": ["Rice", "Wheat", "Sugarcane"]
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh-token
Authorization: Bearer your_jwt_token
```

### User Endpoints

#### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer your_jwt_token
```

#### Get User by ID (Admin only)
```http
GET /api/v1/users/{user_id}
Authorization: Bearer admin_jwt_token
```

### Health Check Endpoints

#### Root Health Check
```http
GET /
```

#### General Health Check
```http
GET /health
```

#### API Health Check
```http
GET /api/v1/health
```

## Data Models

### User Model
The user model includes comprehensive agricultural information:

- **Basic Info**: Name, phone, email, age, gender, education
- **Farm Details**: Farm name, size, type, ownership, location
- **Agricultural Info**: Soil type, climate zone, primary crop, farming method
- **Infrastructure**: Irrigation type, equipment list
- **Economics**: Annual income, marketing channels
- **Operations**: Crops grown, livestock, challenges faced
- **System Fields**: Verification status, profile completion, role, timestamps

### Enums Used
- **Gender**: Male, Female, Other
- **Education Levels**: Elementary, Higher Secondary, Graduate, Post Graduate, Diploma, Others
- **Farm Types**: Small Scale (0-2 acres), Medium Scale (2-10 acres), Large Scale (10+ acres)
- **Farm Ownership**: Own Land, Rented, Sharecropping, Leased
- **Soil Types**: Red Soil, Black Soil, Alluvial Soil, Clay Soil, Sandy Soil, Loamy Soil
- **Climate Zones**: Tropical, Subtropical, Temperate, Arid, Semi-Arid
- **Farming Methods**: Traditional, Organic, Integrated, Precision
- **Irrigation Types**: Rain Fed, Bore Well, Canal, Drip Irrigation, Sprinkler
- **Marketing Channels**: Local Market, Wholesale, Direct to Consumer, Online Platform, Cooperative, Mandis

## Authentication Flow

1. **Send OTP**: User provides phone number, system generates and sends OTP via Twilio
2. **Verify OTP**: User enters OTP, system validates it
3. **Signup/Login**: 
   - **Signup**: New user provides complete profile information along with verified OTP
   - **Login**: Existing user just needs phone number and OTP
4. **JWT Token**: System generates JWT token for authenticated requests
5. **Authenticated Requests**: Client includes JWT token in Authorization header

## Security Features

- **Phone Number Validation**: Ensures proper phone number format with country code
- **OTP Expiration**: OTPs expire after 5 minutes
- **Rate Limiting**: Maximum 3 OTP verification attempts
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Input Validation**: Comprehensive validation using Pydantic models
- **Password Hashing**: BCrypt for secure password handling (if implemented)
- **CORS Protection**: Configurable CORS origins

## Error Handling

The API provides comprehensive error responses:

- **400 Bad Request**: Invalid input data, validation errors
- **401 Unauthorized**: Invalid or expired JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
black .
```

### Linting
```bash
flake8 .
```

### API Documentation
Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | AGRI AI Backend |
| `VERSION` | Application version | 1.0.0 |
| `DEBUG` | Debug mode | True |
| `MONGODB_URL` | MongoDB connection string | mongodb://localhost:27017 |
| `DATABASE_NAME` | MongoDB database name | agri_ai |
| `SECRET_KEY` | JWT secret key | Required |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration | 10080 (7 days) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | Required |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Required |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | Required |
| `OTP_EXPIRE_MINUTES` | OTP expiration time | 5 |
| `OTP_LENGTH` | OTP code length | 6 |
| `CORS_ORIGINS` | Allowed CORS origins | ["*"] |

## Production Deployment

1. **Set Production Environment Variables**:
   ```bash
   export DEBUG=False
   export SECRET_KEY=your-production-secret-key
   export MONGODB_URL=your-production-mongodb-url
   ```

2. **Use Production WSGI Server**:
   ```bash
   pip install gunicorn
   gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

3. **Setup Reverse Proxy** (Nginx recommended)

4. **SSL Certificate** (Let's Encrypt recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@agri-ai.com or create an issue in the repository.
