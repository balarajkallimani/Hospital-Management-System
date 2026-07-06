import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id; // True if an ID was passed in the URL (Edit mode)

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      bloodGroup: 'A+',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    }
  });

  // If in Edit Mode, fetch current patient details to pre-populate form
  useEffect(() => {
    if (isEditMode) {
      const fetchPatient = async () => {
        try {
          const response = await axios.get(`/api/patients/${id}`);
          if (response.data && response.data.success) {
            const p = response.data.patient;
            
            // Format date of birth to YYYY-MM-DD for HTML input field
            const formattedDob = p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : '';

            // Reset form values with the fetched data
            reset({
              name: p.user?.name || '',
              email: p.user?.email || '',
              phone: p.phone || '',
              dateOfBirth: formattedDob,
              gender: p.gender || 'male',
              bloodGroup: p.bloodGroup || 'A+',
              address: p.address || '',
              emergencyContact: {
                name: p.emergencyContact?.name || '',
                phone: p.emergencyContact?.phone || '',
                relation: p.emergencyContact?.relation || ''
              }
            });

            // Set profile photo URL
            setImageUrl(p.image || '');
          }
        } catch (err) {
          setApiError(err.response?.data?.message || 'Failed to load patient data.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchPatient();
    }
  }, [id, isEditMode, reset]);

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

    try {
      if (isEditMode) {
        // Send PUT request to update profile
        const response = await axios.put(`/api/patients/${id}`, {
          name: data.name,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          address: data.address,
          emergencyContact: data.emergencyContact,
          image: imageUrl || undefined
        });

        if (response.data && response.data.success) {
          navigate('/patients');
        }
      } else {
        // Send POST request to create new patient
        const response = await axios.post('/api/patients', {
          ...data,
          image: imageUrl || undefined
        });

        if (response.data && response.data.success) {
          navigate('/patients');
        }
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to save patient. Please check details.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-slate-400 font-mono">Loading patient profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">{isEditMode ? 'Edit Patient Profile' : 'Register New Patient'}</h2>
          <p className="text-sm text-slate-400 mt-1">
            {isEditMode ? 'Update existing demographic and medical parameters.' : 'Create login credentials and medical file.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/patients')}
          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/50 transition"
        >
          Cancel
        </button>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Patient Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        
        {/* Photo Upload Widget */}
        <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-950/20 border border-slate-850 rounded-2xl p-4">
          <div className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500">
            {imageUrl ? (
              <img src={imageUrl} alt="Patient preview" className="w-full h-full object-cover" />
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
            <h4 className="text-sm font-semibold text-slate-200">Patient Profile Photo</h4>
            <p className="text-xs text-slate-400">Upload a recent photo. Max size 2MB (JPG, PNG).</p>
            <div className="inline-block relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="patient-photo-upload"
              />
              <label
                htmlFor="patient-photo-upload"
                className="py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded-lg border border-slate-850 cursor-pointer transition block"
              >
                {uploadingImage ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          </div>
        </div>

        {/* Section 1: Credentials */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">1. Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                {...register('name', { required: 'Patient name is required' })}
                className={`w-full bg-slate-950 border ${errors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled={isEditMode} // Cannot edit login email once registered (standard safety check)
                placeholder="patient@hospital.com"
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Temporary Login Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { 
                    required: 'Password is required for registration',
                    minLength: { value: 6, message: 'Password must be at least 6 characters long' }
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">2. Demographic & Medical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Phone</label>
              <input
                type="text"
                placeholder="555-555-5555"
                {...register('phone', { required: 'Contact phone is required' })}
                className={`w-full bg-slate-950 border ${errors.phone ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.phone && <p className="text-rose-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                className={`w-full bg-slate-950 border ${errors.dateOfBirth ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100`}
              />
              {errors.dateOfBirth && <p className="text-rose-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
            </div>

            {/* Gender Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender</label>
              <div className="relative">
                <select
                  {...register('gender', { required: 'Gender is required' })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Blood Group Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Blood Group</label>
              <div className="relative">
                <select
                  {...register('bloodGroup', { required: 'Blood group is required' })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 appearance-none cursor-pointer"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Residential Address</label>
              <textarea
                rows={2}
                placeholder="Street address, City, ZIP code"
                {...register('address')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700 resize-none"
              />
            </div>

          </div>
        </div>

        {/* Section 3: Emergency Contacts */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary border-b border-slate-800 pb-2 mb-4">3. Emergency Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Contact Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
                className={`w-full bg-slate-950 border ${errors.emergencyContact?.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.emergencyContact?.name && <p className="text-rose-400 text-xs mt-1">{errors.emergencyContact.name.message}</p>}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Contact Phone</label>
              <input
                type="text"
                placeholder="555-555-5555"
                {...register('emergencyContact.phone', { required: 'Emergency contact phone is required' })}
                className={`w-full bg-slate-950 border ${errors.emergencyContact?.phone ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.emergencyContact?.phone && <p className="text-rose-400 text-xs mt-1">{errors.emergencyContact.phone.message}</p>}
            </div>

            {/* Contact Relationship */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Relationship</label>
              <input
                type="text"
                placeholder="spouse, parent, friend"
                {...register('emergencyContact.relation', { required: 'Relationship is required' })}
                className={`w-full bg-slate-950 border ${errors.emergencyContact?.relation ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-2.5 px-4 outline-none text-sm transition text-slate-100 placeholder-slate-700`}
              />
              {errors.emergencyContact?.relation && <p className="text-rose-400 text-xs mt-1">{errors.emergencyContact.relation.message}</p>}
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
              Saving Profile...
            </>
          ) : isEditMode ? 'Update Patient' : 'Register Patient'}
        </button>

      </form>
    </div>
  );
}

export default PatientForm;
