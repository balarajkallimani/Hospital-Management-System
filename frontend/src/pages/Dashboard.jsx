import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import ReceptionistDashboard from './dashboards/ReceptionistDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

function Dashboard() {
  const { user } = useAuth();

  // Dynamic Dispatcher: Renders the correct workspace panel based on user role
  const renderRoleDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'receptionist':
        return <ReceptionistDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic header greeting card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Logged in as: <span className="text-primary font-mono capitalize">{user?.role}</span>
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400 font-mono">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Render the role-specific workspace */}
      {renderRoleDashboard()}
    </div>
  );
}

export default Dashboard;
