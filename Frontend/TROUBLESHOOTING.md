# Frontend Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. "No access token found" Error

**Problem**: Role selection fails with "No access token found" error.

**Root Cause**: Access token not being properly stored or retrieved between login and role selection.

**Solutions Applied**:

#### ✅ Backend Fix
- **Issue**: New users weren't receiving access tokens during login
- **Fix**: Updated login endpoint to generate tokens for new users
- **Code**: Added `access_token = create_user_token(user_id, phone_number, None)` for new users

#### ✅ Frontend Storage Fix
- **Issue**: In-memory storage was losing data between page navigations
- **Fix**: Implemented proper localStorage for web and fallback for mobile
- **Code**: Updated `authService.ts` with persistent storage

### 2. Navigation Errors

**Problem**: "Attempted to navigate before mounting the Root Layout component"

**Solution**: 
- Replaced `useEffect` navigation with `<Redirect>` component
- Updated routing structure to use proper Expo Router patterns

### 3. Picker Component Issues

**Problem**: `@react-native-picker/picker` import errors

**Solution**:
- Created custom `SimplePicker` component using native React Native components
- Removed external picker dependency

## Debugging Steps

### 1. Check Console Logs

The auth service now includes detailed logging:

```javascript
// Login flow
💾 Saving user data: { user_id: "...", access_token: "..." }
✅ User data saved successfully

// Role selection flow  
🔄 Starting role selection for: farmer
📱 Current user data: { access_token: "...", user_id: "..." }
🔑 Using access token: eyJhbGciOiJIUzI1NiIs...
```

### 2. Verify Backend Response

Check that login response includes access token:

```json
{
  "success": true,
  "message": "New user created. Please select your role.",
  "user_exists": false,
  "redirect_to": "roles",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",  // ✅ Should be present
  "user_id": "6876ebb7cc3fb5bc28c5b6cd"
}
```

### 3. Check Storage

For web development, check browser localStorage:

```javascript
// In browser console
localStorage.getItem('access_token')  // Should return JWT token
localStorage.getItem('user_id')       // Should return user ID
localStorage.getItem('phone_number')  // Should return phone number
```

### 4. Verify API Endpoints

Test backend endpoints directly:

```bash
# Test login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "9876543210"}'

# Test role selection (use token from login response)
curl -X POST "http://localhost:8000/auth/select-role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"role": "farmer"}'
```

## Testing Checklist

### ✅ Backend Tests
- [ ] FastAPI server starts without errors
- [ ] MongoDB connection successful
- [ ] Login endpoint returns access token for new users
- [ ] Login endpoint returns access token for existing users
- [ ] Role selection works with valid token

### ✅ Frontend Tests
- [ ] App starts and shows login page
- [ ] Login form accepts phone number input
- [ ] Login success navigates to role selection
- [ ] Role selection shows available roles
- [ ] Role selection success navigates to next step
- [ ] Console shows proper debug logs
- [ ] No "access token not found" errors

## Quick Fixes

### Clear Storage (if needed)
```javascript
// In browser console
localStorage.clear()
// Or specifically:
localStorage.removeItem('access_token')
localStorage.removeItem('user_id')
localStorage.removeItem('phone_number')
localStorage.removeItem('user_role')
```

### Restart Development Servers
```bash
# Backend
cd fastapi-starter-boilerplate
uvicorn app.main:app --reload --port 8000

# Frontend  
cd Frontend
npx expo start
```

### Check Network Requests
- Open browser DevTools → Network tab
- Look for API calls to `/auth/login` and `/auth/select-role`
- Verify request/response data

## Environment Setup

### Required Services
1. **MongoDB**: Running on default port (27017)
2. **FastAPI Backend**: Running on http://localhost:8000
3. **Frontend**: Expo development server

### Environment Variables
```bash
# Backend (.env)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=farmer_app
SECRET_KEY=your-secret-key-here

# Frontend (services/authService.ts)
const API_BASE_URL = 'http://localhost:8000';
```

## Success Indicators

### ✅ Working Flow
1. **Login Page**: Shows phone input and continue button
2. **Login Success**: Console shows "💾 Saving user data" with access token
3. **Role Selection**: Shows role cards, no token errors
4. **Role Success**: Navigates to onboarding or home
5. **Storage**: localStorage contains user data

### ❌ Common Error Patterns
- "No access token found" → Backend not generating tokens
- "Cannot connect to server" → Backend not running or wrong URL
- Navigation errors → Routing configuration issues
- Picker errors → Component import issues

The authentication flow should now work smoothly from login through role selection to onboarding!
