/**
 * Constants and color schemes for the application
 */

export const COLORS = {
  bg: "#0a0a0a",
  card: "#111111",
  border: "#1a1a1a",
  primary: "#00BFFF",
  secondary: "#7C3AED",
  success: "#22C55E",
  warning: "#EAB308",
  error: "#EF4444",
};

export const STATUS_BADGES = {
  active: { bg: "bg-success", text: "text-success" },
  pending: { bg: "bg-warning", text: "text-warning" },
  completed: { bg: "bg-primary", text: "text-primary" },
  cancelled: { bg: "bg-red-500", text: "text-red-400" },
  in_progress: { bg: "bg-secondary", text: "text-secondary" },
};

export const ROLES = {
  ADMIN: "admin",
  ORGANIZER: "organizer",
  VOLUNTEER: "volunteer",
  ATTENDEE: "attendee",
};

export const EVENT_TYPES = [
  "Conference",
  "Workshop",
  "Seminar",
  "Webinar",
  "Networking",
  "Social",
  "Competition",
  "Other",
];

export const EXPENSE_CATEGORIES = [
  "Venue",
  "Catering",
  "Transportation",
  "Equipment",
  "Marketing",
  "Miscellaneous",
];

export const TASK_STATUS = ["todo", "in_progress", "review", "completed"];

export const API_ENDPOINTS = {
  AUTH: "/auth",
  EVENTS: "/events",
  TASKS: "/tasks",
  EXPENSES: "/expenses",
  REPORTS: "/reports",
  REQUESTS: "/requests",
  ALERTS: "/alerts",
  CHAT: "/chat",
};
