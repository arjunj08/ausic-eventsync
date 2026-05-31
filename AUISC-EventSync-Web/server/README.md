# AUISC EventSync Backend API

Complete production-ready backend for EventSync application with full REST API support.

## Features

- **Authentication**: JWT-based user authentication and authorization
- **Event Management**: Create, publish, and manage events
- **Team Management**: Assign team leads and members
- **Task Management**: Create and track tasks with status updates
- **Cross-Team Requests**: Request collaboration between teams with approval workflows
- **Real-time Messaging**: Team group chats and direct messages
- **Team Updates**: Post operational updates for teams
- **Role-Based Access**: Admin, team lead, and member roles

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Database Setup

MongoDB must be running on `mongodb://localhost:27017` or set `MONGODB_URI` in `.env`

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auisc-eventsync
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user
- GET `/api/auth/user` - Get current user
- PUT `/api/auth/user` - Update user

### Events
- POST `/api/events` - Create event (admin)
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get event details
- PUT `/api/events/:id` - Update event (admin)
- PATCH `/api/events/:id/publish` - Publish event (admin)
- DELETE `/api/events/:id` - Delete event (admin)

### Teams
- POST `/api/teams` - Create team (admin)
- GET `/api/teams` - Get all teams
- GET `/api/teams/:id` - Get team details
- PUT `/api/teams/:id` - Update team (admin)
- PATCH `/api/teams/:id/lead` - Assign team lead
- PATCH `/api/teams/:id/members/add` - Add member
- PATCH `/api/teams/:id/members/remove` - Remove member
- DELETE `/api/teams/:id` - Delete team (admin)

### Tasks
- POST `/api/tasks` - Create task (team lead)
- GET `/api/tasks` - Get all tasks
- GET `/api/tasks/team/:teamId` - Get team tasks
- GET `/api/tasks/user/my-tasks` - Get user's tasks
- PATCH `/api/tasks/:id/status` - Update task status
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

### Cross-Team Requests
- POST `/api/cross-team-requests` - Submit request
- GET `/api/cross-team-requests` - Get requests
- PATCH `/api/cross-team-requests/:id/approve` - Approve request

### Messages
- POST `/api/messages/team` - Send team message
- POST `/api/messages/direct` - Send DM
- GET `/api/messages/team/:teamId` - Get team messages
- GET `/api/messages/direct/:userId` - Get DMs

### Updates
- POST `/api/updates` - Post team update (team lead)
- GET `/api/updates/:teamId` - Get team updates
- DELETE `/api/updates/:id` - Delete update

## Models

- **User**: email, password, name, role, teamId, avatar
- **Event**: title, description, banner, published, teams, createdBy
- **Team**: name, eventId, leadId, members, color, description
- **Task**: title, assignedTo, teamId, status, priority, dueDate
- **CrossTeamRequest**: fromTeamId, toTeamId, message, approval statuses
- **Message**: senderId, teamId/recipientId, text, createdAt
- **Update**: teamId, authorId, text, createdAt
