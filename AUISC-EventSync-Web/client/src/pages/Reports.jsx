import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import { FileDown, Calendar, Search, Loader2 } from 'lucide-react';

export default function Reports() {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const categories = ['Hardware', 'Marketing', 'Catering', 'Logistics', 'Decorations', 'Other'];

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Query parameters for filter
      let queryParams = [];
      if (fromDate) queryParams.push(`fromDate=${fromDate}`);
      if (toDate) queryParams.push(`toDate=${toDate}`);
      if (category) queryParams.push(`category=${category}`);
      if (selectedEventId) queryParams.push(`eventId=${selectedEventId}`);
      if (selectedTeamId) queryParams.push(`teamId=${selectedTeamId}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await axios.get(`/api/expenses${queryString}`);
      
      // Filter only approved expenses for report summaries, as requested
      const approvedOnly = res.data.filter(e => e.status === 'approved');
      setExpenses(approvedOnly);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [eventsRes, teamsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/teams')
      ]);
      setEvents(eventsRes.data);
      setTeams(teamsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchDropdownData();
  }, [fromDate, toDate, category, selectedEventId, selectedTeamId]);

  // Aggregate Stats
  const totalApproved = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = expenses.length;
  
  // Unique categories count in current list
  const uniqueCategories = new Set(expenses.map(e => e.category)).size;

  // Export to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No data available to export.');
      return;
    }

    const csvData = expenses.map((e, idx) => ({
      'S.No': idx + 1,
      'Title': e.title,
      'Amount (INR)': e.amount,
      'Category': e.category,
      'Event': e.eventId?.title || 'N/A',
      'Team': e.teamId?.name || 'N/A',
      'Submitted By': e.submittedBy?.name || 'N/A',
      'Date': new Date(e.createdAt).toLocaleDateString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AUISC_Expense_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF using jsPDF
  const handleExportPDF = () => {
    if (expenses.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF();
    
    // Title styling
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(0, 191, 255); // Cyan
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.text('AUISC EVENTSYNC', 14, 20);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('APPROVED EXPENSE REPORT SUMMARY', 14, 30);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 140, 30);

    // Summary Section
    doc.setTextColor(17, 17, 17);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('SUMMARY STATISTICS', 14, 55);
    doc.line(14, 57, 196, 57);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Approved Amount: Rs. ${totalApproved.toLocaleString('en-IN')}`, 14, 67);
    doc.text(`Total Expenses Count: ${totalCount}`, 14, 75);
    doc.text(`Unique Categories: ${uniqueCategories}`, 14, 83);

    // Table Header
    doc.setFillColor(30, 30, 30);
    doc.rect(14, 95, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text('Title', 16, 101);
    doc.text('Category', 75, 101);
    doc.text('Event', 115, 101);
    doc.text('Amount (Rs)', 165, 101);

    // Table Rows
    doc.setTextColor(50, 50, 50);
    doc.setFont('Helvetica', 'normal');
    let y = 112;
    expenses.forEach((e) => {
      // Handle page overflow
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      // Draw bottom cell lines
      doc.line(14, y + 2, 196, y + 2);
      
      doc.text(e.title.substring(0, 28), 16, y);
      doc.text(e.category, 75, y);
      doc.text((e.eventId?.title || 'N/A').substring(0, 22), 115, y);
      doc.text(e.amount.toString(), 165, y);
      
      y += 10;
    });

    // Save File
    doc.save(`AUISC_Expense_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Expense Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Download approved expense summaries</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 hover:border-gray-700 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs tracking-wide transition-colors cursor-pointer"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-extrabold px-4.5 py-2.5 rounded-lg text-xs tracking-wide transition-all hover:scale-[1.02] cursor-pointer"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-[#111111] border border-gray-850 rounded-2xl p-6 mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">From Date</label>
          <input 
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">To Date</label>
          <input 
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Event</label>
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg"
          >
            <option value="">All Events</option>
            {events.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Squad</label>
          <select 
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg"
          >
            <option value="">All Squads</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Reports Summary metrics */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111111]/70 border border-gray-850 rounded-2xl p-5 text-center shadow-sm">
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Total Approved</span>
          <span className="text-xl font-bold text-green-500">₹{totalApproved.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-[#111111]/70 border border-gray-850 rounded-2xl p-5 text-center shadow-sm">
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Approved items</span>
          <span className="text-xl font-bold text-white">{totalCount}</span>
        </div>
        <div className="bg-[#111111]/70 border border-gray-850 rounded-2xl p-5 text-center shadow-sm">
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Categories</span>
          <span className="text-xl font-bold text-[#00BFFF]">{uniqueCategories}</span>
        </div>
      </div>

      {/* Filtered table */}
      <div className="bg-[#111111] border border-gray-850 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-[#00BFFF] animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs italic">
            No approved expenses matched your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1a1a1a] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850 text-gray-300">
                {expenses.map(exp => (
                  <tr key={exp._id} className="hover:bg-[#151515] transition-colors">
                    <td className="p-4 font-bold text-white">{exp.title}</td>
                    <td className="p-4">
                      <span className="bg-gray-850 border border-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-400">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 truncate max-w-[150px]">{exp.eventId?.title || 'N/A'}</td>
                    <td className="p-4">{exp.submittedBy?.name || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-[#00BFFF]">₹{exp.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
