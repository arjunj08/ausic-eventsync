import React from "react";
import { NavLink } from "react-router-dom";

/**
 * BottomNav - Mobile bottom navigation with 8 tabs
 */
export const BottomNav = () => {
  const navItems = [
    { path: "/events", label: "Events", icon: "📅" },
    { path: "/map", label: "Map", icon: "🗺️" },
    { path: "/tasks", label: "Tasks", icon: "✓" },
    { path: "/recurring", label: "Recurring", icon: "🔄" },
    { path: "/expenses", label: "Expenses", icon: "💰" },
    { path: "/reports", label: "Reports", icon: "📊" },
    { path: "/requests", label: "Requests", icon: "🤝" },
    { path: "/alerts", label: "Alerts", icon: "🔔" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border">
      <div className="flex items-center justify-between overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 px-2 border-t-2 transition-colors ${
                isActive
                  ? "border-primary text-primary bg-dark-border"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs mt-1 truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
