# AUISC EventSync - Frontend Configuration

## Available Test Credentials

### Admin Account
```
Email: admin@auisc.com
Password: admin123
```

### Team Lead Account
```
Email: lead@auisc.com
Password: lead123
```

### Member Accounts
```
Account 1:
Email: member1@auisc.com
Password: member123

Account 2:
Email: member2@auisc.com
Password: member123
```

## Default Mock Data

The app includes pre-configured mock data:

### Users
- **Alex Rivers** - Admin (u1)
- **Sarah Chen** - Team Lead, Dev Alpha (u2)
- **Marcus Vance** - Member, Dev Alpha (u3)
- **Elena Rostova** - Team Lead, Design Beta (u4)
- **David Kim** - Member, Design Beta (u5)

### Events
- **Annual Tech Symposium 2026** - Published with 2 teams

### Teams
- **Dev Alpha** - Led by Sarah Chen (Blue #00AAFF)
- **Design Beta** - Led by Elena Rostova (Orange #FF6B00)

### Sample Tasks
- "Setup App Architecture" - Marcus Vance, In Progress
- "Design High-Fi Prototypes" - David Kim, Done
- "Integrate Real-Time Gateway" - Marcus Vance, To Do

### Team Updates
- Alpha repository initialized and UI components mapped.

## Navigation Structure

### Member Flow
```
Login → Member Root (Tab Navigation)
├── Event (Event Details)
├── Team Room (Updates & Chat)
├── Tasks (Personal Tasks)
├── Hub (Messages & Calls)
└── Profile (User Profile)
```

### Admin Flow
```
Login → Admin Root (Drawer Navigation)
├── Admin Dashboard (Metrics & Events)
├── Create Event (New Events)
├── Team Configuration (Members & Leads)
├── Inter-Team Track (Cross-team Requests)
└── Hub (Messages & Calls)
```

## Color Scheme

- **Primary**: #00AAFF (Cyan/Blue)
- **Secondary**: #FF6B00 (Orange)
- **Background**: #0A0A0F (Dark)
- **Card**: #12121A (Darker)
- **Border**: #222 (Dark Gray)
- **Success**: #00FF66 (Green)
- **Error**: #FF3B30 (Red)

## Styling Guidelines

All screens use:
- Dark theme (AMOLED-friendly)
- Glassmorphic cards with borders
- Consistent spacing and typography
- Accessible touch targets (min 48x48 dp)

## Debugging Tips

1. **Enable Redux DevTools** (if using Redux)
2. **Check Console**: `npx expo start` shows all logs
3. **Network Requests**: Use React DevTools
4. **Performance**: Use React Native debugger
5. **State**: Use AppContext DevTools Chrome extension

## Common Issues & Solutions

### Blank Screen
- Clear expo cache: `npx expo start -c`
- Rebuild app: `npm install && npx expo start`

### Navigation Not Working
- Ensure NavigationContainer wraps all screens
- Check navigation params are correct
- Verify screen names match exactly

### Styles Not Applied
- Clear bundle cache
- Check StyleSheet.create() syntax
- Verify color values are valid

### Mock Data Not Loading
- Ensure AppContext provider wraps app
- Check useApp() hook is imported
- Verify mock data structure in AppContext.js

## Connecting to Real Backend

To switch from mock data to real API:

1. Replace `useApp()` with API calls in controllers
2. Update endpoints to match backend URLs
3. Add JWT token to API headers
4. Handle loading and error states
5. Add error boundary components

Example:
```javascript
const getEvents = async () => {
  const response = await fetch('http://localhost:5000/api/events', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

---

For more details, see [SETUP_GUIDE.md](../SETUP_GUIDE.md)
