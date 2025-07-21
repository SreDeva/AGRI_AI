# Frontend Authentication Flow Testing Guide

## Prerequisites

1. **Backend Running**: Ensure the FastAPI backend is running on `http://localhost:8000`
2. **MongoDB**: Make sure MongoDB is running and accessible
3. **Frontend**: Start the Expo development server

## Testing Steps

### 1. Start the Application
```bash
cd Frontend
npx expo start
```

### 2. Test Login Flow

#### New User Flow:
1. **Launch App** → Should automatically navigate to login page
2. **Enter Phone Number**: Try `9876543210`
3. **Tap Continue** → Should navigate to role selection page
4. **Select Role**: Choose "Farmer"
5. **Continue** → Should navigate to farmer onboarding form
6. **Fill Form**: Complete all required fields:
   - Name: "Test Farmer"
   - Age: 30
   - Location: "Tamil Nadu, India"
   - Farm Size: 5.5
   - Crops: Add "rice", "wheat"
   - Experience: 10 years
   - Education: Select from dropdown
   - Farming Type: Select from dropdown
7. **Submit** → Should navigate to farmer home page

#### Existing User Flow:
1. **Use Same Phone**: Enter `9876543210` again
2. **Tap Continue** → Should directly navigate to home page (skipping onboarding)

### 3. Test Home Page
1. **Welcome Message**: Should show "Welcome to Farmer Assistant! 🌱"
2. **Logout Button**: Should be visible in top-right
3. **Main Content**: Should show the Farmer component

### 4. Test Logout
1. **Tap Logout** → Should show confirmation dialog
2. **Confirm Logout** → Should navigate back to login page
3. **Try Accessing Home** → Should redirect to login (if implemented)

## Expected API Calls

### Login Request:
```json
POST /auth/login
{
  "phone_number": "9876543210"
}
```

### Role Selection Request:
```json
POST /auth/select-role
Headers: { "Authorization": "Bearer <token>" }
{
  "role": "farmer"
}
```

### Onboarding Request:
```json
POST /auth/onboard
Headers: { "Authorization": "Bearer <token>" }
{
  "name": "Test Farmer",
  "age": 30,
  "location": "Tamil Nadu, India",
  "farm_size": 5.5,
  "crops": ["rice", "wheat"],
  "experience_years": 10,
  "education_level": "High school",
  "farming_type": "Mixed",
  "has_irrigation": false
}
```

## Troubleshooting

### Common Issues:

1. **"Cannot connect to server"**
   - Check if backend is running on `http://localhost:8000`
   - Verify MongoDB is running
   - Check network connectivity

2. **"Invalid phone number"**
   - Ensure phone number has at least 10 digits
   - Try different phone numbers for testing

3. **Navigation issues**
   - Check console for navigation errors
   - Verify all route names match the file structure
   - If you see "Attempted to navigate before mounting" error, restart the app

4. **"@react-native-picker/picker" errors**
   - This has been fixed with a custom picker component
   - No external picker dependencies required

4. **Form validation errors**
   - Ensure all required fields are filled
   - Check that crops are added to the list
   - Verify numeric fields have valid values

### Debug Tips:

1. **Check Console Logs**: Look for API request/response logs
2. **Network Tab**: Monitor API calls in development tools
3. **Backend Logs**: Check FastAPI server logs for errors
4. **MongoDB**: Verify data is being stored correctly

## Test Data

### Sample Phone Numbers:
- `9876543210` - New farmer user
- `9876543211` - Admin user
- `9876543212` - Expert user

### Sample Farmer Data:
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

## Success Criteria

✅ **Login Flow**: Smooth navigation from login to appropriate next step
✅ **Role Selection**: Proper role assignment and navigation
✅ **Farmer Onboarding**: Complete form submission and data storage
✅ **Home Page**: Proper display with logout functionality
✅ **Data Persistence**: User data stored and retrieved correctly
✅ **API Integration**: All backend endpoints working correctly
✅ **Error Handling**: Graceful handling of network and validation errors

## Next Steps After Testing

1. **Fix any identified issues**
2. **Add more comprehensive error handling**
3. **Implement AsyncStorage for persistent login**
4. **Add loading states and better UX**
5. **Test on physical devices**
6. **Prepare for production deployment**
