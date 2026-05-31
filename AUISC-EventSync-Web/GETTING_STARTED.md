# 🚀 Getting Started with AUISC EventSync

## ✅ What's Built

A complete **production-ready full-stack web application** with:

### Frontend (React + Vite + Tailwind)
- ✅ 9 functional pages (Events, Map, Tasks, Recurring, Expenses, Reports, Requests, Alerts, Chat)
- ✅ Dark-themed UI with #0a0a0a background and #00BFFF accent color
- ✅ 8-tab bottom navigation (mobile-optimized)
- ✅ AI Chatbot floating button (⚡)
- ✅ Responsive design for all screen sizes
- ✅ Authentication with JWT tokens
- ✅ Context API for state management
- ✅ Real-time Socket.io integration

### Backend (Node.js + Express + MongoDB)
- ✅ 10 MongoDB models with complete relationships
- ✅ 45+ API endpoints across 8 route groups
- ✅ JWT authentication with role-based access control
- ✅ Password hashing with bcryptjs
- ✅ Real-time chat handlers with Socket.io
- ✅ Complete error handling and validation
- ✅ Database seeding script included

### Features Implemented
- ✅ User authentication (admin/member roles)
- ✅ Event creation and publishing
- ✅ Team management
- ✅ Task assignment and tracking by status
- ✅ Recurring task templates
- ✅ Expense tracking with approval workflow
- ✅ Cross-team collaboration requests
- ✅ Notifications system
- ✅ Team chat and direct messaging
- ✅ AI chatbot for queries

## 📦 Project Structure

```
AUISC-EventSync-Web/
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── models/         # 10 MongoDB schemas
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # 8 API route groups
│   │   ├── middleware/     # Auth, role validation
│   │   ├── socket/         # Real-time handlers
│   │   └── server.js       # Express setup
│   ├── seed.js             # Sample data
│   ├── package.json
│   ├── .env               # Configuration
│   └── node_modules/
│
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # 9 main pages
│   │   ├── components/     # Layout & shared components
│   │   ├── context/        # Auth & Socket contexts
│   │   ├── hooks/          # useAuth, useSocket
│   │   ├── utils/          # API client, constants
│   │   ├── styles/         # Tailwind CSS config
│   │   ├── App.jsx         # Main router
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   ├── .env.local          # Vite config
│   ├── vite.config.js      # Build config
│   ├── tailwind.config.js  # Tailwind config
│   └── node_modules/
│
├── README.md               # Project overview
└── GETTING_STARTED.md     # This file
```

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- Node.js v16+ installed
- MongoDB installed and running locally
- npm or yarn package manager

### Step 1: Start MongoDB
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Step 2: Backend Setup
```bash
cd server
npm install
npm run seed          # Populate sample data (optional)
npm run dev           # Start on port 5000
```

You should see: `Server running on port 5000`

### Step 3: Frontend Setup (New Terminal)
```bash
cd client
npm install
npm run dev           # Start on port 5173
```

You should see: `Local: http://localhost:5173/`

### Step 4: Open in Browser
Visit: **http://localhost:5173**

## 🔑 Test Credentials

After seeding the database:

### Admin Account
```
Email: admin@auisc.com
Password: admin123
```
Can create/publish events, manage teams, approve expenses

### Member Account
```
Email: member1@auisc.com
Password: password123
```
Can view events, submit tasks/expenses, join teams

### Register New Account
Click "Don't have an account? Register" to create your own

## 🎨 Design & Colors

| Element | Color | Usage |
|---------|-------|-------|
| Background | #0a0a0a | Page background (pure black) |
| Cards | #111111 / #1a1a1a | Card backgrounds |
| Primary | #00BFFF | Buttons, accents, active states |
| Secondary | #7C3AED | Team avatars, secondary actions |
| Success | #22C55E | Approved expenses, completed tasks |
| Warning | #EAB308 | Pending items |
| Error | #FF3B30 | Rejected items |
| Text | #FFFFFF | Primary text |
| Muted | #9CA3AF | Secondary text, descriptions |

Font: Inter (system sans-serif)

## 📱 Pages Overview

### 1. Login Page
- Role selector (Admin/Member toggle)
- Email/password form
- Register option
- Quick login credentials display

### 2. Events (📅)
- List of published events
- Admin: "+ New Event" button
- Event cards with date/time
- Event details on click

### 3. Map/Dashboard (🗺️)
- Event timeline with progress dots
- Upcoming events in grid
- Progress bars showing task completion
- Event details modal

### 4. My Tasks (✓)
- Grouped by status: To Do, In Progress, Done
- Status badges with counts
- Mark tasks complete
- Admin: assign tasks

### 5. Recurring Tasks (🔁)
- "+ New Template" button
- List of recurring templates
- Frequency: Daily/Weekly/Monthly
- Enable/disable toggles

