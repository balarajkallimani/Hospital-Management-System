import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();

  // Mock Admin Metrics
  const metrics = [
    { title: 'Total Doctors', count: '12', color: 'bg-primary/10 text-primary border-primary/20' },
    { title: 'Total Patients', count: '1,420', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Receptionists', count: '4', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { title: 'System Alerts', count: '0', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-100">System Admin Control Center</h2>
        <p className="text-sm text-slate-400 mt-1">Configure staff details, monitor registrations, and verify server diagnostics.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, index) => (
          <div key={index} className={`p-6 bg-slate-900 border rounded-xl flex flex-col justify-between ${m.color}`}>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.title}</span>
            <span className="text-3xl font-extrabold mt-2">{m.count}</span>
          </div>
        ))}
      </div>

      {/* Admin Action Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Quick Administrator Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <Link to="/doctors/new" className="py-3 px-4 bg-primary hover:bg-primary-dark active:bg-primary-dark/80 text-white font-semibold rounded-xl transition">
            Register New Staff
          </Link>
          <Link to="/doctors" className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700/50 transition">
            Manage Departments
          </Link>
          <Link to="/reports" className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700/50 transition">
            View Audit Logs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
