import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function AppointmentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  // Dropdown states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  // Form selections
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [reason, setReason] = useState('');

  // Scheduling states
  const [availableSlots, setAvailableSlots] = useState([]);
  const [scheduleStatusMessage, setScheduleStatusMessage] = useState('Please select a doctor and date to view available time slots.');

  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch departments and patients on mount
  useEffect(() => {
    fetchDepartments();
    if (isStaff) {
      fetchPatients();
    }
  }, [isStaff]);

  // 2. Fetch doctors when department changes
  useEffect(() => {
    if (selectedDept) {
      fetchDoctorsInDept(selectedDept);
      setSelectedDocId('');
      setAvailableSlots([]);
    } else {
      setDoctors([]);
    }
  }, [selectedDept]);

  // 3. Recalculate slots when doctor or date changes
  useEffect(() => {
    calculateAvailableSlots();
  }, [selectedDocId, selectedDate]);

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

  const fetchDoctorsInDept = async (deptId) => {
    try {
      const response = await axios.get('/api/doctors', { params: { department: deptId } });
      if (response.data && response.data.success) {
        setDoctors(response.data.doctors);
      }
    } catch (err) {
      console.error('Failed to load doctors list', err);
    }
  };

  const calculateAvailableSlots = () => {
    if (!selectedDocId || !selectedDate) {
      setAvailableSlots([]);
      setScheduleStatusMessage('Please select a doctor and date to view available time slots.');
      return;
    }

    const doctorObj = doctors.find((doc) => doc._id === selectedDocId);
    if (!doctorObj) return;

    // Resolve day of the week from selected date string
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateParts = selectedDate.split('-'); // ['YYYY', 'MM', 'DD']
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = daysOfWeek[dateObj.getDay()];

    // Find doctor schedule for this day
    const daySchedule = doctorObj.availability?.find((a) => a.day === dayName);

    if (!daySchedule || daySchedule.slots.length === 0) {
      setAvailableSlots([]);
      setScheduleStatusMessage(`Doctor is not available on ${dayName}s. Please choose another date.`);
    } else {
      setAvailableSlots(daySchedule.slots);
      setSelectedTimeSlot(''); // Reset selection
      setScheduleStatusMessage('');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);

    // Validate inputs
    if (isStaff && !selectedPatient) {
      setApiError('Please select a patient.');
      setIsSubmitting(false);
      return;
    }
    if (!selectedDocId || !selectedDept || !selectedDate || !selectedTimeSlot || !reason) {
      setApiError('Please fill out all required details.');
      setIsSubmitting(false);
      return;
    }

    const bookingPayload = {
      patient: isStaff ? selectedPatient : undefined, // Enforced self on backend for patients
      doctor: selectedDocId,
      department: selectedDept,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      reason
    };

    try {
      const response = await axios.post('/api/appointments', bookingPayload);
      if (response.data && response.data.success) {
        navigate('/appointments');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to book appointment. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Schedule Consultation</h2>
          <p className="text-sm text-slate-400 mt-1">Select date and matching clinician availability timeslots.</p>
        </div>
        <button
          onClick={() => navigate('/appointments')}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/50 transition"
        >
          Cancel
        </button>
      </div>

      {/* Error alert */}
      {apiError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleBooking} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        
        {/* Patient Selection (Visible to Admins & Receptionists only) */}
        {isStaff && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">For Patient</label>
            <div className="relative">
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
              >
                <option value="">-- Choose Patient Profile --</option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Department Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Medical Division / Department</label>
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
              >
                <option value="">-- Choose Department --</option>
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

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Consultant Doctor</label>
            <div className="relative">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                disabled={!selectedDept}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary disabled:opacity-50 rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
              >
                <option value="">-- Choose Consultant --</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.user?.name} ({doc.specialization}) - ${doc.fees}
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

          {/* Appointment Date Picker */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Scheduled Date</label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]} // Block booking dates in the past
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100"
            />
          </div>

        </div>

        {/* Available slots picker */}
        <div className="border-t border-slate-800/60 pt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-3">Available Hourly Time Slots</label>
          {scheduleStatusMessage ? (
            <p className="text-xs text-slate-500 italic bg-slate-950/30 border border-slate-800/80 rounded-xl p-3">
              {scheduleStatusMessage}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold font-mono border transition ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Symptoms / Reason Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Symptoms / Visit Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe symptoms, medical history details, or consultation request reasons..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700 resize-none"
          />
        </div>

        {/* Submit Booking */}
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
              Saving Booking...
            </>
          ) : 'Book Consultation Slot'}
        </button>

      </form>
    </div>
  );
}

export default AppointmentForm;
