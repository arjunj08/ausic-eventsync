import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Check, 
  QrCode, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  Search, 
  AlertCircle,
  Camera,
  X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

export default function Attendance() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendanceData, setAttendanceData] = useState({ logs: [], stats: { totalMembers: 0, attendedCount: 0, rate: 0 } });
  
  // Member states
  const [memberHistory, setMemberHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  // Admin states
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const scannerRef = useRef(null);

  // Fetch events list
  const fetchEvents = async () => {
    try {
      const res = await axios.get('/api/events');
      // Filter out drafts for member view
      const activeEvents = user.role === 'admin' 
        ? res.data 
        : res.data.filter(e => e.status === 'published');
      setEvents(activeEvents);
      if (activeEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(activeEvents[0]._id);
      }
    } catch (err) {
      console.error('Fetch events error:', err);
    }
  };

  // Fetch admin logs
  const fetchAttendanceLogs = async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendance/event/${eventId}`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch member history
  const fetchMemberHistory = async () => {
    try {
      const res = await axios.get(`/api/attendance/member/${user.id}`);
      setMemberHistory(res.data);
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    if (user.role !== 'admin') {
      fetchMemberHistory();
    }
  }, []);

  useEffect(() => {
    if (selectedEventId && user.role === 'admin') {
      fetchAttendanceLogs(selectedEventId);
    }
  }, [selectedEventId]);

  // Handle Manual checkin (Admin checks in a user, or Member checks in themselves)
  const handleManualCheckIn = async (eventId, checkInUserId = null, checkInMethod = 'manual') => {
    try {
      const res = await axios.post('/api/attendance/checkin', {
        eventId,
        method: checkInMethod
      });
      
      setScanSuccess('Check-in recorded successfully!');
      setTimeout(() => setScanSuccess(''), 4000);
      
      // Refresh views
      if (user.role === 'admin') {
        fetchAttendanceLogs(selectedEventId);
      } else {
        fetchMemberHistory();
      }
    } catch (err) {
      setScanError(err.response?.data?.error || 'Check-in failed');
      setTimeout(() => setScanError(''), 4000);
    }
  };

  // HTML5 QR Code Scanner handler
  const startScanner = () => {
    setScanning(true);
    setScanError('');
    setScanSuccess('');

    // Wait for the div to mount
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccess = async (decodedText) => {
        try {
          // Expecting QR code format: {"eventId":"..."} or string representing eventId
          let parsedEventId = decodedText;
          try {
            const data = JSON.parse(decodedText);
            if (data.eventId) parsedEventId = data.eventId;
          } catch(e) {}

          await axios.post('/api/attendance/checkin', {
            eventId: parsedEventId,
            method: 'qr'
          });

          setScanSuccess('Checked in successfully via QR! ✅');
          html5QrcodeScanner.clear();
          setScanning(false);
          fetchMemberHistory();
        } catch (err) {
          setScanError(err.response?.data?.error || 'QR check-in failed');
        }
      };

      const onScanFailure = (error) => {
        // Suppress logs to keep debug cleaner
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = html5QrcodeScanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().then(() => {
        setScanning(false);
      }).catch(err => {
        console.error("Failed to clear scanner", err);
        setScanning(false);
      });
    } else {
      setScanning(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const activeEvent = events.find(e => e._id === selectedEventId);
    const eventTitle = activeEvent ? activeEvent.title : 'Event';
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Checked In At,Method\n";

    attendanceData.logs.forEach(log => {
      const name = log.userId?.name || log.userName;
      const email = log.userId?.email || 'N/A';
      const time = new Date(log.checkedInAt).toLocaleString();
      const method = log.method;
      csvContent += `"${name}","${email}","${time}","${method}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${eventTitle.replace(/\s+/g, '_')}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportToPDF = () => {
    const activeEvent = events.find(e => e._id === selectedEventId);
    const eventTitle = activeEvent ? activeEvent.title : 'Event';
    
    const doc = new jsPDF();
    doc.setFillColor(11, 12, 16); // Cosmic dark background
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(102, 252, 241); // Cyan accent title
    doc.setFontSize(22);
    doc.text(`AUISC EventSync - Attendance Report`, 14, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`Event: ${eventTitle}`, 14, 30);
    doc.text(`Date: ${activeEvent ? new Date(activeEvent.date).toLocaleDateString() : 'N/A'}`, 14, 38);
    doc.text(`Attendance Summary: ${attendanceData.stats.attendedCount} / ${attendanceData.stats.totalMembers} Members (${attendanceData.stats.rate}%)`, 14, 46);

    doc.setDrawColor(31, 31, 31);
    doc.line(14, 52, 196, 52);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Name", 14, 60);
    doc.text("Email", 70, 60);
    doc.text("Checked In At", 130, 60);
    doc.text("Method", 180, 60);

    doc.line(14, 63, 196, 63);

    doc.setTextColor(255, 255, 255);
    let yPos = 70;
    attendanceData.logs.forEach((log, index) => {
      if (yPos > 280) {
        doc.addPage();
        doc.setFillColor(11, 12, 16);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(150, 150, 150);
        doc.text("Name", 14, 20);
        doc.text("Email", 70, 20);
        doc.text("Checked In At", 130, 20);
        doc.text("Method", 180, 20);
        doc.line(14, 23, 196, 23);
        doc.setTextColor(255, 255, 255);
        yPos = 30;
      }
      const name = log.userId?.name || log.userName;
      const email = log.userId?.email || 'N/A';
      const time = new Date(log.checkedInAt).toLocaleString();
      const method = log.method.toUpperCase();

      doc.text(name, 14, yPos);
      doc.text(email, 70, yPos);
      doc.text(time, 130, yPos);
      doc.text(method, 180, yPos);
      
      yPos += 8;
    });

    doc.save(`${eventTitle.replace(/\s+/g, '_')}_attendance.pdf`);
  };

  // Filter logs for Admin search
  const filteredLogs = attendanceData.logs.filter(log => {
    const name = (log.userId?.name || log.userName).toLowerCase();
    const email = (log.userId?.email || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-wider text-white">
          <span className="text-[#00BFFF]">ATTENDANCE</span> TRACKER
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Coordinate event check-ins and export audit logs.
        </p>
      </div>

      {user.role === 'admin' ? (
        // ================= ADMIN VIEW =================
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#00BFFF] cursor-pointer"
              >
                {events.length === 0 && <option>No events available</option>}
                {events.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            {selectedEventId && (
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  disabled={attendanceData.logs.length === 0}
                  className="flex items-center justify-center gap-2 bg-[#1c1c1c] text-white px-5 py-3 rounded-lg border border-gray-800 hover:border-gray-650 hover:bg-[#252525] transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={attendanceData.logs.length === 0}
                  className="flex items-center justify-center gap-2 bg-[#1c1c1c] text-white px-5 py-3 rounded-lg border border-gray-800 hover:border-gray-650 hover:bg-[#252525] transition-all disabled:opacity-50"
                >
                  <FileText className="h-5 w-5 text-red-500" />
                  <span>Export PDF</span>
                </button>
              </div>
            )}
          </div>

          {selectedEventId ? (
            <>
              {/* Stats Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Members */}
                <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Total Members</span>
                    <span className="text-3xl font-extrabold text-white">{attendanceData.stats.totalMembers}</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    <Users className="h-6 w-6" />
                  </div>
                </div>

                {/* Attended */}
                <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Attended Count</span>
                    <span className="text-3xl font-extrabold text-[#00BFFF]">{attendanceData.stats.attendedCount}</span>
                  </div>
                  <div className="p-3 bg-[#00BFFF]/10 rounded-lg text-[#00BFFF]">
                    <Check className="h-6 w-6" />
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Attendance Rate</span>
                    <span className="text-xl font-bold text-green-400">{attendanceData.stats.rate}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-[#1A1A1A] rounded-full h-3 overflow-hidden border border-gray-850">
                    <div 
                      className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${attendanceData.stats.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden">
                <div className="p-6 border-b border-gray-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#00BFFF]" />
                    Check-in Roster
                  </h2>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00BFFF]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-850 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-[#161616]">
                        <th className="px-6 py-4">Member</th>
                        <th className="px-6 py-4">Checked In At</th>
                        <th className="px-6 py-4">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500 text-sm">
                            No check-ins registered for this search.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log._id} className="border-b border-gray-850/50 hover:bg-[#1A1A1A]/30 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <img
                                src={log.userId?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(log.userName)}`}
                                alt={log.userName}
                                className="h-8 w-8 rounded-full border border-purple-500/30"
                              />
                              <div>
                                <div className="text-white font-semibold text-sm">{log.userId?.name || log.userName}</div>
                                <div className="text-xs text-gray-400">{log.userId?.email || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">
                              {new Date(log.checkedInAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                log.method === 'qr' ? 'bg-[#00BFFF]/10 text-[#00BFFF]' : 'bg-green-500/10 text-green-400'
                              }`}>
                                {log.method.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#111111] p-12 text-center rounded-xl border border-gray-850 text-gray-500">
              Please select or create an event to monitor attendance.
            </div>
          )}
        </div>
      ) : (
        // ================= MEMBER VIEW =================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main checkin card & Scanner */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Camera Scanner View */}
            {scanning && (
              <div className="bg-[#111111] p-6 rounded-xl border border-red-500/30 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-red-500 animate-pulse" />
                    Scan Event QR Code
                  </h3>
                  <button 
                    onClick={stopScanner}
                    className="p-1 rounded-full bg-gray-850 hover:bg-gray-700 text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div id="reader" className="w-full bg-[#0a0a0a] rounded-lg overflow-hidden border border-gray-800"></div>
                
                <p className="text-xs text-gray-400 text-center mt-3">
                  Align the club coordinator's event QR within the box to check in instantly.
                </p>
              </div>
            )}

            {/* Event List */}
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#00BFFF]" />
                Upcoming Club Events
              </h2>

              {scanError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {scanSuccess && (
                <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-bounce">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>{scanSuccess}</span>
                </div>
              )}

              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No upcoming published events.
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((ev) => {
                    const checkedIn = memberHistory.find(h => h.eventId?._id === ev._id || h.eventId === ev._id);
                    return (
                      <div 
                        key={ev._id} 
                        className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          checkedIn 
                            ? 'bg-[#141d19] border-emerald-500/30' 
                            : 'bg-[#181818] border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <h3 className="font-bold text-white text-md">{ev.title}</h3>
                          <div className="text-xs text-gray-400 mt-1 flex flex-col gap-0.5">
                            <span>📅 Date: {new Date(ev.date).toLocaleDateString()}</span>
                            <span>📍 Location: {ev.description || 'Club Hall'}</span>
                          </div>
                        </div>

                        <div>
                          {checkedIn ? (
                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              <span>Already Checked In ✅ ({checkedIn.method.toUpperCase()})</span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startScanner()}
                                className="bg-[#1A1A1A] border border-gray-800 text-white p-3 rounded-lg hover:bg-gray-800 transition-all text-sm flex items-center gap-1.5"
                                title="Scan QR Code to Checkin"
                              >
                                <QrCode className="h-4 w-4 text-[#00BFFF]" />
                                <span className="hidden sm:inline">Scan QR</span>
                              </button>
                              
                              <button
                                onClick={() => handleManualCheckIn(ev._id)}
                                className="bg-gradient-to-r from-[#00BFFF] to-[#8F5CFF] text-white font-bold px-4 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all flex items-center gap-1"
                              >
                                <span>Check In</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Member Side Card (QR Pass) */}
          <div className="space-y-6">
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-850 flex flex-col items-center text-center">
              <h3 className="font-bold text-white text-md mb-2 flex items-center gap-1.5">
                <QrCode className="h-5 w-5 text-[#00BFFF]" />
                Your Check-in Pass
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Show this digital badge QR to coordinates at the door for manual scanning.
              </p>
              
              <div className="bg-white p-4 rounded-xl border-4 border-[#00BFFF] shadow-lg shadow-[#00BFFF]/20">
                <QRCodeSVG 
                  value={JSON.stringify({ userId: user.id, userName: user.name })}
                  size={160}
                  level={"H"}
                  fgColor={"#0B0C10"}
                />
              </div>

              <div className="mt-5">
                <span className="text-white font-bold block">{user.name}</span>
                <span className="text-xs text-gray-400 block mt-1 uppercase tracking-wider font-semibold bg-[#1C1C1C] px-3 py-1 rounded-full border border-gray-800">
                  {user.role.toUpperCase()} PASS
                </span>
              </div>
            </div>

            {/* Checkin History */}
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-850">
              <h3 className="font-bold text-white text-md mb-4 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-purple-400" />
                History Log
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {memberHistory.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-4">No check-in history found.</div>
                ) : (
                  memberHistory.map((h) => (
                    <div key={h._id} className="p-3 bg-[#1A1A1A] rounded-lg border border-gray-850 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">{h.eventId?.title || 'Unknown Event'}</span>
                        <span className="text-[10px] text-gray-400">{h.method.toUpperCase()}</span>
                      </div>
                      <div className="text-gray-400 mt-1">📅 {new Date(h.checkedInAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
