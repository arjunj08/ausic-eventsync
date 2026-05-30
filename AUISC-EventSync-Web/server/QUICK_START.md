# AUISC EventSync Backend - Quick Start Guide

## 🚀 Quick Start (2 minutes)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
The `.env` file is already created with default values:
```
MONGO_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-secret-key
PORT=5000
```

### 3. Seed Database
```bash
npm run seed
```

This populates your database with:
- 1 admin user (admin@auisc.com / admin123)
- 4 member users (member1-4@auisc.com / password123)
- 3 sample events
- 3 teams with members
- 5 tasks and 2 expenses
- 3 sample notifications

### 4. Start Server
```bash
npm run dev
```

Server will run at: `http://localhost:5000`

## 📝 Key Scripts

```bash
npm run dev      # Start in development mode
npm start        # Start in production mode
npm run seed     # Populate database with sample data
```

## ✅ What's Included

✅ **10 MongoDB Models**: User, Event, Team, Task, RecurringTask, Expense, CrossTeamRequest, Notification, ChatMessage, Call

✅ **8 API Route Groups**: Auth, Events, Teams, Tasks, Expenses, Requests, Chat, Notifications

✅ **8 Controllers**: Full CRUD operations with validation

✅ **Authentication**: JWT-based with role-based access control

✅ **Real-time Features**: Socket.io for chat and notifications

✅ **Error Handling**: Comprehensive error responses

✅ **Data Validation**: Input validation at controller level

✅ **Password Security**: bcryptjs hashing

## 📚 API Base URL

```
http://localhost:5000/api
```

### Auth Examples
```bash
# Register
POST /auth/register
{ "name": "John", "email": "john@example.com", "password": "123456" }

# Login
POST /auth/login
{ "email": "admin@auisc.com", "password": "admin123" }

# Get Current User (requires token)
GET /auth/me
Header: Authorization: Bearer <token>
```

### Events Examples
```bash
# Get all events
GET /events

# Create event (requires auth)
POST /events
{ "title": "Event Name", "description": "...", "date": "2026-06-15" }
```

## 🗂️ Project Structure

```
src/
├── controllers/    → Business logic
├── models/         → Database schemas
├── routes/         → API endpoints
├── middleware/     → Auth & validation
├── socket/         → Real-time handlers
└── server.js       → Express setup
```

## 🔐 Default Test Credentials

**Admin**
- Email: admin@auisc.com
- Password: admin123

**Members**
- Email: member1@auisc.com
- Password: password123

## 🐛 Troubleshooting

### MongoDB Connection Error
Make sure MongoDB is running:
```bash
# macOS
brew services start mongodb-community

# Windows
mongod

# Docker
docker run -d -p 27017:27017 mongo
```

### Port Already in Use
Change PORT in .env or kill existing process:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

## 📖 Full Documentation

See `BACKEND_API_DOCS.md` for complete API documentation

## 🔄 Connecting Frontend

Update frontend environment variables:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Then connect in your frontend:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected!'));
```

## 📞 Support

All endpoints are fully functional and production-ready. Check `BACKEND_API_DOCS.md` for:
- Complete endpoint list
- Request/response formats
- Error handling
- Socket.io events
- Data model schemas

## ✨ Features Ready to Use

- ✅ User authentication & authorization
- ✅ Event management
- ✅ Team collaboration
- ✅ Task assignment & tracking
- ✅ Expense management
- ✅ Cross-team requests
- ✅ Real-time chat
- ✅ Notifications
- ✅ Role-based access control
- ✅ Data validation & error handling
