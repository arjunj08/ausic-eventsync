# 🚀 AUISC EventSync - Full-Stack Web Application

A complete event management and team collaboration platform for Anurag University ISC club members.

## 📋 Project Structure

```
AUISC-EventSync-Web/
├── server/              (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── models/      (10 MongoDB schemas)
│   │   ├── routes/      (8 API route groups)
│   │   ├── controllers/ (Business logic)
│   │   ├── middleware/  (Auth, role-based)
│   │   ├── socket/      (Real-time features)
│   │   └── server.js    (Express setup)
│   ├── seed.js
│   ├── package.json
│   └── .env
│
└── client/              (React + Vite + Tailwind CSS)
    ├── src/
    │   ├── pages/       (9 main pages)
    │   ├── components/  (Layout components)
    │   ├── context/     (Auth, Socket)
    │   ├── hooks/       (useAuth, useSocket)
    │   ├── utils/       (API, constants)
    │   ├── styles/      (Tailwind CSS)
    │   └── App.jsx
    ├── package.json
    └── .env.local
```

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd server
npm install
npm run seed      # Populate sample data
npm run dev       # Start development server
```

Backend runs on: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev       # Start Vite development server
```

Frontend runs on: `http://localhost:5173`

## 🔐 Test Credentials

After seeding the database:

**Admin:**
- Email: admin@auisc.com
- Password: admin123

**Member:**
- Email: member1@auisc.com
- Password: password123

## 📱 Core Features (8 Pages + Chat)

1. **Events** - Create, publish, and discover events
2. **Map/Dashboard** - Timeline view and progress tracking
3. **My Tasks** - Personal task management by status
4. **Recurring Tasks** - Automate repeating assignments
5. **Expense Tracker** - Submit and track expenses
6. **Expense Reports** - Export and filter expenses
7. **Cross-Team Requests** - Inter-team collaboration
8. **Notifications** - Real-time alerts and updates
9. **Chat** - Team messaging and direct messages

## 🎨 Design System

- **Dark Theme Only**: #0a0a0a background
- **Primary Color**: #00BFFF (Cyan)
- **Secondary Color**: #7C3AED (Purple)
- **Success**: #22C55E (Green)
- **Warning**: #EAB308 (Yellow)
- **Font**: Inter sans-serif
- **Border Radius**: 8-16px

## 🗄️ Database Models

10 MongoDB collections with complete relationships:

- User (authentication, roles)
- Event (event management)
- Team (team organization)
- Task (task tracking)
- RecurringTask (automated tasks)
- Expense (expense management)
- CrossTeamRequest (collaboration)
- Notification (alerts)
- ChatMessage (messaging)
- Call (voice/video calls)

## 🔗 API Endpoints

**45+ Endpoints** across 8 routes:

- `/api/auth` - Register, login, user management
- `/api/events` - CRUD + publish
- `/api/teams` - CRUD + member management
- `/api/tasks` - CRUD + status updates
- `/api/expenses` - CRUD + approve/reject
- `/api/requests` - CRUD + workflows
- `/api/chat` - Messaging
- `/api/notifications` - Alerts

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite (build tool)
- Tailwind CSS 4 (dark theme)
- Axios (HTTP client)
- React Router (navigation)
- Socket.io Client (real-time)
- jsPDF, Papaparse (export)

**Backend:**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT + bcryptjs (auth)
- Socket.io (real-time)
- Multer (file uploads)
- CORS enabled

## 🚀 Deployment

### Backend (Heroku, Railway, or DigitalOcean)
```bash
# Set environment variables
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret-key
PORT=5000
CLAUDE_API_KEY=your-api-key

npm run dev
```

### Frontend (Vercel, Netlify)
```bash
npm run build
# Deploy dist/ folder
```

## 📝 Environment Variables

**server/.env**
```
MONGO_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-secret-key
PORT=5000
CLIENT_URL=http://localhost:3000
CLAUDE_API_KEY=your-key
```

**client/.env.local**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🧪 Features Implemented

✅ User authentication with JWT + bcrypt
✅ Role-based access control (admin/member)
✅ Real-time chat via Socket.io
✅ Task management with status tracking
✅ Event creation and publishing
✅ Expense tracking with approval flow
✅ Cross-team collaboration requests
✅ Recurring task templates
✅ Dark theme UI (100% dark mode)
✅ Responsive mobile design
✅ Database seeding with sample data

## 📞 Support

For issues or questions, refer to:
- Backend docs: `server/README.md`
- Frontend docs: `client/README.md`
- API documentation in source code

## 📄 License

Built with ❤️ for AUISC EventSync

---

**Version**: 1.0.0  
**Status**: Production Ready
