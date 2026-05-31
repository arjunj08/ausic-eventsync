import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, X, Landmark, FileText, Loader2, Check, Ban, DollarSign } from 'lucide-react';

export default function Expenses() {
  const { user } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({ totalSubmitted: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const categories = ['Hardware', 'Marketing', 'Catering', 'Logistics', 'Decorations', 'Other'];

  const fetchExpensesAndStats = async () => {
    try {
      setLoading(true);
      const [expensesRes, statsRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/expenses/stats')
      ]);
      setExpenses(expensesRes.data);
      setStats(statsRes.data);
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
      if (eventsRes.data.length > 0) setSelectedEventId(eventsRes.data[0]._id);
      
      const userTeamId = user?.teamId?._id || user?.teamId;
      if (userTeamId) {
        setSelectedTeamId(userTeamId);
      } else if (teamsRes.data.length > 0) {
        setSelectedTeamId(teamsRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpensesAndStats();
    fetchDropdownData();
  }, []);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('amount', amount);
    formData.append('category', category);
    formData.append('eventId', selectedEventId);
    formData.append('teamId', selectedTeamId);
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    try {
      await axios.post('/api/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsModalOpen(false);
      fetchExpensesAndStats();

      // Reset form
      setTitle('');
      setAmount('');
      setCategory('Marketing');
      setReceiptFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to submit expense');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`/api/expenses/${id}/status`, { status });
      fetchExpensesAndStats(); // Refresh stats and lists
    } catch (err) {
      console.error(err);
      alert('Failed to update expense status');
    }
  };

  return (
    <div className="pb-24 px-6 max-w-7xl mx-auto pt-20">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Expense Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Track and submit event expenses</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="h-5 w-5 mr-1.5" />
          Add Expense
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111111] border border-gray-850 rounded-2xl p-6 shadow-md relative overflow-hidden">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Submitted</span>
          <span className="text-2xl font-bold text-white">₹{stats.totalSubmitted.toLocaleString('en-IN')}</span>
          <div className="absolute -bottom-2 -right-2 opacity-5">
            <Landmark className="h-16 w-16 text-white" />
          </div>
        </div>
        
        <div className="bg-[#111111] border border-gray-850 rounded-2xl p-6 shadow-md relative overflow-hidden border-l-4 border-green-500">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-green-500">Approved</span>
          <span className="text-2xl font-bold text-green-500">₹{stats.approved.toLocaleString('en-IN')}</span>
          <div className="absolute -bottom-2 -right-2 opacity-5">
            <Check className="h-16 w-16 text-green-500" />
          </div>
        </div>

        <div className="bg-[#111111] border border-gray-850 rounded-2xl p-6 shadow-md relative overflow-hidden border-l-4 border-yellow-500">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-yellow-500">Pending</span>
          <span className="text-2xl font-bold text-yellow-500">₹{stats.pending.toLocaleString('en-IN')}</span>
          <div className="absolute -bottom-2 -right-2 opacity-5">
            <Loader2 className="h-16 w-16 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Expenses list */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">
          {isAdmin ? 'All Submitted Expenses' : 'My Submitted Expenses'}
        </h3>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Expenses Yet</h3>
            <p className="text-gray-400 text-sm">Submit your first expense request using the top-right button.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenses.map(expense => (
              <div 
                key={expense._id}
                className="bg-[#111111] border border-gray-850 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-850 px-2.5 py-1 rounded-md border border-gray-800">
                      {expense.category}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                      expense.status === 'approved' 
                        ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                        : expense.status === 'rejected'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                    }`}>
                      {expense.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{expense.title}</h4>
                  <span className="text-xl font-bold text-[#00BFFF] block mb-4">₹{expense.amount.toLocaleString('en-IN')}</span>

                  <div className="space-y-1.5 border-t border-gray-850 pt-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Submitted By</span>
                      <span className="text-gray-300 font-medium">{expense.submittedBy?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Event Scope</span>
                      <span className="text-gray-300 font-medium truncate max-w-[150px]">{expense.eventId?.title}</span>
                    </div>
                    {expense.receiptUrl && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                        <span>Receipt Doc</span>
                        <a 
                          href={`http://localhost:5000${expense.receiptUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#00BFFF] hover:underline flex items-center"
                        >
                          <FileText className="h-3 w-3 mr-0.5" />
                          View File
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin approvals controls */}
                {isAdmin && expense.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3 border-t border-gray-850 pt-4 mt-5">
                    <button
                      onClick={() => handleUpdateStatus(expense._id, 'rejected')}
                      className="h-9 bg-red-950/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(expense._id, 'approved')}
                      className="h-9 bg-green-950/20 hover:bg-green-600 text-green-500 hover:text-white border border-green-500/30 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer animate-pulse"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-14 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between">
              <h3 className="font-bold text-white text-lg">Submit Event Expense</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-850"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Expense Description</label>
                <input
                  type="text"
                  placeholder="e.g. Cables, adapter adapters and extension box"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-[#1a1a1a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 py-2.5 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2 rounded-lg text-sm"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Scope</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2.5 rounded-lg text-sm"
                  >
                    <option value="" disabled>Select event</option>
                    {events.map(e => (
                      <option key={e._id} value={e._id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] text-white border border-gray-800 focus:border-[#00BFFF] outline-none px-3 py-2.5 rounded-lg text-sm"
                  >
                    <option value="" disabled>Select team</option>
                    {teams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Upload Receipt (Optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  className="w-full bg-[#1a1a1a] text-gray-400 border border-gray-800 file:bg-gray-850 file:border-none file:text-white file:text-xs file:font-semibold file:px-3 file:py-1 file:rounded-md text-xs cursor-pointer h-[38px] flex items-center px-2 rounded-lg"
                />
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-gray-855 pt-4 flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-gray-850 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#00BFFF] hover:bg-[#00D4FF] text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-center"
                >
                  {modalLoading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
