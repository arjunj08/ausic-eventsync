import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";

/**
 * EventsPage - Display event list with admin create functionality
 */
export const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    category: "Conference",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/events");
      setEvents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", formData);
      setFormData({ title: "", description: "", date: "", location: "", category: "Conference" });
      setShowForm(false);
      fetchEvents();
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        {(user?.role === "admin" || user?.role === "organizer") && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "+ New Event"}
          </button>
        )}
      </div>

      {/* Create Event Form */}
      {showForm && (user?.role === "admin" || user?.role === "organizer") && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-xl font-semibold">Create Event</h2>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Event Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Conference 2026"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Event description..."
              rows={4}
              className="textarea-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                Date
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Address"
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
            >
              <option>Conference</option>
              <option>Workshop</option>
              <option>Seminar</option>
              <option>Webinar</option>
              <option>Networking</option>
              <option>Social</option>
              <option>Competition</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full">
            Create Event
          </button>
        </form>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-400">No events found</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="card hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex-1">
                  {event.title}
                </h3>
                <span className="badge-success text-xs">
                  {event.category || "Event"}
                </span>
              </div>
              <p className="text-gray-300 text-sm mb-3">{event.description}</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                <p>📍 {event.location}</p>
              </div>
              <button className="btn-primary w-full mt-4 py-2 text-sm">
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
