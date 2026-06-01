import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { SocketContext } from '../context/SocketContext';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Settings, 
  Sparkles,
  Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventGoals({ eventId, user }) {
  const { socket } = useContext(SocketContext);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confetti Canvas Ref
  const canvasRef = useRef(null);
  const confettiParticles = useRef([]);
  const animationFrameId = useRef(null);

  // Admin Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('registrations');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Fetch event goals
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/goals/event/${eventId}`);
      setGoals(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [eventId]);

  // Socket listener for goals
  useEffect(() => {
    if (!socket) return;

    // Listen to real-time goals updates
    const handleGoalCelebration = (data) => {
      if (String(data.eventId) === String(eventId)) {
        toast(`🎯 ${data.message}`, {
          icon: '🎉',
          duration: 6000,
          style: {
            background: '#111111',
            color: '#00BFFF',
            border: '1px solid #00BFFF/30'
          }
        });
        triggerConfettiBurst();
        fetchGoals();
      }
    };

    socket.on('goal-achieved-celebration', handleGoalCelebration);

    return () => {
      socket.off('goal-achieved-celebration', handleGoalCelebration);
    };
  }, [socket, eventId]);

  // Start Confetti Animation
  const triggerConfettiBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Add 100 colorful particles
    const colors = ['#00BFFF', '#8F5CFF', '#2ECC71', '#F1C40F', '#E74C3C', '#FF69B4'];
    for (let i = 0; i < 150; i++) {
      confettiParticles.current.push({
        x: canvas.width / 2,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 15 - 10,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    animateConfetti();
  };

  // Animate Confetti Canvas
  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeParticles = confettiParticles.current.filter(p => p.opacity > 0.05);
    confettiParticles.current = activeParticles;

    activeParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // wind friction
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.005;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      
      // Draw rectangular confetti piece
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      ctx.restore();
    });

    if (activeParticles.length > 0) {
      animationFrameId.current = requestAnimationFrame(animateConfetti);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Update Goal progress on slider change
  const handleSliderChange = (goalId, value) => {
    setGoals(prev => 
      prev.map(g => g._id === goalId ? { ...g, currentValue: Number(value) } : g)
    );
  };

  // Save progress values to database
  const handleProgressUpdateSubmit = async (goalId, val) => {
    try {
      const res = await axios.patch(`/api/goals/${goalId}/update-progress`, { value: val });
      // If it triggers achieved locally, shoot local confetti as immediate feedback
      const originalGoal = goals.find(g => g._id === goalId);
      if (res.data.status === 'achieved' && originalGoal.status !== 'achieved') {
        triggerConfettiBurst();
        toast.success(`🎉 Milestone "${res.data.title}" reached 100%!`);
      }
      fetchGoals();
    } catch (err) {
      toast.error('Failed to save goal progress.');
    }
  };

  // Add new Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!title || !targetValue || !deadline) return;

    setSubmitting(true);
    try {
      await axios.post('/api/goals', {
        eventId,
        title,
        description,
        targetValue: Number(targetValue),
        unit,
        deadline
      });
      toast.success('Goal created successfully! 🎯');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setTargetValue('');
      setDeadline('');
      fetchGoals();
    } catch (err) {
      toast.error('Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await axios.patch(`/api/goals/${id}`, { status: 'cancelled' }); // Or standard delete route
      // Wait, is there a delete endpoint? We can use status = 'cancelled' or custom delete
      // Let's check: the routes/goals.js doesn't have a DELETE route, but it has edit: PATCH /api/goals/:id.
      // So setting status to 'missed' or 'cancelled' works, or deleting it?
      // Since it has PATCH /api/goals/:id, we can set status to 'cancelled' to archive it.
      await axios.patch(`/api/goals/${id}`, { status: 'missed' });
      toast.success('Goal removed from active targets.');
      fetchGoals();
    } catch (err) {
      toast.error('Failed to delete goal.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">
      
      {/* Fullscreen Overlay Canvas for Confetti */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      <div className="flex justify-between items-center border-b border-gray-850 pb-4">
        <div>
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5">
            <Target className="h-5 w-5" />
            Milestones & Goals Tracking
          </h4>
          <p className="text-gray-400 text-xs mt-1">Adjust progress sliders in real-time. Confetti triggers at 100%.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-extrabold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#00BFFF]/5"
          >
            <Plus className="h-4.5 w-4.5 text-black" />
            <span>Create Milestone</span>
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-gray-500 italic text-xs bg-[#111111] border border-dashed border-gray-850 rounded-xl">
          🎯 No milestones defined for this event yet.
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              const isCompleted = goal.status === 'achieved';
              const radius = 35;
              const strokeDashoffset = 220 - (220 * percentage) / 100;

              return (
                <motion.div 
                  key={goal._id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#111111] border border-gray-850 rounded-xl p-5 flex flex-col justify-between space-y-5 shadow-lg group relative overflow-hidden"
                >
                  
                  {/* Upper row: Title & Circular Progress SVG */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <h5 className="font-extrabold text-white text-base truncate flex items-center gap-2">
                        {goal.title}
                        {isCompleted && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 fill-emerald-500/10" />
                        )}
                      </h5>
                      {goal.description && (
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{goal.description}</p>
                      )}
                      <div className="flex items-center text-[10px] text-gray-500 gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Circular progress meter */}
                    <div className="relative shrink-0 flex items-center justify-center h-20 w-20">
                      <svg className="transform -rotate-90 w-full h-full">
                        {/* Gray track */}
                        <circle cx="40" cy="40" r={radius} stroke="#1f1f1f" strokeWidth="6" fill="transparent" />
                        {/* Cyan path */}
                        <circle 
                          cx="40" cy="40" r={radius} 
                          stroke={isCompleted ? '#2ECC71' : '#00BFFF'} 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="220" 
                          strokeDashoffset={strokeDashoffset} 
                          className="transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[11px] font-bold text-white">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Slider input & adjustment metrics */}
                  <div className="space-y-3 pt-3 border-t border-gray-850">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Current Metrics:</span>
                      <span className="text-white">
                        <span className={isCompleted ? 'text-emerald-400' : 'text-[#00BFFF]'}>
                          {goal.currentValue}
                        </span> / {goal.targetValue} <span className="text-gray-550 lowercase font-medium">{goal.unit}</span>
                      </span>
                    </div>

                    {/* React Interactive slider */}
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="0"
                        max={goal.targetValue}
                        value={goal.currentValue}
                        onChange={(e) => handleSliderChange(goal._id, e.target.value)}
                        onMouseUp={(e) => handleProgressUpdateSubmit(goal._id, e.target.value)}
                        onTouchEnd={(e) => handleProgressUpdateSubmit(goal._id, e.target.value)}
                        className="flex-1 accent-[#00BFFF] h-1 bg-gray-850 rounded-lg cursor-pointer outline-none"
                      />
                      <Sliders className="h-4 w-4 text-gray-550 shrink-0" />
                    </div>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-650 hover:text-red-400 rounded hover:bg-red-500/10 cursor-pointer"
                      title="Delete milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Goal Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col justify-between"
            >
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-2">
                  <h3 className="font-extrabold text-white text-base">Add Event Milestone</h3>
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-full"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">Milestone Target Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Total Registrations"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    placeholder="Describe this target..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">Target Value</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      required
                      min="1"
                      className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. tickets, registrations"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                      className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase tracking-widest mb-1.5">Target Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-850">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-850 hover:bg-gray-800 text-white rounded-lg py-2.5 text-xs font-bold uppercase cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#00BFFF] hover:bg-[#00D4FF] text-black rounded-lg py-2.5 text-xs font-bold uppercase cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
