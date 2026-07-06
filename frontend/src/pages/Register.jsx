import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register: registerAuthUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'patient'
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const result = await registerAuthUser(data.name, data.email, data.password, data.role);
      
      if (result.success) {
        // Redirect to dashboard upon successful signup
        navigate('/dashboard');
      } else {
        setApiError(result.message);
      }
    } catch (err) {
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      {/* Registration Card */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 md:p-10">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 text-primary rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-sm mt-2">Join the Hospital Management System</p>
        </div>

        {/* Backend Error Alert */}
        {apiError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm mb-6 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              {...register('name', { 
                required: 'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters long' }
              })}
              className={`w-full bg-slate-950 border ${errors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-3 px-4 outline-none transition duration-150 text-slate-100 placeholder-slate-600`}
            />
            {errors.name && <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="name@hospital.com"
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                  message: 'Please enter a valid email address'
                }
              })}
              className={`w-full bg-slate-950 border ${errors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-3 px-4 outline-none transition duration-150 text-slate-100 placeholder-slate-600`}
            />
            {errors.email && <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters long' }
              })}
              className={`w-full bg-slate-950 border ${errors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-primary'} rounded-xl py-3 px-4 outline-none transition duration-150 text-slate-100 placeholder-slate-600`}
            />
            {errors.password && <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          {/* User Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Account Role</label>
            <div className="relative">
              <select
                {...register('role', { required: 'Please select a role' })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-primary rounded-xl py-3 px-4 outline-none transition duration-150 text-slate-100 appearance-none cursor-pointer"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            {errors.role && <p className="text-rose-400 text-xs mt-1.5 font-medium">{errors.role.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark active:bg-primary-dark/80 disabled:opacity-50 text-white font-semibold rounded-xl transition duration-150 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : 'Sign Up'}
          </button>
        </form>

        {/* Page Switcher Link */}
        <div className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-medium transition">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;
