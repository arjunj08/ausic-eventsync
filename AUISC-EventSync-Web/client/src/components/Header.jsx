import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

/**
 * Header - Top navigation component with logo and user menu
 */
export const Header = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">ES</span>
          </div>
          <h1 className="text-xl font-bold text-gradient">EventSync</h1>
        </div>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-dark-border px-3 py-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm text-gray-300 hidden sm:inline">
                {user.name || user.email}
              </span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg overflow-hidden">
                <div className="p-3 border-b border-dark-border">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <p className="text-xs text-primary mt-1">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-border transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
