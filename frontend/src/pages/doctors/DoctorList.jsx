import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function DoctorList() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  // Fetch departments and doctors on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Re-fetch doctors whenever department filter changes
  useEffect(() => {
    fetchDoctors();
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      if (response.data && response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedDept) {
        params.department = selectedDept;
      }
      const response = await axios.get('/api/doctors', { params });
      if (response.data && response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to permanently delete this doctor and their login credentials?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/doctors/${doctorId}`);
      if (response.data && response.data.success) {
        fetchDoctors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete doctor.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Medical Practitioners Directory</h2>
          <p className="text-sm text-slate-400 mt-1">View active clinical doctors, availability schedules, and consultation fees.</p>
        </div>
        {isAdmin && (
          <Link
            to="/doctors/new"
            className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Register New Doctor
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center">
        <label className="text-sm font-semibold text-slate-300 sm:w-auto w-full shrink-0">Filter by Department:</label>
        <div className="relative w-full sm:w-72">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 pl-4 pr-10 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
          >
            <option value="">-- All Departments --</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Doctor Directory Grid Layout */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-3"></div>
          Fetching doctor profiles...
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No medical practitioners match this selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc._id} className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg relative group overflow-hidden">
              <div className="space-y-4">
                {/* Doctor Head details */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg group-hover:text-primary transition">{doc.user?.name}</h3>
                    <p className="text-xs font-semibold text-slate-400 capitalize">{doc.qualification}</p>
                    <span className="inline-block bg-slate-950 border border-slate-800 rounded-full px-2.5 py-0.5 text-xs text-primary font-medium mt-1.5">
                      {doc.department?.name}
                    </span>
                  </div>
                </div>

                {/* Specifics */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-800/60 py-3 font-mono">
                  <div>
                    <span className="text-slate-500 block">Experience:</span>
                    <strong className="text-slate-300">{doc.experience} Years</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Consultation:</span>
                    <strong className="text-slate-300">${doc.fees}</strong>
                  </div>
                </div>

                {/* Schedule Days */}
                <div>
                  <span className="text-xs text-slate-500 block mb-2 font-semibold uppercase tracking-wider">Weekly Schedule:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.availability?.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No slots scheduled</span>
                    ) : (
                      doc.availability.map((sched, idx) => (
                        <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-1 rounded-md">
                          {sched.day}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Admins */}
              {isAdmin && (
                <div className="flex gap-2 mt-6 border-t border-slate-800/40 pt-4">
                  <Link
                    to={`/doctors/edit/${doc._id}`}
                    className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/50 transition"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorList;
