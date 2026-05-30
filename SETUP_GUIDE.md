# AUISC EventSync - Complete Setup Guide

## 📋 Project Structure

```
Desktop/New folder/
├── AUISC-EventSync/              # React Native Frontend
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── context/
│       │   └── AppContext.js
│       ├── navigation/
│       │   └── AppNavigator.js
│       └── screens/
│           ├── LoginScreen.js
│           ├── AdminDashboard.js
│           ├── CreateEventScreen.js
│           ├── TeamManagementScreen.js
│           ├── EventDetailMemberView.js
│           ├── TeamRoomScreen.js
│           ├── MyTasksScreen.js
│           ├── CrossTeamRequestScreen.js
│           ├── NotificationsScreen.js
│           ├── MemberProfileScreen.js
│           ├── TeamChatScreen.js
│           ├── DirectMessageScreen.js
│           ├── VoiceCallScreen.js
│           ├── VideoCallScreen.js
│           └── CallsChatsHubScreen.js
│
└── AUISC-EventSync-Backend/      # Node.js/Express Backend
    ├── src/
    │   ├── config/
    │   │   ├── config.js
    │   │   └── database.js
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── eventController.js
    │   │   ├── teamController.js
    │   │   ├── taskController.js
    │   │   ├── crossTeamController.js
    │   │   ├── messageController.js
    │   │   └── updateController.js
    │   ├── middleware/
    │   │   └── auth.js
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── Event.js
    │   │   ├── Team.js
    │   │   ├── Task.js
    │   │   ├── CrossTeamRequest.js
    │   │   ├── Message.js
    │   │   └── Update.js
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── events.js
    │   │   ├── teams.js
    │   │   ├── tasks.js
    │   │   ├── crossTeam.js
    │   │   ├── messages.js
    │   │   └── updates.js
    │   └── server.js
    ├── .env
    ├── package.json
    └── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16+): [Download](https://nodejs.org/)
- **MongoDB**: [Download](https://www.mongodb.com/try/download/community)
- **Expo CLI**: Install via `npm install -g expo-cli`
- **Git**: [Download](https://git-scm.com/)

### Step 1: Setup Backend

```bash
cd "Desktop/New folder/AUISC-EventSync-Backend"

# Install dependencies
npm install

# Ensure MongoDB is running on your system
# On Windows: mongod (if installed as service, it should auto-start)
# On Mac: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

**Expected Output:**
```
MongoDB connected successfully
Server running on port 5000 in development mode
```

### Step 2: Setup Frontend

```bash
cd "Desktop/New folder/AUISC-EventSync"

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Available Options:**
```
› Press 'a' to open Android emulator
› Press 'i' to open iOS simulator  
› Press 'w' to open web
› Press 'r' to reload
› Press 'q' to quit
```

## 📱 Running on Different Platforms

### Web Browser (Easiest for Testing)

```bash
cd AUISC-EventSync
npx expo start --web
```
Opens automatically at `http://localhost:19006`

### Android Emulator

```bash
cd AUISC-EventSync
npx expo start
# Press 'a' when prompted
```

Requires Android Studio with emulator configured.

### iOS Simulator (macOS only)

```bash
cd AUISC-EventSync
npx expo start
# Press 'i' when prompted
```

### Physical Device (Expo Go)

1. Install **Expo Go** from Google Play Store or App Store
2. Run: `npx expo start`
3. Scan QR code with your phone camera

## 🔧 Configuration

### Backend Environment Variables

Edit `AUISC-EventSync-Backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
```

### Frontend API Connection

The frontend uses mock data by default. To connect to backend:

1. Update `AppContext.js` to replace mock data with API calls
2. Replace localhost with your backend URL if deployed

## 🔑 Test Accounts

### Admin Login
- Email: admin@auisc.com
- Password: admin123

### Member Login  
- Email: member@auisc.com
- Password: member123

### Team Lead Login
- Email: lead@auisc.com
- Password: lead123

## 📊 Key Features

### Admin Panel
- Create and publish events
- Create and manage teams
- Assign team leads and members
- View all cross-team requests

### Team Lead
- Manage team members
- Create and assign tasks
- Post team updates
- Approve cross-team requests

### Members
- View event details
- See team information
- Manage assigned tasks
- Join cross-team collaborations
- Team chat and direct messaging

## 🛠️ Troubleshooting

### Backend Issues

**MongoDB Connection Error**
```
Error: connect ECONNREFUSED
```
Solution: Start MongoDB service
- Windows: `mongod`
- Mac: `brew services start mongodb-community`

**Port Already in Use**
```bash
# Change port in .env file
PORT=5001
```

**Dependencies Error**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

**Expo Won't Start**
```bash
# Clear cache
npx expo start -c

# Or use npm to start
npm start
```

**Module Not Found**
```bash
npm install
npx expo start
```

**Simulator/Emulator Won't Open**
- Ensure you have Android Studio or Xcode installed
- Check emulator/simulator is configured in your system

## 📡 API Testing

### Using Postman or cURL

**Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"test123"}'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"test123"}'
```

**Create Event (requires JWT token)**
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Event","description":"Description","banner":"URL"}'
```

## 🚀 Deployment

### Backend Deployment (Heroku)

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

### Frontend Deployment (Expo)

```bash
eas build --platform all
eas submit
```

## 📚 Additional Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [JWT Authentication](https://jwt.io/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md files in each project folder
3. Check console logs for detailed error messages

## ✅ Verification Checklist

- [ ] Node.js installed (check: `node -v`)
- [ ] MongoDB running (check: `mongod --version`)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 5000
- [ ] Expo app running and accessible
- [ ] Can login with test credentials
- [ ] Can create events (as admin)
- [ ] Can view teams and tasks

---

**Happy Coding! 🎉**
