# ⚡ AUISC EventSync - Quick Start (5 Minutes)

## 1️⃣ Prerequisites Check
```bash
node -v          # Should be v16 or higher
npm -v           # Should be v8 or higher
mongod --version # MongoDB must be installed
```

## 2️⃣ Start MongoDB (if not running)
```bash
# Windows - Open Command Prompt and type:
mongod

# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

## 3️⃣ Install & Start Backend (Terminal 1)
```bash
cd "AUISC-EventSync-Backend"
npm install
npm run dev
```
✅ Expected: `Server running on port 5000`

## 4️⃣ Install & Start Frontend (Terminal 2)
```bash
cd "AUISC-EventSync"
npm install
npx expo start
```

## 5️⃣ Open in Browser/Device
```
Press 'w' for Web Browser (fastest to test!)
Press 'a' for Android Emulator
Press 'i' for iOS Simulator
```

## 🔑 Quick Login
```
Role: Admin
Username: admin@auisc.com
Password: admin123

---

Role: Member
Username: member1@auisc.com
Password: member123
```

## 📁 Project Structure
```
Desktop/New folder/
├── AUISC-EventSync/           (React Native App)
│   ├── src/screens/           (15 screen components)
│   ├── src/context/           (AppContext.js)
│   ├── src/navigation/        (AppNavigator.js)
│   └── App.js
│
├── AUISC-EventSync-Backend/   (Node.js Server)
│   ├── src/routes/            (7 API routes)
│   ├── src/controllers/       (7 business logic)
│   ├── src/models/            (7 MongoDB schemas)
│   └── src/server.js
│
└── SETUP_GUIDE.md             (Full documentation)
```

## 🎯 Core Features
✅ User authentication (admin, team lead, member)  
✅ Event creation & publishing  
✅ Team management  
✅ Task assignment & tracking  
✅ Cross-team requests  
✅ Team chat & direct messaging  
✅ Real-time updates  

## 🐛 Quick Fixes
| Issue | Fix |
|-------|-----|
| Port 5000 in use | Change in .env: `PORT=5001` |
| Module not found | Run `npm install` again |
| Blank screen | Clear cache: `npx expo start -c` |
| Can't connect to DB | Start MongoDB service |

## 📚 Full Documentation
See `SETUP_GUIDE.md` for complete instructions, deployment, and troubleshooting.

---
**You're all set! Happy coding! 🚀**
