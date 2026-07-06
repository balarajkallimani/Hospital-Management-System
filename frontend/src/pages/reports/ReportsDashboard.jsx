import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ReportsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/reports/stats');
      if (response.data && response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report analytics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format months (e.g. "2026-07" -> "Jul 2026")
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 font-mono">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-3"></div>
        Aggregating hospital database statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm max-w-xl mx-auto">
        {error}
      </div>
    );
  }

  // Extract variables for ease of use
  const {
    totalPatients = 0,
    totalDoctors = 0,
    totalAppointments = 0,
    appointmentsBreakdown = { pending: 0, approved: 0, completed: 0, cancelled: 0 },
    totalRevenue = 0,
    monthlyRevenue = []
  } = stats || {};

  // Compute appointment breakdown ratios for progress bars
  const getPercentage = (value) => {
    if (totalAppointments === 0) return 0;
    return Math.round((value / totalAppointments) * 100);
  };

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 500;
  const maxRevenue = Math.max(...monthlyRevenue.map((r) => r.revenue), 100);

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-100">Hospital Analytics & Reports</h2>
        <p className="text-sm text-slate-400 mt-1">Real-time counts, appointment distributions, and revenue aggregates.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Patients */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Total Patients</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{totalPatients}</h3>
            <span className="text-[10px] text-primary font-mono mt-1 block">Registered in EHR</span>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Total Doctors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Active Clinicians</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{totalDoctors}</h3>
            <span className="text-[10px] text-primary font-mono mt-1 block">Across seeded depts</span>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Appointments Scheduled</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{totalAppointments}</h3>
            <span className="text-[10px] text-primary font-mono mt-1 block">All-time booking slots</span>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Gross Revenue</span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">${totalRevenue}</h3>
            <span className="text-[10px] text-emerald-500 font-mono mt-1 block">Paid invoice totals</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Revenue Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Monthly Revenue Flow</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological summary of collected client payments.</p>
          </div>

          <div className="mt-6 flex justify-center items-center">
            {monthlyRevenue.length === 0 ? (
              <div className="py-12 text-slate-500 text-sm">No revenue data available to chart.</div>
            ) : (
              <div className="w-full relative overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} 200`}
                  className="w-full h-auto min-w-[380px]"
                >
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = 20 + ratio * chartHeight;
                    return (
                      <line
                        key={index}
                        x1="40"
                        y1={y}
                        x2={chartWidth - 20}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Render Columns */}
                  {monthlyRevenue.map((item, index) => {
                    // Spacing calculations
                    const barCount = monthlyRevenue.length;
                    const spacing = (chartWidth - 80) / barCount;
                    const barWidth = Math.min(32, spacing - 15);
                    const x = 50 + index * spacing + (spacing - barWidth) / 2;

                    const height = (item.revenue / maxRevenue) * chartHeight;
                    const y = 20 + chartHeight - height;

                    return (
                      <g key={index} className="group">
                        {/* Bar Gradient Definition */}
                        <defs>
                          <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2294ff" />
                            <stop offset="100%" stopColor="#7faedb" />
                          </linearGradient>
                        </defs>

                        {/* Animated Bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          fill={`url(#gradient-${index})`}
                          rx="4"
                          ry="4"
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />

                        {/* Floating Cost Label above bar */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ${item.revenue}
                        </text>

                        {/* Month Footer Label */}
                        <text
                          x={x + barWidth / 2}
                          y={20 + chartHeight + 16}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatMonth(item.month)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Operational Appointment Statuses (1/3 width) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-100">Consultation States</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution breakdown of scheduled consultation visits.</p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            
            {/* Approved */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-emerald-400">Approved / Active</span>
                <span>{appointmentsBreakdown.approved} ({getPercentage(appointmentsBreakdown.approved)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(appointmentsBreakdown.approved)}%` }}
                ></div>
              </div>
            </div>

            {/* Completed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-primary">Completed</span>
                <span>{appointmentsBreakdown.completed} ({getPercentage(appointmentsBreakdown.completed)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(appointmentsBreakdown.completed)}%` }}
                ></div>
              </div>
            </div>

            {/* Pending */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-amber-500">Pending Approval</span>
                <span>{appointmentsBreakdown.pending} ({getPercentage(appointmentsBreakdown.pending)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(appointmentsBreakdown.pending)}%` }}
                ></div>
              </div>
            </div>

            {/* Cancelled */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="font-semibold text-rose-500">Cancelled</span>
                <span>{appointmentsBreakdown.cancelled} ({getPercentage(appointmentsBreakdown.cancelled)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${getPercentage(appointmentsBreakdown.cancelled)}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default ReportsDashboard;
