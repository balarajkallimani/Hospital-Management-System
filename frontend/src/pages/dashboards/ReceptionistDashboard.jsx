import React from 'react';
import { useAuth } from '../../context/AuthContext';

function ReceptionistDashboard() {
  const { user } = useAuth();

  // Mock Receptionist Metrics
  const metrics = [
    { title: 'Registered Today', count: '14', color: 'bg-primary/10 text-primary border-primary/20' },
    { title: 'Checked In Today', count: '8', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { title: 'Available Doctors', count: '9/12', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { title: 'Unpaid Invoices', count: '4', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-100">Intake Desk Workstation</h2>
        <p className="text-sm text-slate-400 mt-1">Register incoming patients, check in scheduled appointments, and generate billing invoices.</p>
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

      {/* Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Intake Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button className="py-3 px-4 bg-primary hover:bg-primary-dark active:bg-primary-dark/80 text-white font-semibold rounded-xl transition">
            Register New Patient
          </button>
          <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700/50 transition">
            Book Appointment
          </button>
          <button className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold rounded-xl border border-slate-700/50 transition">
            Create Bill / Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceptionistDashboard;
