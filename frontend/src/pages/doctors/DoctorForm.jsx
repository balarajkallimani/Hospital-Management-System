import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

function DoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [departments, setDepartments] = useState([]);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Maintain availability schedule: { 'Monday': ['09:00 AM', '10:00 AM'], ... }
  const [schedule, setSchedule] = useState({});

  // Image Upload state variables
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department: '',
      specialization: '',
      qualification: '',
      experience: 1,
      fees: 100
    }
  });

  // Fetch departments and existing doctor details on mount
  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Fetch departments list
        const deptResponse = await axios.get('/api/departments');
        if (deptResponse.data && deptResponse.data.success) {
          setDepartments(deptResponse.data.departments);
        }

        // 2. Fetch doctor profile if editing
        if (isEditMode) {
          const docResponse = await axios.get(`/api/doctors/${id}`);
          if (docResponse.data && docResponse.data.success) {
            const doc = docResponse.data.doctor;
            
            // Populate hook form text inputs
            reset({
              name: doc.user?.name || '',
              email: doc.user?.email || '',
              department: doc.department?._id || doc.department || '',
              specialization: doc.specialization || '',
              qualification: doc.qualification || '',
              experience: doc.experience || 1,
              fees: doc.fees || 100
            });

            // Set profile image url
            setImageUrl(doc.image || '');

            // Convert backend availability array back into helper schedule map
            const initialSchedule = {};
            if (doc.availability) {
              doc.availability.forEach((item) => {
                initialSchedule[item.day] = item.slots;
              });
            }
            setSchedule(initialSchedule);
          }
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Failed to initialize form.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditMode, reset]);

  // Toggles the selection of a slot for a particular day
  const toggleSlot = (day, slot) => {
    setSchedule((prev) => {
      const daySlots = prev[day] ? [...prev[day]] : [];
      if (daySlots.includes(slot)) {
        // Remove slot
        const updated = daySlots.filter((s) => s !== slot);
        return { ...prev, [day]: updated };
      } else {
        // Add slot
        daySlots.push(slot);
        return { ...prev, [day]: daySlots };
      }
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    setApiError('');
    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data && response.data.success) {
        setImageUrl(response.data.filePath);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to upload photo.');
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');

    // Transform schedule map into backend array structure: [{ day, slots }]
    const availabilityArray = [];
    DAYS_OF_WEEK.forEach((day) => {
      if (schedule[day] && schedule[day].length > 0) {
        availabilityArray.push({
          day,
          slots: schedule[day]
        });
      }
    });

    const payload = {
      ...data,
      availability: availabilityArray,
      image: imageUrl || undefined
    };

    try {
      if (isEditMode) {
        // Send PUT to update doctor profile details
        const response = await axios.put(`/api/doctors/${id}`, {
          name: payload.name,
          department: payload.department,
          specialization: payload.specialization,
          qualification: payload.qualification,
          experience: Number(payload.experience),
          fees: Number(payload.fees),
          availability: payload.availability,
          image: imageUrl || undefined
        });
        if (response.data && response.data.success) {
          navigate('/doctors');
        }
      } else {
        // Send POST to create new doctor
        const response = await axios.post('/api/doctors', payload);
        if (response.data && response.data.success) {
          navigate('/doctors');
        }
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save doctor details. Check inputs.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-slate-400 font-mono">Loading practitioner details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{isEditMode ? 'Edit Doctor Profile' : 'Register New Practitioner'}</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isEditMode ? 'Modify department listings, consultation fees, and weekly schedule.' : 'Register login credentials and clinician schedule.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/doctors')}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/50 transition"
        >
          Cancel
        </button>
      </div>

      {/* Error Alert Box */}
      {apiError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Doctor Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl">
        
        {/* Photo Upload Widget */}
        <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-950/20 border border-slate-850 rounded-2xl p-4">
          <div className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500">
            {imageUrl ? (
              <img src={imageUrl} alt="Doctor headshot" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            {uploadingImage && (
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-primary"></div>
              </div>
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-slate-200">Practitioner Profile Photo</h4>
            <p className="text-xs text-slate-400">Upload a professional headshot. Max size 2MB (JPG, PNG).</p>
            <div className="inline-block relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="doctor-photo-upload"
              />
              <label
                htmlFor="doctor-photo-upload"
                className="py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded-lg border border-slate-850 cursor-pointer transition block"
              >
                {uploadingImage ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          </div>
        </div>

        {/* Section 1: Credentials */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">1. Clinician Login Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name (with Dr. prefix)</label>
              <input
                type="text"
                placeholder="Dr. Gregory House"
                {...register('name', { required: 'Doctor name is required' })}
                className={`w-full bg-slate-950 border ${errors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Hospital Email Address</label>
              <input
                type="email"
                disabled={isEditMode}
                placeholder="greg.house@hospital.com"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full bg-slate-950 border ${errors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} disabled:opacity-50 rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.email && <p className="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password (CREATE mode only) */}
            {!isEditMode && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Default Login Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Temporary password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`w-full bg-slate-950 border ${errors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
                />
                {errors.password && <p className="text-rose-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}

          </div>
        </div>

        {/* Section 2: Clinical Details */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">2. Clinical Specializations & Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Department Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Assigned Department</label>
              <div className="relative">
                <select
                  {...register('department', { required: 'Department is required' })}
                  className={`w-full bg-slate-950 border ${errors.department ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer`}
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
              {errors.department && <p className="text-rose-400 text-xs mt-1">{errors.department.message}</p>}
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Specialization Area</label>
              <input
                type="text"
                placeholder="Cardio-Thoracic Surgery"
                {...register('specialization', { required: 'Specialization is required' })}
                className={`w-full bg-slate-950 border ${errors.specialization ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.specialization && <p className="text-rose-400 text-xs mt-1">{errors.specialization.message}</p>}
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Clinician Qualifications</label>
              <input
                type="text"
                placeholder="MD, MBBS, FACS"
                {...register('qualification', { required: 'Qualification is required' })}
                className={`w-full bg-slate-950 border ${errors.qualification ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.qualification && <p className="text-rose-400 text-xs mt-1">{errors.qualification.message}</p>}
            </div>

            {/* Experience (Years) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Years of Experience</label>
              <input
                type="number"
                min={0}
                placeholder="5"
                {...register('experience', { 
                  required: 'Experience years required',
                  valueAsNumber: true
                })}
                className={`w-full bg-slate-950 border ${errors.experience ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100`}
              />
              {errors.experience && <p className="text-rose-400 text-xs mt-1">{errors.experience.message}</p>}
            </div>

            {/* Consultation Fees */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Consultation Fees ($)</label>
              <input
                type="number"
                min={0}
                placeholder="150"
                {...register('fees', { 
                  required: 'Consultation fees required',
                  valueAsNumber: true
                })}
                className={`w-full bg-slate-950 border ${errors.fees ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100`}
              />
              {errors.fees && <p className="text-rose-400 text-xs mt-1">{errors.fees.message}</p>}
            </div>

          </div>
        </div>

        {/* Section 3: Availability Grid Scheduling */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">3. Availability Scheduling Editor</h3>
          <p className="text-xs text-slate-500 mb-6">Select the days and active time blocks the doctor is available for consultations.</p>
          
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const activeSlots = schedule[day] || [];
              const isDayActive = activeSlots.length > 0;

              return (
                <div key={day} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Day Check indicator */}
                  <div className="w-32 shrink-0 flex items-center gap-2.5">
                    <div 
                      className={`h-2.5 w-2.5 rounded-full ${isDayActive ? 'bg-primary animate-pulse' : 'bg-slate-700'}`}
                    />
                    <span className={`text-sm font-semibold ${isDayActive ? 'text-slate-200' : 'text-slate-500'}`}>
                      {day}
                    </span>
                  </div>

                  {/* Hourly Time Slots Selectors */}
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = activeSlots.includes(slot);
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => toggleSlot(day, slot)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold font-mono transition border ${
                            isSelected
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
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
              Saving Profile...
            </>
          ) : isEditMode ? 'Update Doctor Profile' : 'Register Doctor Profile'}
        </button>

      </form>
    </div>
  );
}

export default DoctorForm;
