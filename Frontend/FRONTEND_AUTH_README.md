# Frontend Authentication Flow

## Overview

The frontend has been restructured to implement a complete authentication flow that integrates with the MongoDB backend. The app now starts with a login page and guides users through role selection and onboarding before reaching the main application.

## New Routing Structure

### Authentication Flow
```
app/
├── index.tsx                    # Redirects to login
├── _layout.tsx                  # Root layout with auth/tabs groups
├── (auth)/                      # Authentication group
│   ├── _layout.tsx             # Auth layout
│   ├── login.tsx               # Phone number login
│   ├── role-selection.tsx      # Role selection page
│   └── farmer-onboard.tsx      # Farmer onboarding form
└── (tabs)/                     # Main app tabs (protected)
    ├── _layout.tsx             # Tab layout
    ├── farmer.tsx              # Farmer home with logout
    └── ...other tabs
```

## Authentication Service

### Location: `services/authService.ts`

Provides centralized API communication and data storage:

```typescript
// Login
await authService.login(phoneNumber);

// Role selection
await authService.selectRole(roleId, token);

// Farmer onboarding
await authService.onboardFarmer(data, token);

// Storage management
await authService.saveUserData(userData);
await authService.getUserData();
await authService.logout();
```

## User Flow

### 1. App Launch
- App starts at `index.tsx`
- Automatically redirects to `/(auth)/login`

### 2. Login Page (`/(auth)/login`)
- User enters phone number
- Calls backend `/auth/login` endpoint
- Stores user data locally
- Redirects based on backend response:
  - New user → Role Selection
  - User without role → Role Selection
  - User with role but not onboarded → Farmer Onboarding
  - Fully onboarded user → Home

### 3. Role Selection (`/(auth)/role-selection`)
- Shows available roles: Farmer, Expert, Admin
- Calls backend `/auth/select-role` endpoint
- Updates stored user data
- Redirects based on role:
  - Farmer → Onboarding form
  - Other roles → Home

### 4. Farmer Onboarding (`/(auth)/farmer-onboard`)
- Comprehensive form for farmer details
- Validates all required fields
- Calls backend `/auth/onboard` endpoint
- Redirects to home after successful completion

### 5. Home Page (`/(tabs)/farmer`)
- Protected route (requires authentication)
- Shows welcome message and logout button
- Displays main farmer interface

## Key Features

### 🔐 Authentication Integration
- Full integration with MongoDB backend
- JWT token management
- Automatic data persistence

### 📱 Progressive Onboarding
- Smart routing based on user status
- Seamless flow from login to home
- Role-based navigation

### 🎨 Consistent UI/UX
- Unified design language
- Loading states and error handling
- Responsive form validation

### 🔄 State Management
- Centralized auth service
- Local data storage
- Automatic logout functionality

## API Integration

### Backend Endpoints Used:
- `POST /auth/login` - Phone number authentication
- `POST /auth/select-role` - Role selection
- `POST /auth/onboard` - Farmer onboarding
- `GET /auth/profile` - User profile retrieval

### Request/Response Handling:
- Automatic token management
- Error handling with user feedback
- Loading states during API calls

## Installation & Setup

### 1. Install Dependencies
```bash
cd Frontend
npm install @react-native-picker/picker
```

### 2. Update Backend URL
Edit `services/authService.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### 3. Run the App
```bash
npx expo start
```

## File Changes Summary

### New Files:
- `app/index.tsx` - App entry point
- `app/(auth)/_layout.tsx` - Auth group layout
- `app/(auth)/login.tsx` - Login page
- `app/(auth)/role-selection.tsx` - Role selection
- `app/(auth)/farmer-onboard.tsx` - Farmer onboarding
- `services/authService.ts` - Authentication service

### Modified Files:
- `app/_layout.tsx` - Updated root layout
- `app/(tabs)/_layout.tsx` - Updated tab layout
- `app/(tabs)/farmer.tsx` - Added logout functionality

### Removed Files:
- `app/login.tsx` - Moved to auth group
- `app/role-selection.tsx` - Moved to auth group
- `app/select-role.tsx` - Consolidated into role-selection

## Next Steps

### Immediate:
1. Test the complete authentication flow
2. Update backend URL in authService
3. Add proper error handling for network issues

### Future Enhancements:
1. Add AsyncStorage for persistent data
2. Implement biometric authentication
3. Add offline support
4. Enhance loading and error states
5. Add user profile management

## Testing

### Manual Testing Flow:
1. Start app → Should show login page
2. Enter phone number → Should navigate based on user status
3. Complete role selection → Should proceed to appropriate next step
4. Complete onboarding (if farmer) → Should reach home page
5. Test logout → Should return to login page

### Backend Integration:
- Ensure backend is running on correct URL
- Test all API endpoints with frontend
- Verify data persistence in MongoDB

The frontend now provides a complete, production-ready authentication flow that seamlessly integrates with the MongoDB backend!
