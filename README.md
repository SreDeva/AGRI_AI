# 🌾 Farmer Assistant - AI-Powered Agricultural Platform

A comprehensive agricultural assistance platform that combines AI technology, weather forecasting, plant disease detection, and expert consultation to help farmers make informed decisions and improve crop yields.

## 🚀 Features

### 🤖 AI Assistant
- **Multi-language Support**: Tamil, Hindi, Malayalam, and English
- **Voice Input/Output**: Speech-to-text and text-to-speech using Sarvam API
- **Smart Responses**: Powered by Google Gemini AI for agricultural queries
- **Context-aware**: Maintains conversation history for better assistance

### 🌱 Plant Disease Detection
- **Image Analysis**: Upload plant images for disease identification
- **AI-Powered Diagnosis**: Uses Google Gemini Vision for accurate plant health assessment
- **Treatment Recommendations**: Provides practical solutions for identified issues
- **Multi-format Support**: Works with various image formats

### 🌤️ Weather Services
- **Location-based Forecasts**: Dynamic weather data based on user location
- **Farming Advice**: Weather-specific agricultural recommendations
- **Multi-day Forecasts**: Up to 7-day weather predictions
- **Smart Notifications**: Proactive weather alerts for farming activities

### 👨‍🌾 Expert Consultation
- **Expert Directory**: Browse agricultural experts by specialization
- **Search & Filter**: Find experts by location, expertise, and language
- **Contact Integration**: Direct communication with agricultural professionals
- **Admin Portal**: Manage expert profiles (admin access: 9629321301)

### 📱 WhatsApp Integration
- **Twilio Integration**: Complete WhatsApp bot functionality
- **Media Support**: Handle text, voice, and image messages
- **Location Sharing**: GPS-based weather services
- **Multi-language**: Automatic language detection and response

### 🔐 Authentication & User Management
- **Phone-based Login**: Simple authentication using phone numbers
- **Role-based Access**: Farmer and hobbyist user roles
- **MongoDB Backend**: Secure user data storage
- **Progressive Onboarding**: Smart user registration flow

## 🏗️ Architecture

### Backend (FastAPI)
```
fastapi-starter-boilerplate/
├── app/
│   ├── api/
│   │   ├── endpoints/          # API endpoints
│   │   │   ├── ai_assistant/   # AI chat functionality
│   │   │   ├── weather/        # Weather services
│   │   │   ├── whatsapp/       # WhatsApp bot
│   │   │   └── experts.py      # Expert management
│   │   └── routers/            # Route organization
│   ├── core/                   # Core configurations
│   ├── models/                 # Database models
│   ├── schemas/                # Pydantic schemas
│   └── services/               # Business logic
└── requirements.txt
```

### Frontend (React Native + Expo)
```
Frontend/
├── app/
│   ├── (auth)/                 # Authentication screens
│   │   ├── login.tsx
│   │   ├── role-selection.tsx
│   │   └── farmer-onboard.tsx
│   └── (tabs)/                 # Main app screens
│       ├── farmer.tsx          # Home screen
│       ├── ai-assistant.tsx    # AI chat
│       ├── weather.tsx         # Weather services
│       └── call-expert.tsx     # Expert consultation
├── components/                 # Reusable components
└── services/                   # API services
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **AI/ML**: Google Gemini AI, OpenAI Whisper
- **APIs**: Sarvam AI (STT/TTS), Open-Meteo (Weather)
- **Communication**: Twilio (WhatsApp), WebSockets
- **Authentication**: JWT tokens

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: Custom components with Expo Vector Icons
- **Audio**: Expo Audio/AV for voice features
- **Camera**: Expo Camera and Image Picker
- **HTTP Client**: Axios

### External Services
- **Sarvam AI**: Tamil speech recognition and synthesis
- **Google Gemini**: AI responses and image analysis
- **Open-Meteo**: Weather forecasting
- **Twilio**: WhatsApp Business API
- **MongoDB Atlas**: Cloud database

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or Atlas)
- **Expo CLI** (`npm install -g @expo/cli`)

## 🚀 Installation & Setup

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd saveetha/fastapi-starter-boilerplate
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# Database
MONGODB_URL=mongodb://localhost:27017/farmer_assistant
DATABASE_NAME=farmer_app

# JWT Configuration
SECRET_KEY=your-secret-key-change-this-in-production-make-it-long-and-random
REFRESH_SECRET_KEY=your-refresh-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=43200
REFRESH_TOKEN_EXPIRE_DAYS=10080

# AI Services API Keys
SARVAM_API_KEY=your-sarvam-api-key
GEMINI_API_KEY=your-gemini-api-key

# Twilio Configuration (for WhatsApp)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-whatsapp-number

# Other configurations
DEBUG=True
LOG_LEVEL=INFO
```

⚠️ **Security Note**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

5. **Run the backend**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../Frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
# Backend API URLs
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_LEASE_API_URL=http://localhost:8081

# External API Keys
EXPO_PUBLIC_OPENWEATHER_API_KEY=your-openweather-api-key
EXPO_PUBLIC_SARVAM_API_KEY=your-sarvam-api-key

# Other configuration
EXPO_PUBLIC_DEBUG=true
```

4. **Start the development server**
```bash
npx expo start
```

## 📱 Usage

### Mobile App
1. **Login**: Enter your phone number
2. **Role Selection**: Choose between Farmer or Hobbyist
3. **Onboarding**: Complete profile setup (for new users)
4. **Home Screen**: Access all features from the main dashboard

### WhatsApp Bot
1. **Setup**: Configure Twilio webhook to point to your backend
2. **Usage**: Send messages, images, or voice notes to the WhatsApp number
3. **Features**: Get AI responses, weather updates, and plant disease analysis

### API Endpoints
- **Authentication**: `/auth/login`, `/auth/onboard`
- **AI Assistant**: `/ai-assistant/text`, `/ai-assistant/voice`
- **Weather**: `/weather/forecast-advice`
- **Experts**: `/experts/`, `/experts/search`
- **WhatsApp**: `/whatsapp/webhook`

## 🔧 Configuration

### Language Support
The app supports multiple languages with automatic detection:
- Tamil (primary)
- Hindi
- Malayalam
- English

### Admin Access
Admin features are available for phone number: `9629321301`
- Manage expert profiles
- Access admin dashboard
- System configuration

## 🔒 Security

### Environment Variables
All sensitive information is stored in environment variables:
- **API Keys**: Sarvam AI, Google Gemini
- **Database URLs**: MongoDB connection strings
- **JWT Secrets**: Token signing keys
- **Twilio Credentials**: WhatsApp integration

### Best Practices
- ✅ All API keys moved to environment variables
- ✅ `.env` file excluded from version control
- ✅ JWT tokens for authentication
- ✅ Input validation on all endpoints
- ✅ Error handling without exposing sensitive data

### Before Deployment
1. Generate strong, unique secret keys
2. Use production database URLs
3. Enable HTTPS in production
4. Set up proper CORS policies
5. Configure rate limiting

📋 **See [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) for a complete security checklist before deployment.**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sarvam AI** for Tamil language processing
- **Google Gemini** for AI capabilities
- **Open-Meteo** for weather data
- **Twilio** for WhatsApp integration
- **Expo** for React Native development tools

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Built with ❤️ for farmers and agricultural communities**
