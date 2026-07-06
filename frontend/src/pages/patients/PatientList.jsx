import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [error, setError] = useState('');

  // Allowed to write/edit/delete
  const canModify = user?.role === 'admin' || user?.role === 'receptionist';
  const isAdmin = user?.role === 'admin';

  // Fetch patients when search or page changes
  useEffect(() => {
    fetchPatients();
  }, [search, page]);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch patients from the backend API with pagination parameters
      const response = await axios.get('/api/patients', {
        params: {
          search,
          page,
          limit: 5 // Fetch 5 patients per page for demonstration/verification ease
        }
      });

      if (response.data && response.data.success) {
        setPatients(response.data.patients);
        setTotalPatients(response.data.pagination.total);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm('Are you sure you want to permanently delete this patient and their login account?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/patients/${patientId}`);
      if (response.data && response.data.success) {
        // Reload list and show success
        fetchPatients();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete patient.');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on new searches
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Patient Database</h2>
          <p className="text-sm text-slate-400 mt-1">Manage and view all registered hospital patients.</p>
        </div>
        {canModify && (
          <Link
            to="/patients/new"
            className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Add New Patient
          </Link>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by patient name or email..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-primary rounded-xl py-3.5 pl-11 pr-4 outline-none transition text-slate-100 placeholder-slate-600"
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800/80">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Gender</th>
                <th className="py-4 px-6">Blood Group</th>
                {canModify && <th className="py-4 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={canModify ? 6 : 5} className="py-12 text-center text-slate-500 font-mono">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary mx-auto mb-2"></div>
                    Fetching records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 6 : 5} className="py-12 text-center text-slate-500">
                    No patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-950/30 transition">
                    <td className="py-4 px-6 font-semibold text-slate-200">{p.user?.name}</td>
                    <td className="py-4 px-6 text-slate-400">{p.user?.email}</td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{p.phone}</td>
                    <td className="py-4 px-6 capitalize text-slate-400">{p.gender}</td>
                    <td className="py-4 px-6 font-bold text-primary">{p.bloodGroup}</td>
                    {canModify && (
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          to={`/patients/edit/${p._id}`}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-300 rounded-lg text-xs transition border border-slate-700/40 inline-block"
                        >
                          Edit
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/10 text-rose-400 rounded-lg text-xs transition border border-rose-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="bg-slate-950/20 border-t border-slate-800/80 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <strong className="text-slate-400 font-semibold">{page}</strong> of <strong className="text-slate-400 font-semibold">{totalPages}</strong> ({totalPatients} total records)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-xs transition border border-slate-700/50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-xs transition border border-slate-700/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientList;