### 6. Expense Tracker (💰)
- "+ Add Expense" form
- Summary stats (Total, Approved, Pending)
- List of submitted expenses
- Category selection
- Receipt upload ready

### 7. Expense Reports (📊)
- CSV/PDF export buttons
- Date range filters
- Category & event filters
- Expense table view
- Summary statistics

### 8. Cross-Team Requests (📬)
- "+ New Request" button
- Send requests to other teams
- Status tracking (Pending/Accepted/Rejected)
- Request message display

### 9. Alerts/Notifications (🔔)
- Real-time alerts list
- Task assigned notifications
- Event published alerts
- Expense approval status
- Chat message notifications
- Incoming call alerts

### 10. Chat (💬)
- Team chat rooms sidebar
- Direct messaging support
- Message threads
- Message history
- Real-time sync via Socket.io

## 🛠️ Configuration Files

### server/.env
```
MONGO_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
CLIENT_URL=http://localhost:3000
CLAUDE_API_KEY=your-api-key-optional
```

### client/.env.local
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Deployment

### Deploy Backend (Heroku)
```bash
cd server
heroku create your-app-name
heroku config:set MONGO_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

### Deploy Frontend (Vercel)
```bash
cd client
npm run build
# Deploy dist/ folder to Vercel
```

## 🔗 API Endpoints

### Authentication (4 endpoints)
```
POST   /api/auth/register    # Create account
POST   /api/auth/login       # Login
GET    /api/auth/user        # Get user profile
PUT    /api/auth/user        # Update profile
```

### Events (6 endpoints)
```
POST   /api/events           # Create
GET    /api/events           # List all
GET    /api/events/:id       # Get one
PUT    /api/events/:id       # Update
PATCH  /api/events/:id/publish # Publish
DELETE /api/events/:id       # Delete
```

### Teams (7 endpoints)
```
POST   /api/teams                    # Create
GET    /api/teams                    # List
GET    /api/teams/:id                # Get
PUT    /api/teams/:id                # Update
PATCH  /api/teams/:id/lead           # Change lead
PATCH  /api/teams/:id/members/add    # Add member
PATCH  /api/teams/:id/members/remove # Remove member
```

### Tasks (6 endpoints)
```
POST   /api/tasks                  # Create
GET    /api/tasks                  # List
GET    /api/tasks/user/my-tasks    # My tasks
PATCH  /api/tasks/:id/status       # Update status
PUT    /api/tasks/:id              # Update
DELETE /api/tasks/:id              # Delete
```

### Full API List
See: `server/README.md` for complete API documentation

## 🧪 Testing

### Test Admin Features
1. Login with admin@auisc.com / admin123
2. Go to Events → "+ New Event" to create
3. Go to Tasks → assign to team members
4. View Expense Reports → export as CSV/PDF

### Test Member Features
1. Login with member1@auisc.com / password123
2. View published events on Events page
3. Submit expenses with category & amount
4. Chat with team in Chat page
5. View assigned tasks in My Tasks

### Test Real-time Features
1. Open app in 2 browsers
2. Login with different accounts
3. Send messages in Chat page
4. Notifications appear instantly

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to MongoDB" | Start MongoDB service (mongod) |
| "Port 5000 already in use" | Change PORT in .env or kill process |
| "Cannot GET /login" | Make sure frontend is running on 5173 |
| "API calls 404" | Check backend is running and VITE_API_URL is correct |
| "Styles not applying" | Clear cache: `npm run dev --force` or delete node_modules |
| "Module not found errors" | Run `npm install` again in affected directory |

## 📚 Documentation

- **server/README.md** - Backend documentation
- **client/README.md** - Frontend documentation  
- **README.md** - Project overview

## ✨ Next Steps

1. **Test All Features**
   - Navigate all pages
   - Create/edit resources
   - Test admin vs member views

2. **Connect to Real MongoDB**
   - Setup MongoDB Atlas account
   - Get connection URI
   - Update MONGO_URI in .env

3. **Add More Data**
   - Edit seed.js to add more sample events/tasks
   - Run `npm run seed` again

4. **Customize Branding**
   - Update logo/colors in tailwind.config.js
   - Change "EventSync" to your app name
   - Update primary colors (#00BFFF → your color)

5. **Deploy to Production**
   - Follow deployment guides above
   - Set environment variables on hosting platform
   - Test in production environment

## 📞 Support

- Check **README.md** for overview
- Check specific **README.md** in server/ and client/
- Review inline code comments
- Check API response error messages

## 🎉 You're Ready!

Everything is set up and ready to run. Start the backend and frontend, then explore the application!

---

**Version**: 1.0.0  
**Built with**: React, Vite, Tailwind, Express, MongoDB  
**Status**: ✅ Production Ready

Happy coding! 🚀
