import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function BillingList() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unpaid, paid

  // Collect Payment state
  const [selectedMethods, setSelectedMethods] = useState({}); // { billId: 'card' }

  // Invoice Details Modal state
  const [activeInvoice, setActiveInvoice] = useState(null);

  const isPatient = user?.role === 'patient';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist';

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/billing');
      if (response.data && response.data.success) {
        setBills(response.data.bills);
        
        // Initialize payment methods defaults
        const methods = {};
        response.data.bills.forEach((b) => {
          methods[b._id] = 'cash';
        });
        setSelectedMethods(methods);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing invoices.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPayment = async (billId) => {
    const method = selectedMethods[billId] || 'cash';
    try {
      const response = await axios.put(`/api/billing/${billId}/payment`, { paymentMethod: method });
      if (response.data && response.data.success) {
        fetchBills(); // Reload list
        // Update details model if currently open
        if (activeInvoice && activeInvoice._id === billId) {
          setActiveInvoice(response.data.bill);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to collect payment.');
    }
  };

  const handleMethodChange = (billId, value) => {
    setSelectedMethods({
      ...selectedMethods,
      [billId]: value
    });
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and New Invoice CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Financial Invoicing</h2>
          <p className="text-sm text-slate-400 mt-1">Manage hospital consultation fees, lab diagnostic bills, and payment records.</p>
        </div>
        {isStaff && (
          <Link
            to="/billing/new"
            className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Issue New Invoice
          </Link>
        )}
      </div>

      {/* Tabs Filter Menu */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1">
        {['all', 'unpaid', 'paid'].map((filter) => {
          const count = filter === 'all' ? bills.length : bills.filter((b) => b.status === filter).length;
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`py-2.5 px-4 border-b-2 font-semibold text-sm capitalize whitespace-nowrap transition-all duration-150 ${
                statusFilter === filter
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {filter} ({count})
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800/80">
                <th className="py-4 px-6">Invoice Number</th>
                <th className="py-4 px-6">Patient Name</th>
                <th className="py-4 px-6">Date Issued</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary mx-auto mb-2"></div>
                    Fetching invoices...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-slate-950/30 transition">
                    <td className="py-4 px-6 font-semibold text-slate-200 font-mono">{bill.billNumber}</td>
                    <td className="py-4 px-6 text-slate-300 font-medium">{bill.patient?.user?.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      {new Date(bill.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200 font-mono">${bill.totalAmount}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
                        bill.status === 'paid'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setActiveInvoice(bill)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700/40 transition inline-block"
                      >
                        View Invoice
                      </button>

                      {/* Collect Payment inline widget (Staff only, unpaid bills) */}
                      {isStaff && bill.status === 'unpaid' && (
                        <div className="inline-flex gap-1.5 items-center">
                          <select
                            value={selectedMethods[bill._id] || 'cash'}
                            onChange={(e) => handleMethodChange(bill._id, e.target.value)}
                            className="bg-slate-950 border border-slate-850 focus:border-primary text-slate-300 text-xs rounded-lg py-1 px-2 outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="insurance">Insurance</option>
                          </select>
                          <button
                            onClick={() => handleCollectPayment(bill._id)}
                            className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Collect
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal Overlay */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            
            {/* Modal Actions */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="text-sm font-bold text-slate-400 font-mono">Invoice Summary</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700/50 transition"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="py-1.5 px-3 bg-slate-950 hover:bg-slate-900 text-slate-400 rounded-lg text-xs font-semibold border border-slate-850 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Print Area */}
            <div className="space-y-6 print-invoice">
              
              {/* Branding and Invoice headers */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-xl text-primary tracking-tight">Hospital System</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">INV NO: {activeInvoice.billNumber}</p>
                  <p className="text-xs text-slate-500 font-mono">DATE: {new Date(activeInvoice.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className={`text-[11px] font-extrabold tracking-widest border rounded px-3 py-1 inline-block uppercase ${
                    activeInvoice.status === 'paid'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                  }`}>
                    {activeInvoice.status}
                  </div>
                  {activeInvoice.status === 'paid' && (
                    <p className="text-[10px] text-slate-500 font-mono mt-1 capitalize">Method: {activeInvoice.paymentMethod}</p>
                  )}
                </div>
              </div>

              {/* Patient Details */}
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-mono">Billed To Patient:</span>
                  <strong className="text-slate-200 text-sm">{activeInvoice.patient?.user?.name}</strong>
                  <span className="text-slate-400 block font-mono mt-0.5">{activeInvoice.patient?.user?.email}</span>
                </div>
                {activeInvoice.doctor && (
                  <div className="text-right">
                    <span className="text-slate-500 block font-mono">Attending Practitioner:</span>
                    <strong className="text-slate-200 text-sm">{activeInvoice.doctor?.user?.name}</strong>
                    <span className="text-slate-400 block font-mono mt-0.5">({activeInvoice.doctor?.department?.name})</span>
                  </div>
                )}
              </div>

              {/* Services Rendered Table */}
              <div className="border border-slate-850 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-500 font-semibold uppercase border-b border-slate-850">
                      <th className="py-2.5 px-4">Service Description</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono text-slate-300">
                    {activeInvoice.services?.map((serv, index) => (
                      <tr key={index}>
                        <td className="py-2.5 px-4">{serv.serviceName}</td>
                        <td className="py-2.5 px-4 text-right text-slate-200 font-semibold">${serv.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/40 font-bold border-t border-slate-850 text-slate-200 font-mono">
                      <td className="py-3 px-4 text-right">TOTAL AMOUNT DUE:</td>
                      <td className="py-3 px-4 text-right text-sm text-primary">${activeInvoice.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default BillingList;
