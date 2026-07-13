import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientForm from './pages/patients/PatientForm';
import DoctorList from './pages/doctors/DoctorList';
import DoctorForm from './pages/doctors/DoctorForm';
import AppointmentList from './pages/appointments/AppointmentList';
import AppointmentForm from './pages/appointments/AppointmentForm';
import MedicalRecordList from './pages/medical-records/MedicalRecordList';
import MedicalRecordForm from './pages/medical-records/MedicalRecordForm';
import BillingList from './pages/billing/BillingList';
import BillingForm from './pages/billing/BillingForm';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import AppLayout from './layouts/AppLayout';
import RoleRoute from './components/RoleRoute';

/**
 * A wrapper component that guards private pages.
 * Redirects the user to the login screen if they are not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show a clean loading state while verifying existing token session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-slate-400 font-mono">Resuming session...</p>
      </div>
    );
  }

  // Redirect to Login if the user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected page/layout if authenticated
  return children;
};

/**
 * Public routes wrapper.
 * If a user is already logged in, redirect them away from login/register pages to the dashboard.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    // Wrap entire application inside AuthProvider to distribute auth states
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Pages */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Protected Main Application Layout Routes */}
          {/* AppLayout handles the shared navbar and outlets the sub-pages */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard Workspace */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Patient Database Listings (Authorized for Staff) */}
            <Route 
              path="patients" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor', 'receptionist']}>
                  <PatientList />
                </RoleRoute>
              } 
            />
            
            {/* Patient Creation Form (Authorized for Admins/Receptionists) */}
            <Route 
              path="patients/new" 
              element={
                <RoleRoute allowedRoles={['admin', 'receptionist']}>
                  <PatientForm />
                </RoleRoute>
              } 
            />

            {/* Patient Edit Form (Authorized for Admins/Receptionists/Doctors) */}
            <Route 
              path="patients/edit/:id" 
              element={
                <RoleRoute allowedRoles={['admin', 'receptionist', 'doctor']}>
                  <PatientForm />
                </RoleRoute>
              } 
            />

            {/* Doctor Routes (Directory open to all roles, editing for Admins only) */}
            <Route 
              path="doctors" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                  <DoctorList />
                </RoleRoute>
              } 
            />
            <Route 
              path="doctors/new" 
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <DoctorForm />
                </RoleRoute>
              } 
            />
            <Route 
              path="doctors/edit/:id" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor']}>
                  <DoctorForm />
                </RoleRoute>
              } 
            />

            {/* Appointment Routes */}
            <Route 
              path="appointments" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                  <AppointmentList />
                </RoleRoute>
              } 
            />
            <Route 
              path="appointments/new" 
              element={
                <RoleRoute allowedRoles={['admin', 'receptionist', 'patient']}>
                  <AppointmentForm />
                </RoleRoute>
              } 
            />

            {/* Medical Record Routes */}
            <Route 
              path="medical-records" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                  <MedicalRecordList />
                </RoleRoute>
              } 
            />
            <Route 
              path="medical-records/new" 
              element={
                <RoleRoute allowedRoles={['doctor']}>
                  <MedicalRecordForm />
                </RoleRoute>
              } 
            />

            {/* Billing Routes */}
            <Route 
              path="billing" 
              element={
                <RoleRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']}>
                  <BillingList />
                </RoleRoute>
              } 
            />
            <Route 
              path="billing/new" 
              element={
                <RoleRoute allowedRoles={['admin', 'receptionist']}>
                  <BillingForm />
                </RoleRoute>
              } 
            />

            {/* Reports & Analytics Routes */}
            <Route 
              path="reports" 
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <ReportsDashboard />
                </RoleRoute>
              } 
            />
          </Route>

          {/* Catch-all Route: Redirects any unknown URLs to the Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
