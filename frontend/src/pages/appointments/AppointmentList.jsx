import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function AppointmentList() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved, completed, cancelled

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/appointments');
      if (response.data && response.data.success) {
        setAppointments(response.data.appointments);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === 'cancelled' && !window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await axios.put(`/api/appointments/${id}/status`, { status });
      if (response.data && response.data.success) {
        fetchAppointments(); // Reload list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Filter appointments for the active tab
  const filteredAppointments = appointments.filter((app) => app.status === activeTab);

  // Helper to format date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Booking CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Consultation Bookings</h2>
          <p className="text-sm text-slate-400 mt-1">Manage scheduled sessions and practitioner availability matches.</p>
        </div>
        {/* Patients, Receptionists and Admins can book appointments */}
        {(isPatient || isStaff) && (
          <Link
            to="/appointments/new"
            className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Book New Appointment
          </Link>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1">
        {['pending', 'approved', 'completed', 'cancelled'].map((tab) => {
          const count = appointments.filter((app) => app.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-4 border-b-2 font-semibold text-sm capitalize whitespace-nowrap transition-all duration-150 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Grid List layout */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-3"></div>
          Loading consultation records...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No appointments in <strong className="capitalize text-slate-400">{activeTab}</strong> status.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAppointments.map((app) => (
            <div
              key={app._id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-4">
                {/* Header labels: Doctor or Patient detail depending on role view */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    {isPatient ? (
                      <>
                        <span className="text-[10px] uppercase font-bold text-primary font-mono">Consultant:</span>
                        <h3 className="font-bold text-slate-200 text-lg">{app.doctor?.user?.name}</h3>
                        <p className="text-xs text-slate-400 font-mono capitalize">{app.doctor?.specialization}</p>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-primary font-mono">Patient:</span>
                        <h3 className="font-bold text-slate-200 text-lg">{app.patient?.user?.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">Phone: {app.patient?.phone}</p>
                      </>
                    )}
                    <span className="inline-block bg-slate-950 border border-slate-800 rounded-full px-2.5 py-0.5 text-xs text-slate-400 font-medium mt-1">
                      {app.department?.name}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md border ${
                    app.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    app.status === 'approved' ? 'bg-primary/10 border-primary/20 text-primary' :
                    app.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {app.status}
                  </span>
                </div>

                {/* Schedule info */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-800/60 py-3 font-mono">
                  <div>
                    <span className="text-slate-500 block">Scheduled Date:</span>
                    <strong className="text-slate-300">{formatDate(app.date)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Time Slot:</span>
                    <strong className="text-slate-300">{app.timeSlot}</strong>
                  </div>
                </div>

                {/* Reason block */}
                <div>
                  <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase tracking-wider">Symptoms / Reason:</span>
                  <p className="text-sm text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                    {app.reason}
                  </p>
                </div>
              </div>

              {/* Context Actions */}
              <div className="flex gap-2 mt-6 border-t border-slate-800/40 pt-4">
                
                {/* Approve Button (Visible to Doctors and Staff when Pending) */}
                {app.status === 'pending' && (isDoctor || isStaff) && (
                  <button
                    onClick={() => handleStatusUpdate(app._id, 'approved')}
                    className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 active:bg-primary/10 text-primary rounded-xl text-xs font-semibold border border-primary/20 transition"
                  >
                    Approve Booking
                  </button>
                )}

                {/* Complete Button (Visible to Doctors and Staff when Approved) */}
                {app.status === 'approved' && (isDoctor || isStaff) && (
                  <button
                    onClick={() => handleStatusUpdate(app._id, 'completed')}
                    className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/20 transition"
                  >
                    Mark Completed
                  </button>
                )}

                {/* Cancel Button (Visible to Patients, Staff when Pending/Approved) */}
                {(app.status === 'pending' || app.status === 'approved') && (isPatient || isStaff) && (
                  <button
                    onClick={() => handleStatusUpdate(app._id, 'cancelled')}
                    className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20 transition"
                  >
                    Cancel Booking
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentList;
