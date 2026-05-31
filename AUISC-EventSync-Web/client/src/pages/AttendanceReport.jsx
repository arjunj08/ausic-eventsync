import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Download, 
  FileText, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export default function AttendanceReport() {
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, meetingPercentage, eventPercentage, overall

  // Unique Teams List
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/admin/attendance-report');
        setReportData(res.data);
        
        // Extract unique teams
        const uniqueTeams = [];
        res.data.forEach(item => {
          if (item.team && !uniqueTeams.includes(item.team.name)) {
            uniqueTeams.push(item.team.name);
          }
        });
        setTeams(uniqueTeams);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch attendance reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  // Filter and Sort Data
  useEffect(() => {
    let result = [...reportData];

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.email.toLowerCase().includes(query)
      );
    }

    // Team Filter
    if (selectedTeam !== 'all') {
      result = result.filter(item => item.team?.name === selectedTeam);
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(item => {
        const overall = (item.meetingPercentage + item.eventPercentage) / 2;
        if (statusFilter === 'good') return overall >= 75;
        if (statusFilter === 'risk') return overall >= 50 && overall < 75;
        if (statusFilter === 'critical') return overall < 50;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'meetingPercentage') {
        return b.meetingPercentage - a.meetingPercentage;
      }
      if (sortBy === 'eventPercentage') {
        return b.eventPercentage - a.eventPercentage;
      }
      if (sortBy === 'overall') {
        const overallA = (a.meetingPercentage + a.eventPercentage) / 2;
        const overallB = (b.meetingPercentage + b.eventPercentage) / 2;
        return overallB - overallA;
      }
      return 0;
    });

    setFilteredData(result);
  }, [reportData, searchQuery, selectedTeam, statusFilter, sortBy]);

  // Calculations for overview stats
  const getOverviewStats = () => {
    if (filteredData.length === 0) return { avgMeeting: 0, avgEvent: 0, criticalCount: 0 };
    
    let sumMeeting = 0;
    let sumEvent = 0;
    let criticalCount = 0;

    filteredData.forEach(item => {
      sumMeeting += item.meetingPercentage;
      sumEvent += item.eventPercentage;
      const overall = (item.meetingPercentage + item.eventPercentage) / 2;
      if (overall < 50) criticalCount++;
    });

    return {
      avgMeeting: Math.round(sumMeeting / filteredData.length),
      avgEvent: Math.round(sumEvent / filteredData.length),
      criticalCount
    };
  };

  const stats = getOverviewStats();

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Team', 'Attended Meetings', 'Total Meetings', 'Meeting %', 'Attended Events', 'Total Events', 'Event %', 'Overall %'];
    const rows = filteredData.map(item => [
      item.name,
      item.email,
      item.team?.name || 'No Squad',
      item.attendedMeetings,
      item.totalMeetings,
      `${item.meetingPercentage}%`,
      item.attendedEvents,
      item.totalEvents,
      `${item.eventPercentage}%`,
      `${Math.round((item.meetingPercentage + item.eventPercentage) / 2)}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AUISC_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded successfully!');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export.');
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, 'F');

      // Title
      doc.setTextColor(0, 191, 255); // Cyan
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('AUISC EVENTSYNC ATTENDANCE REPORT', 15, 20);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 27);

      // Horizontal line
      doc.setDrawColor(31, 31, 31);
      doc.line(15, 32, 195, 32);

      // Overview Stats
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Total Coordinators Tracked: ${filteredData.length}`, 15, 42);
      doc.text(`Average Meeting Attendance: ${stats.avgMeeting}%`, 15, 48);
      doc.text(`Average Event Check-ins: ${stats.avgEvent}%`, 15, 54);

      // Table Header
      let y = 68;
      doc.setFillColor(22, 22, 22);
      doc.rect(15, y, 180, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 191, 255);
      doc.text('Name', 17, y + 6);
      doc.text('Team', 65, y + 6);
      doc.text('Meetings (Att/Tot)', 105, y + 6);
      doc.text('Events (Att/Tot)', 145, y + 6);
      doc.text('Overall %', 180, y + 6);

      y += 8;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      filteredData.forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          doc.setFillColor(10, 10, 10);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
          
          // Re-render Header on new page
          doc.setFillColor(22, 22, 22);
          doc.rect(15, y, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 191, 255);
          doc.text('Name', 17, y + 6);
          doc.text('Team', 65, y + 6);
          doc.text('Meetings (Att/Tot)', 105, y + 6);
          doc.text('Events (Att/Tot)', 145, y + 6);
          doc.text('Overall %', 180, y + 6);
          y += 8;
          doc.setFont('helvetica', 'normal');
        }

        // Row background striping
        if (index % 2 === 0) {
          doc.setFillColor(15, 15, 15);
        } else {
          doc.setFillColor(10, 10, 10);
        }
        doc.rect(15, y, 180, 8, 'F');

        const overall = Math.round((item.meetingPercentage + item.eventPercentage) / 2);
        
        // Critical color alert
        if (overall < 50) {
          doc.setTextColor(239, 68, 68); // Red
        } else if (overall < 75) {
          doc.setTextColor(245, 158, 11); // Amber
        } else {
          doc.setTextColor(255, 255, 255); // White
        }

        doc.text(item.name.substring(0, 22), 17, y + 6);
        doc.setTextColor(200, 200, 200);
        doc.text(item.team?.name || 'No Squad', 65, y + 6);
        doc.text(`${item.attendedMeetings}/${item.totalMeetings} (${item.meetingPercentage}%)`, 105, y + 6);
        doc.text(`${item.attendedEvents}/${item.totalEvents} (${item.eventPercentage}%)`, 145, y + 6);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${overall}%`, 180, y + 6);
        doc.setFont('helvetica', 'normal');

        y += 8;
      });

      doc.save(`AUISC_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF Report downloaded successfully!');
    } catch (pdfErr) {
      console.error(pdfErr);
      toast.error('Failed to compile PDF Report.');
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pb-24 px-4 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#00BFFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 pb-24 px-4 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Authorization Error</h2>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8">
      
      {/* Title Header */}
      <div className="border-b border-gray-850 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">ATTENDANCE</span> SPREADSHEETS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track, filter, and audit club coordinate performance, meeting attendance and event operations.
          </p>
        </div>

        {/* Export triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-[#2A2A2A] hover:bg-gray-750 text-gray-300 font-semibold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer border border-gray-800 transition-all"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-extrabold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileText className="h-4 w-4 text-black" />
            Generate PDF
          </button>
        </div>
      </div>

      {/* Metrics Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Meeting Score */}
        <div className="bg-[#111111] p-5 rounded-xl border border-gray-850 flex items-center space-x-4">
          <div className="p-3 bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Average Meetings Score</span>
            <span className="text-2xl font-black text-white">{stats.avgMeeting}%</span>
          </div>
        </div>

        {/* Event check-ins */}
        <div className="bg-[#111111] p-5 rounded-xl border border-gray-850 flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-[#8F5CFF] rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Average Event Check-ins</span>
            <span className="text-2xl font-black text-white">{stats.avgEvent}%</span>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="bg-[#111111] p-5 rounded-xl border border-gray-850 flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${stats.criticalCount > 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
            {stats.criticalCount > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase block">Members At Critical Risk</span>
            <span className={`text-2xl font-black ${stats.criticalCount > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
              {stats.criticalCount} <span className="text-xs font-semibold text-gray-500">(&lt; 50%)</span>
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Section */}
      <div className="bg-[#111111] p-5 rounded-xl border border-gray-850 flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search member by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF] transition-colors"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4.5 w-4.5 text-gray-500 flex-shrink-0" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
          >
            <option value="all">All Squads</option>
            {teams.map((tName, i) => (
              <option key={i} value={tName}>{tName}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
          >
            <option value="all">All Performance Levels</option>
            <option value="good">Good (Overall &ge; 75%)</option>
            <option value="risk">At Risk (Overall 50% - 74%)</option>
            <option value="critical">Critical (Overall &lt; 50%)</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#00BFFF]"
          >
            <option value="name">Sort by Name</option>
            <option value="overall">Sort by Overall Score</option>
            <option value="meetingPercentage">Sort by Meeting Attendance</option>
            <option value="eventPercentage">Sort by Event Check-ins</option>
          </select>
        </div>

      </div>

      {/* Spreadsheet Table Grid */}
      <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161616] text-[#00BFFF] border-b border-gray-850 text-xs uppercase tracking-wider font-extrabold">
                <th className="py-4 px-6">Member Name / Email</th>
                <th className="py-4 px-6">Squad Info</th>
                <th className="py-4 px-6 text-center">Meetings Log</th>
                <th className="py-4 px-6 text-center">Events Log</th>
                <th className="py-4 px-6 text-center">Overall Score</th>
                <th className="py-4 px-6 text-center">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 px-6 text-center text-gray-500">
                    No coordinate records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const overall = Math.round((item.meetingPercentage + item.eventPercentage) / 2);
                  let statusBadge = (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-bold uppercase tracking-wider text-[10px]">
                      Good
                    </span>
                  );
                  if (overall < 50) {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded-md font-bold uppercase tracking-wider text-[10px] animate-pulse">
                        Critical
                      </span>
                    );
                  } else if (overall < 75) {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md font-bold uppercase tracking-wider text-[10px]">
                        At Risk
                      </span>
                    );
                  }

                  return (
                    <tr key={index} className="hover:bg-[#151515] transition-all">
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{item.email}</div>
                      </td>

                      {/* Squad */}
                      <td className="py-4 px-6">
                        {item.team ? (
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="h-2.5 w-2.5 rounded-full inline-block" 
                              style={{ backgroundColor: item.team.color || '#00BFFF' }}
                            />
                            <span className="text-white font-semibold">{item.team.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 font-medium italic">Unassigned</span>
                        )}
                      </td>

                      {/* Meetings */}
                      <td className="py-4 px-6 text-center font-medium">
                        <span className="text-white block font-bold text-sm">
                          {item.attendedMeetings} / {item.totalMeetings}
                        </span>
                        <span className="text-gray-400 mt-0.5 block">{item.meetingPercentage}% attended</span>
                      </td>

                      {/* Events */}
                      <td className="py-4 px-6 text-center font-medium">
                        <span className="text-white block font-bold text-sm">
                          {item.attendedEvents} / {item.totalEvents}
                        </span>
                        <span className="text-gray-400 mt-0.5 block">{item.eventPercentage}% checked-in</span>
                      </td>

                      {/* Overall Ratio */}
                      <td className="py-4 px-6 text-center">
                        <span className={`text-base font-black ${overall >= 75 ? 'text-[#00BFFF]' : overall >= 50 ? 'text-amber-400' : 'text-red-500'}`}>
                          {overall}%
                        </span>
                      </td>

                      {/* Badge status */}
                      <td className="py-4 px-6 text-center">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Guide */}
      <div className="bg-[#161616] border border-gray-850 p-4 rounded-xl flex gap-3 text-xs text-gray-400 leading-normal">
        <Info className="h-5 w-5 text-[#00BFFF] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Report Calculation Audit Guide</span>
          <span>
            Meetings Log counts total completed briefs scheduled for the member vs their marked presence. Events Log evaluates total checked-in events against all published event boards. Overall Score weights both indicators equally. Critical status alerts are triggered for coordinators falling below 50% engagement.
          </span>
        </div>
      </div>

    </div>
  );
}
