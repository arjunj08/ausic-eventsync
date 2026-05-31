import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText, 
  Loader2, 
  Check, 
  Clock, 
  ShieldCheck, 
  CheckSquare, 
  Info 
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function AIPlanner() {
  // Input form states
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Tech Fest');
  const [attendees, setAttendees] = useState(150);
  const [budget, setBudget] = useState(25000);
  const [eventDate, setEventDate] = useState('');
  const [requirements, setRequirements] = useState('');

  // Loading & status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generated Plan State
  const [plan, setPlan] = useState(null); // { tasks, budgetBreakdown, timeline, teamStructure }
  const [selectedTasks, setSelectedTasks] = useState({}); // taskTitle -> boolean

  // Generate Plan call
  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      setErrorMsg('Event name and date are required.');
      return;
    }

    setLoading(true);
    setPlan(null);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axios.post('/api/ai/plan-event', {
        name: eventName,
        type: eventType,
        attendees,
        budget,
        date: eventDate,
        requirements
      });

      setPlan(res.data);
      // Pre-select all tasks initially
      const initialSelection = {};
      res.data.tasks.forEach(t => {
        initialSelection[t.title] = true;
      });
      setSelectedTasks(initialSelection);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'AI event planning query failed.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle task checkbox
  const toggleTaskSelection = (title) => {
    setSelectedTasks(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Create Event and Tasks bulk call
  const handleCreatePlannedEvent = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const tasksToCreate = plan.tasks.filter(t => selectedTasks[t.title]);

    try {
      // Step 1: Create Event Document
      const eventRes = await axios.post('/api/events', {
        title: eventName,
        description: requirements || `AI Planned ${eventType} for ${attendees} attendees.`,
        date: eventDate,
        status: 'published' // auto publish AI planned events
      });

      const eventId = eventRes.data._id || eventRes.data.id;

      // Find or create default team squad IDs based on task types
      const teamsRes = await axios.get('/api/teams');
      const teamsMap = {}; // 'Design' | 'Dev' | 'Media' | 'Logistics' -> teamId
      
      teamsRes.data.forEach(team => {
        const name = team.name.toLowerCase();
        if (name.includes('design')) teamsMap['Design'] = team._id;
        else if (name.includes('dev')) teamsMap['Dev'] = team._id;
        else if (name.includes('media')) teamsMap['Media'] = team._id;
        else if (name.includes('logistics')) teamsMap['Logistics'] = team._id;
      });

      // Default squad fallback: Choose the first team if any of these are missing
      const firstTeamId = teamsRes.data.length > 0 ? teamsRes.data[0]._id : null;
      if (!firstTeamId) {
        throw new Error('Create a squad team first under the Admin Dashboard before staging AI events.');
      }

      // Step 2: Create Tasks linked to Event
      for (const t of tasksToCreate) {
        // Resolve team ID
        const matchedTeamId = teamsMap[t.teamType] || firstTeamId;
        
        await axios.post('/api/tasks', {
          title: t.title,
          description: t.description,
          teamId: matchedTeamId,
          eventId: eventId,
          priority: t.priority,
          dueDate: new Date(new Date(eventDate).getTime() - 2 * 24 * 60 * 60 * 1000) // default 2 days before event
        });
      }

      setSuccessMsg(`🎉 Event "${eventName}" and ${tasksToCreate.length} tasks successfully created in database!`);
      // Reset plan
      setPlan(null);
      setEventName('');
      setRequirements('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to complete bulk event staging.');
    } finally {
      setSaving(false);
    }
  };

  // Export Plan to PDF
  const handleExportPDF = () => {
    if (!plan) return;

    const doc = new jsPDF();
    doc.setFillColor(11, 12, 16); // Cosmic dark background
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(102, 252, 241); // Cyan accent
    doc.setFontSize(22);
    doc.text(`⚡ AUISC EventSync AI Proposal`, 14, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Event Name: ${eventName}`, 14, 30);
    doc.text(`Date: ${new Date(eventDate).toLocaleDateString()}`, 14, 38);
    doc.text(`Expected Attendees: ${attendees}`, 14, 46);
    doc.text(`Total Budget: INR ${budget}`, 14, 54);

    doc.setDrawColor(31, 31, 31);
    doc.line(14, 60, 196, 60);

    // 1. Budget Breakdown
    doc.setTextColor(102, 252, 241);
    doc.text(`💰 Budget Breakdown`, 14, 70);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    let y = 80;
    plan.budgetBreakdown.forEach(item => {
      doc.text(`• ${item.category}: INR ${item.estimatedCostInRs}`, 20, y);
      y += 8;
    });

    y += 10;
    // 2. Timeline
    doc.setFontSize(14);
    doc.setTextColor(143, 92, 255); // Purple Accent
    doc.text(`📅 Week-by-Week Countdown`, 14, y);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    y += 10;
    plan.timeline.forEach(step => {
      doc.text(`${step.week}: ${step.objectives}`, 20, y);
      y += 8;
    });

    y += 10;
    // 3. Tasks list
    doc.setFontSize(14);
    doc.setTextColor(102, 252, 241);
    doc.text(`📋 Suggested Tasks`, 14, y);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    y += 10;
    plan.tasks.forEach(t => {
      if (y > 270) {
        doc.addPage();
        doc.setFillColor(11, 12, 16);
        doc.rect(0, 0, 210, 297, 'F');
        y = 20;
      }
      doc.text(`[${t.teamType}] ${t.title} (${t.priority})`, 20, y);
      y += 8;
    });

    doc.save(`${eventName.replace(/\s+/g, '_')}_ai_proposal.pdf`);
  };

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">AI EVENT</span> PLANNER
        </h1>
        <p className="text-gray-400 text-sm mt-1 font-semibold flex items-center gap-1">
          <Sparkles className="h-4.5 w-4.5 text-[#00BFFF] fill-[#00BFFF]/20" />
          Leverage Claude AI prompts to draft timelines, allocate task scopes, and schedule budgets.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <Info className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Plan Inputs */}
        <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 h-fit">
          <h3 className="text-md font-bold text-white mb-6 border-b border-gray-850 pb-2">Plan Details</h3>
          
          <form onSubmit={handleGeneratePlan} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Name</label>
              <input
                type="text"
                placeholder="e.g. Cyber Security Summit"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-3 focus:outline-none focus:border-[#00BFFF] cursor-pointer text-sm"
                >
                  <option value="Cultural Night">Cultural Night</option>
                  <option value="Tech Fest">Tech Fest</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expected Attendees</label>
                <input
                  type="number"
                  value={attendees}
                  onChange={(e) => setAttendees(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#00BFFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#00BFFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#00BFFF]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Requirements</label>
              <textarea
                placeholder="List key elements: dance stalls, hardware hacking components, guest speakers..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] h-24 resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-[#0b0c10] font-extrabold py-3.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#00BFFF]/10 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Planning Event...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 fill-[#0b0c10]" />
                  <span>Generate Full Plan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output: Generation Results */}
        <div className="lg:col-span-2 space-y-6">
          {plan ? (
            <>
              {/* Proposal actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleExportPDF}
                  className="bg-[#1C1C1C] border border-gray-800 hover:border-gray-650 hover:bg-gray-850 px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Proposal PDF</span>
                </button>
                <button
                  onClick={handleCreatePlannedEvent}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-extrabold px-5 py-2 rounded-lg text-xs hover:opacity-90 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Stage Event & Tasks in DB</span>
                </button>
              </div>

              {/* Weekly Timeline */}
              <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Event Timeline Countdown
                </h3>
                <div className="space-y-4 relative pl-4 border-l border-gray-850 ml-1">
                  {plan.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[20px] top-1.5 h-2 w-2 rounded-full bg-purple-500 border border-[#111111]"></span>
                      <div className="text-xs font-bold text-[#8F5CFF]">{step.week}</div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.objectives}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task list checkbox items */}
              <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-[#00BFFF]" />
                  Suggested Tasks Checklist
                </h3>
                <div className="space-y-3">
                  {plan.tasks.map((task) => {
                    const checked = selectedTasks[task.title];
                    return (
                      <div 
                        key={task.title}
                        onClick={() => toggleTaskSelection(task.title)}
                        className="p-3 bg-[#1A1A1A] border border-gray-850 rounded-lg flex items-start gap-3 hover:border-gray-750 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-1 h-4 w-4 rounded border-gray-800 text-[#00BFFF] focus:ring-0 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <span className="text-white text-sm font-semibold">{task.title}</span>
                            <div className="flex gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-800 text-gray-400">
                                {task.teamType}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                task.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{task.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Budget Breakdown & Team Structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget */}
                <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    Budget Allocation
                  </h3>
                  <div className="space-y-3 text-xs">
                    {plan.budgetBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-[#1A1A1A] rounded border border-gray-850">
                        <span className="text-gray-300 truncate max-w-[150px]">{item.category}</span>
                        <span className="text-[#2ECC71] font-bold">₹{item.estimatedCostInRs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Structure */}
                <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#00BFFF]" />
                    Suggested Role structure
                  </h3>
                  <div className="space-y-3 text-xs">
                    {plan.teamStructure.map((role, idx) => (
                      <div key={idx} className="p-3 bg-[#1A1A1A] rounded border border-gray-850 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold">{role.roleTitle}</span>
                          <span className="text-[9px] bg-[#00BFFF]/10 text-[#00BFFF] px-1.5 py-0.5 rounded font-bold uppercase">{role.squadType}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{role.responsibilities}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#111111] py-24 text-center rounded-xl border border-gray-850 text-gray-500 text-sm">
              <Sparkles className="h-10 w-10 text-gray-650 mx-auto mb-2" />
              Provide event inputs on the left panel to generate a plan.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
