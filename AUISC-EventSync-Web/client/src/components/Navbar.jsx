import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Navbar - Desktop sidebar navigation with 8 tabs
 */
export const Navbar = () => {
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
    <aside className="hidden md:flex flex-col w-64 bg-dark-card border-r border-dark-border h-full">
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-dark-border border-l-4 border-primary text-primary"
                  : "text-gray-400 hover:text-gray-300 hover:bg-dark-border"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-dark-border">
        <p className="text-xs text-gray-500">© 2026 AUISC EventSync</p>
      </div>
    </aside>
  );
};
