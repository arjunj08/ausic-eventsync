import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/constants";

/**
 * LoginPage - User authentication with role selection and login/register forms
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES.ATTENDEE);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords don't match");
          return;
        }
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        });
      } else {
        await login(formData.email, formData.password);
      }
      navigate("/events");
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const roleOptions = Object.entries(ROLES).map(([key, value]) => ({
    label: key.charAt(0) + key.slice(1).toLowerCase(),
    value,
  }));

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mb-3">
            <span className="text-black font-bold text-lg">ES</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">EventSync</h1>
          <p className="text-gray-400 mt-2">Event Management Platform</p>
        </div>

        {/* Role Selector */}
        {isRegister && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    selectedRole === role.value
                      ? "bg-primary text-black border-2 border-primary"
                      : "bg-dark-card border border-dark-border text-gray-300 hover:border-primary"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="input-field"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading
              ? "Loading..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Toggle Link */}
        <p className="text-center text-gray-400 text-sm mt-4">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setFormData({ name: "", email: "", password: "", confirmPassword: "" });
            }}
            className="text-primary hover:underline font-semibold"
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
};
