import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FileCheck, 
  Download, 
  Search, 
  Filter, 
  Loader2, 
  ShieldAlert,
  ChevronDown,
  Calendar
} from 'lucide-react';

const MODULES = ['user', 'event', 'task', 'expense', 'meeting', 'team', 'system'];

export default function AuditLogConsole() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null); // Detail modal

  // Filter states
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterModule) params.module = filterModule;
      if (filterAction) params.action = filterAction;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get('/api/audit-logs', { params });
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterModule, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    try {
      let queryStr = '?';
      if (filterModule) queryStr += `module=${filterModule}&`;
      if (startDate) queryStr += `startDate=${startDate}&`;
      if (endDate) queryStr += `endDate=${endDate}&`;

      // Redirect browser to download URL
      window.open(`/api/audit-logs/export${queryStr}`);
      toast.success('CSV log sheet download triggered!');
    } catch (err) {
      toast.error('Failed to trigger CSV export.');
    }
  };

  // Color mappings per audit module type
  const getModuleColor = (mod) => {
    switch (mod) {
      case 'user': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'event': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'task': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'expense': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'meeting': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'team': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  // Filter logs locally by user name/email search parameter
  const filteredLogs = logs.filter(log => {
    if (!searchUser) return true;
    const name = log.userName ? log.userName.toLowerCase() : 'system';
    return name.includes(searchUser.toLowerCase());
  });

  return (
    <div className="pt-20 pb-24 px-4 md:px-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header and Export buttons */}
      <div className="border-b border-gray-850 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            <span className="text-[#00BFFF]">SYSTEM AUDIT</span> LOGS
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track user authorizations, event lifecycle modifications, budgets, and security parameters.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-[#111111] hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest px-5 py-3 border border-gray-800 rounded-xl cursor-pointer transition-colors flex items-center gap-2"
        >
          <Download className="h-4.5 w-4.5" />
          Export CSV File
        </button>
      </div>

      {/* Filter and control sheets */}
      <div className="bg-[#111111] p-5 rounded-xl border border-gray-850 text-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          
          <div className="space-y-1">
            <label className="text-gray-450 font-bold uppercase tracking-wider">Module Type</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
            >
              <option value="">All Modules</option>
              {MODULES.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-450 font-bold uppercase tracking-wider">User Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-450 font-bold uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-450 font-bold uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00BFFF] cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="bg-[#00BFFF]/10 border border-[#00BFFF]/30 text-[#00BFFF] font-bold rounded-lg py-2.5 text-xs uppercase tracking-wider hover:bg-[#00BFFF]/20 cursor-pointer transition-colors"
          >
            Apply Filters
          </button>

        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-[#111111] rounded-xl border border-gray-850 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#00BFFF] animate-spin mb-2" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Loading system audit tables...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-850 text-gray-450 font-bold uppercase tracking-wider bg-[#161616]">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-650 font-medium">
                      No system audit logs found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isSuspicious = log.action === 'login_failed' && log.metadata?.email;
                    
                    return (
                      <tr 
                        key={log._id}
                        onClick={() => setSelectedLog(log)}
                        className={`border-b border-gray-850/50 hover:bg-[#1A1A1A]/40 transition-colors cursor-pointer ${
                          isSuspicious ? 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-gray-400 font-medium whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {log.userId?.avatar && (
                              <img src={log.userId.avatar} alt="" className="h-5 w-5 rounded-full" />
                            )}
                            <div>
                              <div className="text-white font-semibold">{log.userName}</div>
                              <div className="text-[10px] text-gray-500 font-medium uppercase">{log.userRole}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getModuleColor(log.module)}`}>
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-300">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-gray-400 leading-normal max-w-xs truncate">
                          {isSuspicious ? (
                            <span className="text-red-400 font-bold flex items-center gap-1">
                              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                              Suspicious: {log.description}
                            </span>
                          ) : (
                            log.description
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
              <h3 className="font-extrabold text-white text-base">
                Audit Log Details
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-white cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-500 font-bold uppercase tracking-wider">Timestamp</div>
                  <div className="text-white mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-bold uppercase tracking-wider">IP Address</div>
                  <div className="text-white mt-0.5">{selectedLog.ipAddress || 'Internal'}</div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 font-bold uppercase tracking-wider">User Agent</div>
                <div className="text-gray-400 mt-0.5 break-all leading-normal">{selectedLog.userAgent || 'None'}</div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 font-bold uppercase tracking-wider">Metadata Parameters</label>
                <pre className="bg-[#161616] border border-gray-850 rounded-lg p-3 text-[10px] text-cyan-400 font-mono overflow-x-auto max-h-40 leading-relaxed">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full mt-6 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Metadata Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
