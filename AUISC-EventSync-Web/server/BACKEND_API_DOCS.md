# AUISC EventSync Backend API Documentation

## Project Overview

This is a complete Express.js + MongoDB backend for AUISC EventSync, a comprehensive event management platform with team collaboration, real-time chat, expense tracking, and task management features.

## Directory Structure

```
server/
├── src/
│   ├── controllers/          # Business logic controllers
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── teamController.js
│   │   ├── taskController.js
│   │   ├── expenseController.js
│   │   ├── requestController.js
│   │   ├── chatController.js
│   │   └── notificationController.js
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Team.js
│   │   ├── Task.js
│   │   ├── RecurringTask.js
│   │   ├── Expense.js
│   │   ├── CrossTeamRequest.js
│   │   ├── Notification.js
│   │   ├── ChatMessage.js
│   │   └── Call.js
│   ├── routes/               # API route definitions
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── teams.js
│   │   ├── tasks.js
│   │   ├── expenses.js
│   │   ├── requests.js
│   │   ├── chat.js
│   │   └── notifications.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js           # JWT authentication
│   │   └── role.js           # Role-based access control
│   ├── socket/               # Socket.io handlers
│   │   ├── chatHandler.js    # Real-time chat
│   │   └── notificationHandler.js
│   └── server.js             # Express app setup
├── .env                      # Environment variables
├── package.json
├── seed.js                   # Database seeding script
└── README.md
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally on port 27017 or accessible via MONGO_URI)
- npm or yarn

### 2. Installation

```bash
cd server
npm install
```

### 3. Environment Configuration

Create or update `.env` file:
```env
MONGO_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-secret-key
PORT=5000
CLAUDE_API_KEY=your-key
```

### 4. Seed Database with Sample Data

```bash
npm run seed
```

This creates:
- **1 Admin User**: admin@auisc.com (password: admin123)
- **4 Member Users**: member1-4@auisc.com (password: password123)
- **3 Events**: Tech Summit, Cultural Night, Hackathon
- **3 Teams**: Design Squad, Dev Force, Media Team
- **5 Tasks**: Various tasks with different statuses
- **2 Expenses**: Sample expense requests
- **3 Notifications**: Sample notifications

### 5. Start the Server

```bash
npm run dev     # Development mode
npm start       # Production mode
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (requires auth)
- `PUT /me` - Update user profile (requires auth)

### Events (`/api/events`)
- `GET /` - Get all events
- `GET /:id` - Get event by ID
- `POST /` - Create event (requires auth)
- `PUT /:id` - Update event (requires auth)
- `DELETE /:id` - Delete event (requires auth)
- `PUT /:id/publish` - Publish event (requires auth)

### Teams (`/api/teams`)
- `GET /` - Get all teams
- `GET /:id` - Get team by ID
- `POST /` - Create team (requires auth)
- `PUT /:id` - Update team (requires auth)
- `DELETE /:id` - Delete team (requires auth)
- `POST /:id/members` - Add team member (requires auth)
- `DELETE /:id/members` - Remove team member (requires auth)

### Tasks (`/api/tasks`)
- `GET /` - Get all tasks (with filters: eventId, teamId, status)
- `GET /:id` - Get task by ID
- `POST /` - Create task (requires auth)
- `PUT /:id` - Update task (requires auth)
- `DELETE /:id` - Delete task (requires auth)
- `PATCH /:id/status` - Update task status (requires auth)

### Expenses (`/api/expenses`)
- `GET /` - Get all expenses (with filters: eventId, teamId, status)
- `GET /:id` - Get expense by ID
- `POST /` - Create expense (requires auth)
- `PUT /:id` - Update expense (requires auth)
- `DELETE /:id` - Delete expense (requires auth)
- `PATCH /:id/approve` - Approve expense (requires admin)
- `PATCH /:id/reject` - Reject expense (requires admin)

### Cross-Team Requests (`/api/requests`)
- `GET /` - Get all requests (requires auth)
- `GET /:id` - Get request by ID (requires auth)
- `POST /` - Create request (requires auth)
- `PATCH /:id/approve` - Approve request (requires auth)
- `PATCH /:id/reject` - Reject request (requires auth)
- `DELETE /:id` - Delete request (requires auth)

### Chat (`/api/chat`)
- `POST /` - Send message (requires auth)
- `GET /:roomId` - Get messages from room (requires auth)
- `DELETE /:id` - Delete message (requires auth)

### Notifications (`/api/notifications`)
- `GET /` - Get notifications (requires auth)
- `PATCH /:id/read` - Mark notification as read (requires auth)
- `PATCH /read/all` - Mark all notifications as read (requires auth)
- `DELETE /:id` - Delete notification (requires auth)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Expiration
- Tokens expire after 7 days
- Re-login to get a new token

## User Roles

- **admin**: Full access to all resources and admin operations
- **member**: Access to assigned tasks, team chat, and personal notifications

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: 'admin' | 'member',
  avatar: String (optional),
  createdAt: Date
}
```

### Event
```javascript
{
  title: String,
  description: String,
  date: Date,
  imageUrl: String (optional),
  status: 'planning' | 'published' | 'ongoing' | 'completed' | 'cancelled',
  teamIds: [ObjectId],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Team
```javascript
{
  name: String,
  color: 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'pink' | 'yellow',
  memberIds: [ObjectId],
  eventId: ObjectId,
  createdAt: Date
}
```

### Task
```javascript
{
  title: String,
  description: String (optional),
  status: 'pending' | 'in-progress' | 'completed' | 'blocked',
  assignedTo: ObjectId (optional),
  teamId: ObjectId,
  eventId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Expense
```javascript
{
  title: String,
  amount: Number,
  category: 'food' | 'transportation' | 'supplies' | 'equipment' | 'venue' | 'other',
  eventId: ObjectId,
  teamId: ObjectId,
  submittedBy: ObjectId,
  status: 'pending' | 'approved' | 'rejected',
  receiptUrl: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Real-Time Features

### Socket.io Events

#### Chat
- `join-room` - Join a chat room
- `leave-room` - Leave a chat room
- `send-message` - Send a chat message
- `new-message` - Receive new message
- `typing` - Broadcast typing indicator
- `user-typing` - Receive typing indicator
- `stop-typing` - Stop typing indicator
- `user-stop-typing` - User stopped typing

#### Notifications
- `subscribe-notifications` - Subscribe to user notifications
- `unsubscribe-notifications` - Unsubscribe from notifications
- `new-notification` - Receive new notification

## Error Handling

All endpoints return standardized responses:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing Credentials

After running `npm run seed`:

**Admin**
- Email: admin@auisc.com
- Password: admin123

**Members**
- Email: member1@auisc.com - Password: password123
- Email: member2@auisc.com - Password: password123
- Email: member3@auisc.com - Password: password123
- Email: member4@auisc.com - Password: password123

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running on localhost:27017
- Or update MONGO_URI in .env with correct connection string

### Port Already in Use
- Change PORT in .env to an available port
- Or kill process on port 5000: `lsof -ti:5000 | xargs kill -9`

### JWT Token Errors
- Ensure JWT_SECRET is set in .env
- Token should be included in Authorization header as `Bearer <token>`

## Production Deployment

1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "auisc-backend"
   ```

4. Use MongoDB Atlas or a managed database service
5. Configure CORS origin for your frontend domain
6. Set up SSL/TLS certificates for HTTPS

## Development Notes

- All passwords are hashed using bcryptjs
- MongoDB indexes are created for commonly queried fields
- Middleware enforces authentication and authorization
- Input validation is performed at controller level
- Timestamps (createdAt, updatedAt) are automatically managed

## License

ISC
