import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function MedicalRecordList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patient') || '';

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(queryPatientId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  // 1. Initial loads based on role
  useEffect(() => {
    if (isPatient) {
      // Patients load their own records directly
      fetchPatientRecords();
    } else {
      // Staff & Doctors need to load the patients directory for the selector dropdown
      fetchPatients();
      setLoading(false);
    }
  }, [isPatient]);

  // Sync selected patient ID from URL query parameters
  useEffect(() => {
    if (queryPatientId) {
      setSelectedPatientId(queryPatientId);
    }
  }, [queryPatientId]);

  // 2. Load timeline when doctor/staff selects a patient
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientRecords(selectedPatientId);
    } else if (!isPatient) {
      setRecords([]);
    }
  }, [selectedPatientId, isPatient]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients', { params: { limit: 100 } });
      if (response.data && response.data.success) {
        setPatients(response.data.patients);
      }
    } catch (err) {
      console.error('Failed to load patients list', err);
    }
  };

  const fetchPatientRecords = async (patientId = '') => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/medical-records';
      if (patientId) {
        url = `/api/medical-records/patient/${patientId}`;
      }
      const response = await axios.get(url);
      if (response.data && response.data.success) {
        // Timeline displays records (backend sorted reverse chronological)
        setRecords(response.data.history || response.data.medicalRecords || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load medical history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Clinical Medical History</h2>
          <p className="text-sm text-slate-400 mt-1">Review diagnostic records, symptoms logs, and active prescriptions.</p>
        </div>
        {/* Doctors can add clinical files, but only if they have selected a patient */}
        {isDoctor && selectedPatientId && (
          <Link
            to={`/medical-records/new?patient=${selectedPatientId}`}
            className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Create Diagnosis file
          </Link>
        )}
      </div>

      {/* Patients selector toolbar (For Clinicians & Staff) */}
      {!isPatient && (
        <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 items-center">
          <label className="text-sm font-semibold text-slate-300 sm:w-auto w-full shrink-0">Search Patient Record:</label>
          <div className="relative w-full sm:w-80">
            <select
              value={selectedPatientId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPatientId(val);
                if (val) {
                  setSearchParams({ patient: val });
                } else {
                  setSearchParams({});
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 pl-4 pr-10 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
            >
              <option value="">-- Choose Patient File --</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.user?.name} ({p.user?.email})
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
      )}

      {/* Error display */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* History Timeline layout */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-mono">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-3"></div>
          Fetching diagnostic files...
        </div>
      ) : !isPatient && !selectedPatientId ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-medium">
          Please select a patient file from the search bar to inspect their medical timeline.
        </div>
      ) : records.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No diagnostic files recorded for this patient.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 pl-6 ml-4 space-y-8">
          {records.map((rec) => (
            <div key={rec._id} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-700/60 transition">
              
              {/* Chronological dot indicator */}
              <div className="absolute -left-[33px] top-6 bg-primary border-4 border-slate-950 rounded-full h-4 w-4"></div>

              <div className="space-y-4">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-lg">{rec.diagnosis}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Diagnosed on: {formatDate(rec.date)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block font-mono">Attending Clinician:</span>
                    <strong className="text-sm text-primary capitalize font-medium">{rec.doctor?.user?.name}</strong>
                    <span className="text-[10px] text-slate-500 block capitalize font-mono">({rec.doctor?.department?.name})</span>
                  </div>
                </div>

                {/* Symptoms block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Symptoms Logged:</span>
                    <p className="text-sm text-slate-300 italic">"{rec.symptoms}"</p>
                  </div>
                  {rec.notes && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono block mb-1">Clinician Advise & Notes:</span>
                      <p className="text-sm text-slate-400">{rec.notes}</p>
                    </div>
                  )}
                </div>

                {/* Prescribed Medications */}
                {rec.prescription && rec.prescription.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-primary font-mono block mb-3">Prescribed Medications:</span>
                    <div className="overflow-x-auto rounded-xl border border-slate-800/80 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950/60 text-slate-500 font-semibold uppercase border-b border-slate-800/80">
                            <th className="py-2.5 px-4">Medicine Name</th>
                            <th className="py-2.5 px-4">Dosage Frequency</th>
                            <th className="py-2.5 px-4">Treatment Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                          {rec.prescription.map((med, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2.5 px-4 font-semibold text-slate-200">{med.medicine}</td>
                              <td className="py-2.5 px-4 text-slate-400">{med.dosage}</td>
                              <td className="py-2.5 px-4 text-slate-400">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicalRecordList;
