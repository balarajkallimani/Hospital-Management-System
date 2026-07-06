import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BillingForm() {
  const navigate = useNavigate();

  // Dropdown options
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [status, setStatus] = useState('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('pending');

  // Dynamic services list: [ { serviceName: '', cost: '' } ]
  const [servicesList, setServicesList] = useState([
    { serviceName: '', cost: '' }
  ]);

  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch patients and doctors on mount
  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

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

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors');
      if (response.data && response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors', err);
    }
  };

  // 2. Doctor selection fee auto-seeding
  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    if (!docId) {
      // Clear first row if doctor cleared
      const updated = [...servicesList];
      if (updated[0] && updated[0].serviceName.startsWith('Consultation Fee')) {
        updated[0] = { serviceName: '', cost: '' };
        setServicesList(updated);
      }
      return;
    }

    const doctorObj = doctors.find((d) => d._id === docId);
    if (doctorObj) {
      const updated = [...servicesList];
      const consultItem = {
        serviceName: `Consultation Fee (${doctorObj.user?.name})`,
        cost: doctorObj.fees
      };

      // Auto-insert consultation details at the first row
      if (updated[0] && (!updated[0].serviceName || updated[0].serviceName.startsWith('Consultation Fee'))) {
        updated[0] = consultItem;
      } else {
        updated.unshift(consultItem);
      }
      setServicesList(updated);
    }
  };

  // Add a blank service row
  const addServiceRow = () => {
    setServicesList([...servicesList, { serviceName: '', cost: '' }]);
  };

  // Remove service row
  const removeServiceRow = (index) => {
    if (servicesList.length === 1) {
      setServicesList([{ serviceName: '', cost: '' }]);
      return;
    }
    const updated = servicesList.filter((_, idx) => idx !== index);
    setServicesList(updated);
  };

  // Bind input changes
  const handleServiceChange = (index, field, value) => {
    const updated = [...servicesList];
    updated[index][field] = value;
    setServicesList(updated);
  };

  // Enforce pending payment method if unpaid
  const handleStatusChange = (val) => {
    setStatus(val);
    if (val === 'unpaid') {
      setPaymentMethod('pending');
    } else {
      setPaymentMethod('cash');
    }
  };

  // Compute live total amount
  const liveTotal = servicesList.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    if (!selectedPatientId) {
      setApiError('Please select a patient file.');
      setIsSubmitting(false);
      return;
    }

    // Filter out completely blank service items
    const filteredServices = servicesList.filter(
      (s) => s.serviceName.trim() && s.cost !== '' && !isNaN(Number(s.cost))
    );

    if (filteredServices.length === 0) {
      setApiError('Please provide at least one valid service charge.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      patient: selectedPatientId,
      doctor: selectedDoctorId || undefined,
      services: filteredServices,
      status,
      paymentMethod
    };

    try {
      const response = await axios.post('/api/billing', payload);
      if (response.data && response.data.success) {
        navigate('/billing');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to generate invoice.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Issue Patient Invoice</h2>
          <p className="text-sm text-slate-400 mt-1">Record consultation charges, laboratory tests, and scan fees.</p>
        </div>
        <button
          onClick={() => navigate('/billing')}
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
        
        {/* Patient Selection Dropdown */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 font-semibold">Select Patient File</label>
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
        </div>

        {/* Doctor Selection (For consultation fee auto-seeding) */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Attending Consultant Doctor (Optional)</label>
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
            >
              <option value="">-- Choose Consultant (Auto-populates Fee) --</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.user?.name} ({d.specialization}) - Fee: ${d.fees}
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

        {/* Dynamic Service Items compiler */}
        <div className="border-t border-slate-800/60 pt-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-primary">Invoiced Service Line Items</label>
            <button
              type="button"
              onClick={addServiceRow}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
            >
              + Add Billing Item
            </button>
          </div>

          <div className="space-y-3">
            {servicesList.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/20 border border-slate-800/80 rounded-xl p-3 items-center">
                
                {/* Service Name */}
                <div className="md:col-span-8">
                  <input
                    type="text"
                    value={item.serviceName}
                    onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                    placeholder="Service Description (e.g. Chest X-Ray, Blood Panel)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-2 px-3 outline-none text-xs text-slate-100 placeholder-slate-700"
                  />
                </div>

                {/* Service Cost */}
                <div className="md:col-span-3">
                  <input
                    type="number"
                    min={0}
                    value={item.cost}
                    onChange={(e) => handleServiceChange(index, 'cost', e.target.value)}
                    placeholder="Cost ($)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-lg py-2 px-3 outline-none text-xs text-slate-100 placeholder-slate-700 font-mono"
                  />
                </div>

                {/* Remove button */}
                <div className="md:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeServiceRow(index)}
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

        {/* Live Total Box */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center text-sm font-mono font-bold text-slate-200">
          <span>Live Total Amount Due:</span>
          <span className="text-primary text-base">${liveTotal}</span>
        </div>

        {/* Status and Payment Method Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/60 pt-6">
          
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
              >
                <option value="unpaid">Unpaid (Add to Tab)</option>
                <option value="paid">Paid (Collect Now)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={status === 'unpaid'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary disabled:opacity-50 rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
              >
                {status === 'unpaid' ? (
                  <option value="pending">Pending</option>
                ) : (
                  <>
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="insurance">Insurance Claim</option>
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Submit */}
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
              Issuing Invoice...
            </>
          ) : 'Issue Patient Invoice'}
        </button>

      </form>
    </div>
  );
}

export default BillingForm;
