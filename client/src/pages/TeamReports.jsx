import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  Loader2, 
  ChevronRight, 
  Users, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  UserCheck
} from 'lucide-react';

export default function TeamReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null); // for drill-down view

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/reports/teams');
      setReports(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Generate jsPDF Report
  const generatePDFReport = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Cover / Header Banner
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 45, 'F');

      // AUISC Logo Text
      doc.setTextColor(0, 191, 255); // Cyan #00BFFF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('AUISC EVENTSYNC', 15, 20);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text('Anurag University - Institutional Student Coordinators', 15, 26);
      doc.text(`Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 32);

      // Section Line
      doc.setDrawColor(31, 31, 31);
      doc.line(15, 45, 195, 45);

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(17, 17, 17);
      doc.rect(15, 52, 180, 12, 'F');
      doc.setTextColor(0, 191, 255);
      doc.setFontSize(13);
      doc.text('OFFICIAL TEAM PERFORMANCE REPORT SHEET', 20, 60);

      let y = 78;

      reports.forEach((team, idx) => {
        // Prevent overflow to next page
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        // Draw Team header block
        doc.setFillColor(17, 17, 17);
        doc.rect(15, y, 180, 8, 'F');

        // Team Color dot / title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`${idx + 1}. TEAM: ${team.name.toUpperCase()}`, 18, y + 5.5);

        y += 12;

        // Statistics Columns
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(120, 120, 120);

        // Col 1: Tasks
        const taskRate = team.tasksAssigned > 0 ? Math.round((team.tasksCompleted / team.tasksAssigned) * 100) : 100;
        doc.text('Tasks Progress:', 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 220, 220);
        doc.text(`${team.tasksCompleted}/${team.tasksAssigned} Completed (${taskRate}%)`, 45, y);

        // Col 2: Meetings
        const meetingRate = team.meetingsTotal > 0 ? Math.round((team.meetingsAttended / team.meetingsTotal) * 100) : 100;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text('Meetings Presence:', 110, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 220, 220);
        doc.text(`${team.meetingsAttended}/${team.meetingsTotal} Slots (${meetingRate}%)`, 140, y);

        y += 6;

        // Col 3: Finances
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text('Approved Budget:', 18, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(46, 204, 113); // Green
        doc.text(`INR ${team.expensesApproved} / INR ${team.expensesSubmitted}`, 45, y);

        // Col 4: Completion Time
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text('Avg Completion:', 110, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 220, 220);
        doc.text(`${team.avgTaskCompletionTime} Hours / Task`, 140, y);

        y += 6;

        // Col 5: Active Member
        if (team.mostActiveMember) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text('Lead Coordinator:', 18, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 191, 255);
          doc.text(`${team.mostActiveMember.name} (${team.mostActiveMember.completedTasks} Tasks Done)`, 45, y);
        }

        y += 12; // Spacing before next team
      });

      // Save PDF to browser
      doc.save(`AUISC-EventSync-Team-Reports-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Performance PDF report downloaded successfully!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to compile PDF document.');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin mb-4" />
        <span className="text-gray-400 text-sm tracking-wider uppercase font-semibold">Generating Reports...</span>
      </div>
    );
  }

  // Formatting chart data: Team name vs completion percentage
  const chartData = reports.map(t => {
    const taskRate = t.tasksAssigned > 0 ? Math.round((t.tasksCompleted / t.tasksAssigned) * 100) : 100;
    const meetingRate = t.meetingsTotal > 0 ? Math.round((t.meetingsAttended / t.meetingsTotal) * 100) : 100;
    return {
      name: t.name,
      'Tasks Done (%)': taskRate,
      'Attendance (%)': meetingRate,
    };
  });

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Header and PDF export */}
      <div className="border-b border-gray-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">TEAM PERFORMANCE</span> REPORTS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Analyze tasks, meeting attendance and budget statistics side by side.
          </p>
        </div>
        <button
          onClick={generatePDFReport}
          className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-[#0b0c10] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
        >
          <FileText className="h-4.5 w-4.5" />
          Generate Full PDF Report
        </button>
      </div>

      {/* Recharts Graphical comparison */}
      <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#00BFFF]" />
          Completion & Attendance Metrics Comparison
        </h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} />
              <YAxis stroke="#555" domain={[0, 100]} fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111111', borderColor: '#1f1f1f', borderRadius: 8 }}
                itemStyle={{ color: '#d1d5db' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Tasks Done (%)" fill="#00BFFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Attendance (%)" fill="#8F5CFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Report Cards */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {reports.map(team => {
          const taskRate = team.tasksAssigned > 0 ? Math.round((team.tasksCompleted / team.tasksAssigned) * 100) : 100;
          const meetingRate = team.meetingsTotal > 0 ? Math.round((team.meetingsAttended / team.meetingsTotal) * 100) : 100;

          return (
            <motion.div 
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { 
                  opacity: 1, 
                  y: 0, 
                  transition: { 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25 
                  } 
                }
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#111111] rounded-xl border border-gray-850 hover:border-gray-800 transition-colors p-6 flex flex-col justify-between cursor-pointer space-y-6"
              onClick={() => setSelectedTeam(team)}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: team.color }}></span>
                  {team.name}
                </h3>
                <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {team.memberCount} members
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </span>
              </div>

              {/* Stats lists */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                
                {/* Tasks Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Tasks Completed</span>
                    <span className="text-white font-bold">{taskRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-850 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00BFFF] rounded-full" style={{ width: `${taskRate}%` }}></div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {team.tasksCompleted} / {team.tasksAssigned} tasks done
                  </div>
                </div>

                {/* Meetings Attendance Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Meeting Presence</span>
                    <span className="text-white font-bold">{meetingRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-850 rounded-full overflow-hidden">
                    <div className="h-full bg-[#8F5CFF] rounded-full" style={{ width: `${meetingRate}%` }}></div>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {team.meetingsAttended} / {team.meetingsTotal} slots present
                  </div>
                </div>
              </div>

              {/* Secondary details */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-850 pt-4 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#00BFFF]" />
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Avg Task Duration</div>
                    <div className="text-white font-bold">{team.avgTaskCompletionTime} Hours</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-gray-550 text-[10px] uppercase font-bold tracking-wider">Approved Budget</div>
                    <div className="text-[#22C55E] font-bold">₹{team.expensesApproved}</div>
                  </div>
                </div>
              </div>

              {/* Active member banner */}
              {team.mostActiveMember && (
                <div className="bg-[#161616] p-3 rounded-lg flex items-center justify-between text-xs border border-gray-850">
                  <div className="flex items-center gap-2">
                    <img 
                      src={team.mostActiveMember.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${team.mostActiveMember.name}`}
                      alt={team.mostActiveMember.name}
                      className="h-6 w-6 rounded-full border border-purple-500/20"
                    />
                    <div>
                      <div className="text-gray-500 text-[10px] uppercase font-bold">Most Active Coordinator</div>
                      <div className="text-white font-semibold">{team.mostActiveMember.name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] px-2 py-0.5 rounded font-bold">
                    {team.mostActiveMember.completedTasks} tasks
                  </span>
                </div>
              )}

            </motion.div>
          );
        })}
      </motion.div>

      {/* Drill-down Modal details */}
      <AnimatePresence>
        {selectedTeam && (
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
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col justify-between shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
                  <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedTeam.color }}></span>
                    {selectedTeam.name} Roster details
                  </h3>
                  <button 
                    onClick={() => setSelectedTeam(null)}
                    className="text-gray-500 hover:text-white cursor-pointer font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1">
                  <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Coordinators Breakdown</h4>
                  <div className="space-y-2">
                    {selectedTeam.members.map(m => (
                      <div key={m._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-850 bg-[#161616]/30">
                        <div className="flex items-center gap-2">
                          <img src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`} alt={m.name} className="h-7 w-7 rounded-full" />
                          <div>
                            <div className="text-xs text-white font-semibold">{m.name}</div>
                            <div className="text-[10px] text-gray-500">{m.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-gray-850 text-gray-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {m.subRole.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeam(null)}
                className="w-full mt-6 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
