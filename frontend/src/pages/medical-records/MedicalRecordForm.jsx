import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function MedicalRecordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  // Dynamic Prescription List state
  const [prescriptionList, setPrescriptionList] = useState([
    { medicine: '', dosage: '', duration: '' } // Starts with one empty row
  ]);

  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(!!preselectedPatientId);
  const [preselectedPatientName, setPreselectedPatientName] = useState('');

  // 1. Fetch patient list or preselected patient details on mount
  useEffect(() => {
    if (preselectedPatientId) {
      fetchPreselectedPatient(preselectedPatientId);
    } else {
      fetchPatients();
    }
  }, [preselectedPatientId]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients', { params: { limit: 100 } });
      if (response.data && response.data.success) {
        setPatients(response.data.patients);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  const fetchPreselectedPatient = async (id) => {
    try {
      const response = await axios.get(`/api/patients/${id}`);
      if (response.data && response.data.success) {
        setPreselectedPatientName(response.data.patient.user?.name);
      }
    } catch (err) {
      console.error('Failed to load patient name', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  // Add a new blank medicine row
  const addMedicineRow = () => {
    setPrescriptionList([...prescriptionList, { medicine: '', dosage: '', duration: '' }]);
  };

  // Remove a medicine row at specific index
  const removeMedicineRow = (index) => {
    if (prescriptionList.length === 1) {
      // Keep at least one row, just clear it
      setPrescriptionList([{ medicine: '', dosage: '', duration: '' }]);
      return;
    }
    const updated = prescriptionList.filter((_, idx) => idx !== index);
    setPrescriptionList(updated);
  };

  // Handle changes inside prescription row inputs
  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...prescriptionList];
    updated[index][field] = value;
    setPrescriptionList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    if (!selectedPatientId) {
      setApiError('Please select a patient file.');
      setIsSubmitting(false);
      return;
    }

    if (!symptoms.trim() || !diagnosis.trim()) {
      setApiError('Symptoms and Diagnosis are required fields.');
      setIsSubmitting(false);
      return;
    }

    // Filter out completely blank prescription rows before sending to backend
    const filteredPrescriptions = prescriptionList.filter(
      (med) => med.medicine.trim() && med.dosage.trim() && med.duration.trim()
    );

    const payload = {
      patient: selectedPatientId,
      symptoms,
      diagnosis,
      prescription: filteredPrescriptions,
      notes
    };

    try {
      const response = await axios.post('/api/medical-records', payload);
      if (response.data && response.data.success) {
        // Redirect back to timeline listings page preselected with the patient
        navigate(`/medical-records?patient=${selectedPatientId}`);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to submit medical record.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingPatient) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-slate-400 font-mono">Resolving patient file...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Clinical Encounter Log</h2>
          <p className="text-sm text-slate-400 mt-1">Compile diagnostics, clinical notes, and prescription dosage lists.</p>
        </div>
        <button
          onClick={() => navigate(selectedPatientId ? `/medical-records?patient=${selectedPatientId}` : '/medical-records')}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/50 transition"
        >
          Cancel
        </button>
      </div>

      {/* Error alert banner */}
      {apiError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Form Log */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        
        {/* Patient Picker Context */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">For Patient Profile</label>
          {preselectedPatientId ? (
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-semibold text-primary font-mono capitalize">
              {preselectedPatientName || 'Loading Patient...'} (ID locked)
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Diagnosis Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Medical Diagnosis / Assessment</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Gastritis, Hypertension Grade II"
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700"
            />
          </div>

          {/* Symptoms Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Symptoms Logged</label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Record patient complaints, onset dates, and severity..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700 resize-none"
            />
          </div>

          {/* Clinician Advice Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">General Advice & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Advised bed rest, hydration instructions, or follow-up timelines..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700 resize-none"
            />
          </div>
        </div>

        {/* Dynamic Prescription compiler */}
        <div className="border-t border-slate-800/60 pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-primary">Medication Prescriptions</label>
            <button
              type="button"
              onClick={addMedicineRow}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              + Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {prescriptionList.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/20 border border-slate-800/80 rounded-xl p-3 items-center">
                
                {/* Medicine Name */}
                <div className="md:col-span-5">
                  <input
                    type="text"
                    value={item.medicine}
                    onChange={(e) => handlePrescriptionChange(index, 'medicine', e.target.value)}
                    placeholder="Medicine (e.g. Paracetamol 500mg)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-2 px-3 outline-none text-xs text-slate-100 placeholder-slate-700"
                  />
                </div>

                {/* Dosage */}
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                    placeholder="Dosage (e.g. 1-0-1)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-2 px-3 outline-none text-xs text-slate-100 placeholder-slate-700"
                  />
                </div>

                {/* Duration */}
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={item.duration}
                    onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 5 Days)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-2 px-3 outline-none text-xs text-slate-100 placeholder-slate-700"
                  />
                </div>

                {/* Remove button */}
                <div className="md:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(index)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition inline-block"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark active:bg-primary-dark/80 disabled:opacity-50 text-white font-semibold rounded-xl transition duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Record...
            </>
          ) : 'Save Encounter & Prescription'}
        </button>

      </form>
    </div>
  );
}

export default MedicalRecordForm;
