import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const mockUsers = {
  "u1": { id: "u1", name: "Alex Rivers", role: "admin", teamId: null, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  "u2": { id: "u2", name: "Sarah Chen", role: "team_lead", teamId: "t1", teamName: "Dev Alpha", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
  "u3": { id: "u3", name: "Marcus Vance", role: "member", teamId: "t1", teamName: "Dev Alpha", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" },
  "u4": { id: "u4", name: "Elena Rostova", role: "team_lead", teamId: "t2", teamName: "Design Beta", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  "u5": { id: "u5", name: "David Kim", role: "member", teamId: "t2", teamName: "Design Beta", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" }
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(mockUsers["u3"]); // Default acting user
  const [events, setEvents] = useState([
    {
      id: "e1",
      title: "Annual Tech Symposium 2026",
      description: "The flagship tech exhibition of AUISC featuring deep tech and interactive modules.",
      banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
      published: true,
      teams: ["t1", "t2"]
    }
  ]);

  const [teams, setTeams] = useState({
    "t1": { id: "t1", name: "Dev Alpha", eventId: "e1", leadId: "u2", members: ["u2", "u3"], color: "#00AAFF" },
    "t2": { id: "t2", name: "Design Beta", eventId: "e1", leadId: "u4", members: ["u4", "u5"], color: "#FF6B00" }
  });

  const [tasks, setTasks] = useState([
    { id: "tk1", title: "Setup App Architecture", assignedTo: "u3", teamId: "t1", status: "In Progress" },
    { id: "tk2", title: "Design High-Fi Prototypes", assignedTo: "u5", teamId: "t2", status: "Done" },
    { id: "tk3", title: "Integrate Real-Time Gateway", assignedTo: "u3", teamId: "t1", status: "To Do" }
  ]);

  const [updates, setUpdates] = useState([
    { id: "up1", teamId: "t1", author: "Sarah Chen", text: "Alpha repository initialized and UI components mapped.", timestamp: "10:30 AM" }
  ]);

  const [crossTeamRequests, setCrossTeamRequests] = useState([
    {
      id: "r1",
      fromTeamId: "t1",
      toTeamId: "t2",
      senderId: "u3",
      message: "Need asset adjustments for the home screen layout.",
      fromLeadApproved: "Approved",
      toLeadApproved: "Pending",
      adminApproved: "Pending"
    }
  ]);

  const [chats, setChats] = useState({
    "t1_group": [
      { _id: 1, text: "Welcome to Team Alpha group chat! Check the pinned assets.", createdAt: new Date(), user: { _id: "u2", name: "Sarah Chen" } }
    ],
    "u1_u3": [
      { _id: 1, text: "Admin private ping: Ensure your milestones are updated daily.", createdAt: new Date(), user: { _id: "u1", name: "Alex Rivers" } }
    ]
  });

  const [announcements, setAnnouncements] = useState({
    "t1": "Milestone 1 submission deadline extended to Friday midnight!"
  });

  const [callsHistory] = useState([
    { id: "c1", type: "Video", direction: "Incoming", userName: "Sarah Chen", duration: "12m 4s", missed: false, time: "Yesterday" },
    { id: "c2", type: "Voice", direction: "Missed", userName: "Elena Rostova", duration: "0m 0s", missed: true, time: "2 days ago" }
  ]);

  // Action Functions (Ready for Firebase Hookups)
  const login = (userId) => { if (mockUsers[userId]) setCurrentUser(mockUsers[userId]); };
  
  const createEvent = (newEvent) => setEvents([...events, { ...newEvent, id: `e${Date.now()}`, published: false, teams: [] }]);
  
  const createTeam = (eventId, name, color) => {
    const id = `t${Date.now()}`;
    setTeams({ ...teams, [id]: { id, name, eventId, leadId: null, members: [], color } });
    setEvents(events.map(e => e.id === eventId ? { ...e, teams: [...e.teams, id] } : e));
  };

  const assignMemberToTeam = (userId, teamId) => {
    setTeams(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(tId => {
        updated[tId].members = updated[tId].members.filter(id => id !== userId);
      });
      if (teamId) updated[teamId].members.push(userId);
      return updated;
    });
  };

  const assignTeamLead = (teamId, userId) => {
    setTeams(prev => ({ ...prev, [teamId]: { ...prev[teamId], leadId: userId } }));
  };

  const publishEvent = (eventId) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, published: true } : e));
  };

  const addTask = (title, assignedTo, teamId) => {
    setTasks([...tasks, { id: `tk${Date.now()}`, title, assignedTo, teamId, status: "To Do" }]);
  };

  const updateTaskStatus = (taskId, status) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const postUpdate = (teamId, author, text) => {
    setUpdates([{ id: `up${Date.now()}`, teamId, author, text, timestamp: "Just Now" }, ...updates]);
  };

  const submitCrossTeamRequest = (fromTeamId, toTeamId, senderId, message) => {
    setCrossTeamRequests([...crossTeamRequests, {
      id: `r${Date.now()}`, fromTeamId, toTeamId, senderId, message,
      fromLeadApproved: "Approved", toLeadApproved: "Pending", adminApproved: "Pending"
    }]);
  };

  const handleRequestApproval = (requestId, approverRole, status) => {
    setCrossTeamRequests(crossTeamRequests.map(r => {
      if (r.id !== requestId) return r;
      let update = {};
      if (approverRole === 'from_lead') update.fromLeadApproved = status;
      if (approverRole === 'to_lead') update.toLeadApproved = status;
      if (approverRole === 'admin') update.adminApproved = status;
      return { ...r, ...update };
    }));
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, events, createEvent, publishEvent, teams, createTeam,
      assignMemberToTeam, assignTeamLead, tasks, addTask, updateTaskStatus,
      updates, postUpdate, crossTeamRequests, submitCrossTeamRequest, handleRequestApproval,
      chats, setChats, announcements, setAnnouncements, callsHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
