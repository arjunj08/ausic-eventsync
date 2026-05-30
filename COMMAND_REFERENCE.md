# 🎯 AUISC EventSync - Command Reference

## 📌 One-Line Installation

```bash
# Windows users - double-click setup.bat
# Mac/Linux users - run: bash setup.sh
```

## 🚀 Manual Setup Commands

### Terminal 1: Backend
```bash
cd "AUISC-EventSync-Backend"
npm install
npm run dev
```

### Terminal 2: Frontend  
```bash
cd "AUISC-EventSync"
npm install
npx expo start
```

---

## 🎮 Running the App

| Platform | Command |
|----------|---------|
| **Web Browser** | Press `w` in Expo terminal |
| **Android** | Press `a` in Expo terminal |
| **iOS** | Press `i` in Expo terminal |
| **Physical Device** | Scan QR code with Expo Go app |

---

## 🔧 Backend Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# View API documentation
# Open http://localhost:5000/api/health
```

---

## 📱 Frontend Commands

```bash
# Start development server
npx expo start

# Clear cache and restart
npx expo start -c

# Web only
npx expo start --web

# Android only
npx expo start --android

# iOS only (macOS only)
npx expo start --ios

# Install dependencies
npm install

# Prebuild for native development
eas build --platform all
```

---

## 🔑 Quick Login Credentials

### Admin
```
Email: admin@auisc.com
Password: admin123
```

### Team Lead
```
Email: lead@auisc.com
Password: lead123
```

### Member
```
Email: member1@auisc.com
Password: member123
```

---

## 🗄️ Database Commands

### Start MongoDB

**Windows:**
```bash
mongod
```

**macOS:**
```bash
brew services start mongodb-community
brew services stop mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
sudo systemctl stop mongod
sudo systemctl status mongod
```

### MongoDB Shell
```bash
# Open Mongo shell
mongo

# View databases
show dbs

# Use specific database
use auisc-eventsync

# View collections
show collections

# View all documents
db.users.find()
db.events.find()
db.teams.find()

# Exit
exit
```

---

## 📊 API Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Get All Events
```bash
curl http://localhost:5000/api/events
```

### Create Event (requires token)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"New Event","description":"Event Desc","banner":"https://..."}'
```

### Get Teams
```bash
curl http://localhost:5000/api/teams
```

### Get User Tasks
```bash
curl http://localhost:5000/api/tasks/user/my-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting Commands

### Clear Expo Cache
```bash
npx expo start -c
```

### Clear Node Modules (Frontend)
```bash
cd AUISC-EventSync
rm -rf node_modules package-lock.json
npm install
```

### Clear Node Modules (Backend)
```bash
cd AUISC-EventSync-Backend
rm -rf node_modules package-lock.json
npm install
```

### Check Port 5000 Usage
```bash
# macOS/Linux
lsof -i :5000

# Windows (PowerShell)
netstat -ano | findstr :5000
```

### Kill Process on Port 5000
```bash
# macOS/Linux
kill -9 <PID>

# Windows (PowerShell)
taskkill /PID <PID> /F
```

### Reset Everything
```bash
# Kill servers
# Stop MongoDB
# Delete node_modules in both folders
# npm install in both folders
# npm run dev (backend)
# npx expo start (frontend)
```

---

## 📝 Development Workflow

### Daily Startup (3 terminals)

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd AUISC-EventSync-Backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd AUISC-EventSync
npx expo start
```

Then press `w` for web or scan QR code.

---

## 🚀 Deployment Commands

### Deploy Backend to Heroku
```bash
heroku login
cd AUISC-EventSync-Backend
heroku create your-app-name
git push heroku main
```

### Deploy Frontend with EAS
```bash
cd AUISC-EventSync
npm install -g eas-cli
eas build --platform all
eas submit
```

---

## 📚 More Information

- Full Setup Guide: `SETUP_GUIDE.md`
- Quick Start: `QUICK_START.md`
- Implementation Summary: `IMPLEMENTATION_COMPLETE.md`
- Frontend Readme: `AUISC-EventSync/README.md`
- Backend Readme: `AUISC-EventSync-Backend/README.md`

---

## 💡 Pro Tips

1. **Keep 3 terminals open** for smooth development
2. **Use VS Code terminal** to manage both projects
3. **Monitor MongoDB** with MongoDB Compass GUI
4. **Test API** with Postman or Insomnia
5. **Use Redux DevTools** for state debugging
6. **Check logs frequently** for errors

---

## ✅ Pre-Flight Checklist

- [ ] Node.js installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] MongoDB installed (`mongod --version`)
- [ ] MongoDB running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend running on :5000
- [ ] Frontend running with Expo
- [ ] Can login with test credentials
- [ ] Can navigate all screens

---

**Everything you need to run AUISC EventSync! 🎉**
