import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import SlaBadge from '../components/SlaBadge';
import { formatDateOnly } from '../utils/formatDate';

// Calculate details of the warranty status and time left
const calculateWarrantyDetails = (purchaseDateStr, warrantyYears) => {
  if (!purchaseDateStr) return { status: 'Unknown', timeLeft: 'N/A', expiryDate: null, expired: false };
  const purchaseDate = new Date(purchaseDateStr);
  const expiryDate = new Date(purchaseDate.getFullYear() + warrantyYears, purchaseDate.getMonth(), purchaseDate.getDate());
  const today = new Date();
  
  if (today > expiryDate) {
    return {
      status: 'Expired',
      timeLeft: 'Expired',
      expiryDate,
      expired: true
    };
  }
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  let timeLeftStr = '';
  if (years > 0) {
    timeLeftStr += `${years} Year${years > 1 ? 's' : ''} `;
  }
  if (months > 0) {
    timeLeftStr += `${months} Month${months > 1 ? 's' : ''} `;
  }
  if (years === 0 && days > 0) {
    timeLeftStr += `${days} Day${days > 1 ? 's' : ''}`;
  }
  
  if (timeLeftStr.trim() === '') {
    timeLeftStr = 'Expires today';
  } else {
    timeLeftStr = timeLeftStr.trim() + ' left';
  }
  
  return {
    status: 'Active',
    timeLeft: timeLeftStr,
    expiryDate,
    expired: false
  };
};

export const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints', 'batteries'
  
  // Data lists
  const [complaints, setComplaints] = useState([]);
  const [batteries, setBatteries] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [batteryForm, setBatteryForm] = useState({
    serialNumber: '',
    model: 'Telecom',
    purchaseDate: '',
    dealerName: '',
    warrantyYears: 3
  });
  const [batteryInvoiceFile, setBatteryInvoiceFile] = useState(null);

  const [complaintForm, setComplaintForm] = useState({
    batteryId: '',
    type: 'Not Charging',
    description: '',
    priority: 'Medium'
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Battery Modal state & Complaint filters
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [complaintFilter, setComplaintFilter] = useState('all'); // 'all', 'active', 'resolved'

  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    complaintId: '',
    complaintTextId: '',
    serviceRating: 5,
    techRating: 5,
    comments: ''
  });

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, batRes] = await Promise.all([
        api.get('/complaints/mine'),
        api.get('/batteries')
      ]);
      setComplaints(compRes.data);
      setBatteries(batRes.data);
      if (batRes.data.length > 0) {
        setComplaintForm(prev => ({ ...prev, batteryId: batRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Battery Registration
  const handleRegisterBattery = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('serialNumber', batteryForm.serialNumber);
      formData.append('model', batteryForm.model);
      formData.append('purchaseDate', batteryForm.purchaseDate);
      formData.append('dealerName', batteryForm.dealerName);
      formData.append('warrantyYears', batteryForm.warrantyYears);
      if (batteryInvoiceFile) {
        formData.append('invoiceImage', batteryInvoiceFile);
      }

      await api.post('/batteries', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Battery warranty registered successfully!');
      setBatteryForm({
        serialNumber: '',
        model: 'Telecom',
        purchaseDate: '',
        dealerName: '',
        warrantyYears: 3
      });
      setBatteryInvoiceFile(null);
      const fileInput = document.getElementById('battery-invoice-file');
      if (fileInput) fileInput.value = '';
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register battery.');
    } finally {
      setBtnLoading(false);
    }
  };

  // Complaint Submission
  const handleFileChange = (e) => {
    setUploadedFiles(Array.from(e.target.files));
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.batteryId) {
      setError('Please select a battery from your registered products list.');
      return;
    }
    setBtnLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('batteryId', complaintForm.batteryId);
      formData.append('type', complaintForm.type);
      formData.append('description', complaintForm.description);
      formData.append('priority', complaintForm.priority);
      uploadedFiles.forEach(file => {
        formData.append('images', file);
      });

      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Complaint ticket raised successfully. We will contact you shortly!');
      setComplaintForm(prev => ({
        ...prev,
        description: ''
      }));
      setUploadedFiles([]);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise complaint.');
    } finally {
      setBtnLoading(false);
    }
  };

  // Feedback Submission
  const handleOpenFeedback = (id, textId) => {
    setFeedbackModal({
      isOpen: true,
      complaintId: id,
      complaintTextId: textId,
      serviceRating: 5,
      techRating: 5,
      comments: ''
    });
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/feedback', {
        complaintId: feedbackModal.complaintId,
        serviceRating: feedbackModal.serviceRating,
        techRating: feedbackModal.techRating,
        comments: feedbackModal.comments
      });
      setSuccess('Thank you for rating our service support!');
      setFeedbackModal(prev => ({ ...prev, isOpen: false }));
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Stats
  const totalRaised = complaints.length;
  const activeCount = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const filteredComplaints = complaints.filter(comp => {
    if (complaintFilter === 'active') {
      return comp.status !== 'Resolved' && comp.status !== 'Closed';
    }
    if (complaintFilter === 'resolved') {
      return comp.status === 'Resolved' || comp.status === 'Closed';
    }
    return true; // 'all'
  });

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex">
      {/* SideBar Shared Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-outline-variant flex flex-col justify-between p-6 z-30">
        <div className="space-y-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">bolt</span>
            <span className="font-display-lg text-headline-md text-primary font-bold tracking-tight">SUNLIT</span>
          </Link>

          {/* Quick Info */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-1.5 text-left">
            <span className="font-label-md text-label-md text-on-surface-variant">Hello, {user?.name || 'Customer'}!</span>
            <span className="font-caption text-caption text-outline">Customer Portal</span>
            <span className="font-caption text-caption font-mono text-primary bg-primary-fixed/50 px-2 py-0.5 rounded self-start mt-1">ID: {user?.id}</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all ${
                activeTab === 'complaints'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">assignment</span>
              Service Tickets
            </button>
            <button
              onClick={() => setActiveTab('batteries')}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all ${
                activeTab === 'batteries'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined">battery_charging_full</span>
              Registered Batteries
            </button>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold text-error hover:bg-error-container/30 transition-all mt-auto"
        >
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[280px] flex-1 min-h-screen bg-surface-container-lowest p-8 flex flex-col text-left">
        {/* Header Title Block */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-display-lg text-headline-lg text-on-surface">
                {activeTab === 'complaints' ? 'Service Tickets Support' : 'My Registered Batteries'}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {activeTab === 'complaints'
                  ? 'Raise technical complaints and track warranty resolution statuses.'
                  : 'Manage and review your battery purchase warranties and details.'}
              </p>
            </div>
          </div>
        </header>

        {/* Success / Error Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-brand-success text-sm rounded-xl flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-brand-error text-sm rounded-xl flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-red-600">warning</span>
            {error}
          </div>
        )}

        {/* Bento Metric Grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-primary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">assignment</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Total Raised</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{totalRaised}</h3>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-secondary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-secondary text-3xl font-variation-settings-[('FILL'_1)]">pending_actions</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Active / Under Review</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeCount}</h3>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-primary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">verified</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Resolved Support</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{resolvedCount}</h3>
            </div>
          </div>
        </div>

        {/* Content Tabs Switcher */}
        {activeTab === 'complaints' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form to raise complaint */}
            <div className="lg:col-span-4 bg-surface border border-outline-variant p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-2">Raise Service Ticket</h3>
              
              <form onSubmit={handleRaiseComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Select Battery Product *</label>
                  {batteries.length === 0 ? (
                    <div className="text-xs text-error font-medium p-2 bg-red-50 border border-red-100 rounded-lg">
                      No registered batteries. Please register a product first.
                    </div>
                  ) : (
                    <select
                      name="batteryId"
                      required
                      value={complaintForm.batteryId}
                      onChange={(e) => setComplaintForm(prev => ({ ...prev, batteryId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                    >
                      {batteries.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.model} - S/N: {b.serialNumber}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Complaint Type *</label>
                  <select
                    name="type"
                    required
                    value={complaintForm.type}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    <option value="Not Charging">Not Charging</option>
                    <option value="Low Backup">Low Backup</option>
                    <option value="Overheating">Overheating</option>
                    <option value="Swelling">Swelling</option>
                    <option value="Leakage">Leakage</option>
                    <option value="Physical Damage">Physical Damage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Priority Level *</label>
                  <select
                    name="priority"
                    required
                    value={complaintForm.priority}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    <option value="Low">Low (SLA: 120h resolution)</option>
                    <option value="Medium">Medium (SLA: 72h resolution)</option>
                    <option value="High">High (SLA: 48h resolution)</option>
                    <option value="Critical">Critical (SLA: 24h resolution)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Describe Problem *</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details of the battery symptoms..."
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">cloud_upload</span> Attach Photo/Verification
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-outline-variant/50"
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="text-[10px] text-outline mt-1 font-semibold">
                      {uploadedFiles.length} file(s) attached
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={btnLoading || batteries.length === 0}
                  className="w-full bg-secondary text-on-secondary py-2.5 rounded-xl text-xs font-bold hover:bg-secondary-container transition-colors shadow-sm disabled:bg-slate-300"
                >
                  {btnLoading ? 'Submitting...' : 'Register Ticket'}
                </button>
              </form>
            </div>

            {/* Right Column: Active complaints list */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {complaintFilter === 'all' ? 'All Support Tickets' :
                   complaintFilter === 'active' ? 'Active Support Tickets' :
                   'Resolved & Closed History'}
                </h3>
                
                {/* Filter Tabs */}
                <div className="flex bg-surface-container-high p-1 rounded-xl gap-1 self-start">
                  <button
                    type="button"
                    onClick={() => setComplaintFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      complaintFilter === 'all'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    All ({complaints.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplaintFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      complaintFilter === 'active'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Active ({complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplaintFilter('resolved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      complaintFilter === 'resolved'
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Resolved ({complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length})
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center text-outline-variant">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-50 text-outline">info</span>
                  <p className="text-sm font-semibold">
                    {complaintFilter === 'all' ? 'You have not raised any service complaints yet.' :
                     complaintFilter === 'active' ? 'You do not have any active support tickets.' :
                     'You do not have any resolved or closed support tickets yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map(comp => (
                    <div
                      key={comp._id}
                      className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden text-left"
                    >
                      {/* Priority left line indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        comp.priority === 'Critical' ? 'bg-error' :
                        comp.priority === 'High' ? 'bg-secondary' :
                        comp.priority === 'Medium' ? 'bg-yellow-500' :
                        'bg-outline-variant'
                      }`} />

                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-on-surface">{comp.complaintId}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            comp.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            comp.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            comp.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            comp.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {comp.status}
                          </span>
                        </div>
                        <SlaBadge
                          createdAt={comp.createdAt}
                          priority={comp.priority}
                          status={comp.status}
                          resolvedAt={comp.resolvedAt}
                          slaBreached={comp.slaBreached}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-xs mt-2 border-b border-outline-variant/20 pb-3">
                        <div>
                          <span className="text-outline font-semibold block mb-0.5">Problem Type</span>
                          <span className="text-on-surface font-semibold">{comp.type}</span>
                        </div>
                        <div>
                          <span className="text-outline font-semibold block mb-0.5">Battery Serial</span>
                          <span className="text-on-surface font-mono font-semibold">
                            {comp.batteryId?.serialNumber || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-on-surface-variant line-clamp-1 flex-1 font-semibold">
                          {comp.description}
                        </p>
                        
                        <div className="flex gap-2 shrink-0">
                          {comp.status === 'Resolved' && (
                            <button
                              onClick={() => handleOpenFeedback(comp._id, comp.complaintId)}
                              className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded-lg hover:bg-secondary-container transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm font-variation-settings-[('FILL'_1)]">star</span> Rate Service
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/complaints/${comp._id}`)}
                            className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded-lg hover:bg-outline-variant/30 transition-colors"
                          >
                            View Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Register New Battery Product */}
            <div className="lg:col-span-4 bg-surface border border-outline-variant p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-2">Register New Product</h3>
              
              <form onSubmit={handleRegisterBattery} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    value={batteryForm.serialNumber}
                    onChange={(e) => setBatteryForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="e.g. SLP-TEL-2025-001"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Battery Model *</label>
                  <select
                    value={batteryForm.model}
                    onChange={(e) => setBatteryForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    <option value="Telecom">Telecom</option>
                    <option value="Solar">Solar</option>
                    <option value="EV">EV</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Robotics">Robotics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={batteryForm.purchaseDate}
                    onChange={(e) => setBatteryForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Dealer Name *</label>
                  <input
                    type="text"
                    required
                    value={batteryForm.dealerName}
                    onChange={(e) => setBatteryForm(prev => ({ ...prev, dealerName: e.target.value }))}
                    placeholder="Distributor or Dealer name"
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Warranty Duration *</label>
                  <select
                    value={batteryForm.warrantyYears}
                    onChange={(e) => setBatteryForm(prev => ({ ...prev, warrantyYears: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    <option value={1}>1 Year</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                    <option value={5}>5 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 cursor-pointer flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">receipt_long</span> Upload Invoice Image (Optional)
                  </label>
                  <input
                    id="battery-invoice-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBatteryInvoiceFile(e.target.files[0])}
                    className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-outline-variant/50"
                  />
                  {batteryInvoiceFile && (
                    <div className="text-[10px] text-primary mt-1 font-semibold">
                      Selected: {batteryInvoiceFile.name}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={btnLoading}
                  className="w-full bg-secondary text-on-secondary py-2.5 rounded-xl text-xs font-bold hover:bg-secondary-container transition-colors shadow-sm disabled:bg-slate-300"
                >
                  {btnLoading ? 'Saving...' : 'Register Product'}
                </button>
              </form>
            </div>

            {/* Right Column: Registered batteries list */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Your Registered Batteries</h3>
              
              {isLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : batteries.length === 0 ? (
                <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center text-outline-variant">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-50 text-outline">battery_unknown</span>
                  <p className="text-sm font-semibold">You do not have any registered batteries.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {batteries.map(b => {
                    const warranty = calculateWarrantyDetails(b.purchaseDate, b.warrantyYears);
                    return (
                      <div
                        key={b._id}
                        className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden text-left"
                      >
                        {/* Status bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${warranty.expired ? 'bg-error' : 'bg-green-500'}`} />
                        
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-outline-variant ${
                            warranty.expired ? 'bg-error-container/30 text-error' : 'bg-primary-fixed/30 text-primary'
                          }`}>
                            <span className="material-symbols-outlined text-2xl font-variation-settings-[('FILL'_1)]">
                              {warranty.expired ? 'battery_alert' : 'battery_charging_full'}
                            </span>
                          </div>
                          
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-on-surface text-sm truncate">{b.model} Battery</h4>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                warranty.expired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                              }`}>
                                {warranty.expired ? 'Expired' : 'Active'}
                              </span>
                            </div>
                            <div className="text-xxs font-mono text-on-surface-variant uppercase">
                              S/N: {b.serialNumber}
                            </div>
                            <div className="text-xxs text-outline">
                              Purchased: {formatDateOnly(b.purchaseDate)}
                            </div>
                            <div className="text-xxs text-outline">
                              Dealer: {b.dealerName}
                            </div>
                            <div className="text-xxs font-semibold text-primary mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">shield</span>
                              {b.warrantyYears} Years ({warranty.timeLeft})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-outline-variant/30 pt-3 mt-1">
                          {b.invoiceImage ? (
                            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">receipt_long</span> Invoice Attached
                            </span>
                          ) : (
                            <span className="text-[10px] text-outline font-medium flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs flex">receipt_long</span> No Invoice
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBattery(b)}
                            className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            View Details & History
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Feedback modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant relative text-left">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Rate Support Service</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Rate your resolution experience for ticket <strong className="text-on-surface">{feedbackModal.complaintTextId}</strong>.
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                  Overall Service Rating (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackModal(prev => ({ ...prev, serviceRating: star }))}
                      className="text-2xl"
                    >
                      <span className={`material-symbols-outlined text-3xl ${
                        star <= feedbackModal.serviceRating
                          ? 'text-secondary font-variation-settings-[("FILL"_1)]'
                          : 'text-outline-variant'
                      }`}>star</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1">
                  Technician Professionalism Rating (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackModal(prev => ({ ...prev, techRating: star }))}
                      className="text-2xl"
                    >
                      <span className={`material-symbols-outlined text-3xl ${
                        star <= feedbackModal.techRating
                          ? 'text-secondary font-variation-settings-[("FILL"_1)]'
                          : 'text-outline-variant'
                      }`}>star</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1 font-bold">Comments</label>
                <textarea
                  value={feedbackModal.comments}
                  onChange={(e) => setFeedbackModal(prev => ({ ...prev, comments: e.target.value }))}
                  required
                  rows="3"
                  placeholder="Share details of your support experience..."
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-surface-container-high hover:bg-outline-variant/35 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="px-5 py-2 bg-secondary text-on-secondary text-xs font-bold rounded-xl transition-colors shadow-sm hover:bg-secondary-container"
                >
                  {btnLoading ? 'Saving...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Battery Details & History Modal */}
      {selectedBattery && (() => {
        const freshBattery = batteries.find(b => b._id === selectedBattery._id) || selectedBattery;
        const warranty = calculateWarrantyDetails(freshBattery.purchaseDate, freshBattery.warrantyYears);
        const batteryComplaints = complaints.filter(c => 
          (c.batteryId?._id && c.batteryId._id === freshBattery._id) || 
          (c.batteryId && c.batteryId === freshBattery._id)
        );
        const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000/uploads';

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl p-6 border border-outline-variant relative text-left flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-4">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary font-variation-settings-[('FILL'_1)]">battery_charging_full</span>
                    {freshBattery.model} Battery Details
                  </h3>
                  <p className="text-xs font-mono text-outline uppercase mt-0.5">Serial Number: {freshBattery.serialNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedBattery(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto flex-1 pr-1.5">
                {/* Left side - Battery Info & Invoice */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Product Info</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-outline block mb-0.5">Model</span>
                        <span className="font-semibold text-on-surface">{freshBattery.model}</span>
                      </div>
                      <div>
                        <span className="text-outline block mb-0.5">Warranty Duration</span>
                        <span className="font-semibold text-on-surface">{freshBattery.warrantyYears} Years</span>
                      </div>
                      <div>
                        <span className="text-outline block mb-0.5">Purchase Date</span>
                        <span className="font-semibold text-on-surface">{formatDateOnly(freshBattery.purchaseDate)}</span>
                      </div>
                      <div>
                        <span className="text-outline block mb-0.5">Registered Date</span>
                        <span className="font-semibold text-on-surface">{formatDateOnly(freshBattery.registeredAt)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-outline block mb-0.5">Dealer / Distributor</span>
                        <span className="font-semibold text-on-surface">{freshBattery.dealerName || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/30 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-outline font-medium">Warranty Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          warranty.expired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {warranty.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-on-surface mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                        <span>Expires on: {formatDateOnly(warranty.expiryDate)}</span>
                      </div>
                      <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${warranty.expired ? 'text-error' : 'text-green-600'}`}>
                        <span className="material-symbols-outlined text-sm">{warranty.expired ? 'info' : 'hourglass_bottom'}</span>
                        <span>{warranty.timeLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Image Preview */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-2">Invoice Document</h4>
                    {freshBattery.invoiceImage ? (
                      <div className="space-y-2">
                        <a
                          href={`${imageBaseUrl}/${freshBattery.invoiceImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative aspect-video bg-slate-100 border border-outline-variant rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow block"
                        >
                          <img
                            src={`${imageBaseUrl}/${freshBattery.invoiceImage}`}
                            alt="Invoice"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">open_in_new</span> View Full Size
                            </span>
                          </div>
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-outline bg-surface rounded-lg border border-dashed border-outline-variant text-xs">
                        <span className="material-symbols-outlined text-2xl opacity-50 block mb-1">receipt_long</span>
                        No invoice uploaded during registration.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Complaint History for this battery */}
                <div className="md:col-span-7 flex flex-col min-h-0">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm font-variation-settings-[('FILL'_1)]">assignment</span>
                    Service History ({batteryComplaints.length})
                  </h4>

                  {batteryComplaints.length === 0 ? (
                    <div className="bg-surface border border-outline-variant border-dashed rounded-xl p-8 text-center text-outline flex-1 flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-3xl mb-1 opacity-50">check_circle</span>
                      <p className="text-xs font-semibold">No complaints registered for this product.</p>
                      <p className="text-[10px] text-outline mt-0.5">Everything is operating normally.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1.5 max-h-[350px]">
                      {batteryComplaints.map(comp => (
                        <div
                          key={comp._id}
                          className="bg-surface border border-outline-variant rounded-xl p-4 hover:shadow-sm transition-shadow relative text-left"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-extrabold text-on-surface">{comp.complaintId}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              comp.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              comp.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              comp.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              comp.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {comp.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xxs mb-2 text-outline-variant border-b border-outline-variant/20 pb-2">
                            <div>
                              <span className="text-outline font-semibold block">Problem</span>
                              <span className="text-on-surface font-semibold">{comp.type}</span>
                            </div>
                            <div>
                              <span className="text-outline font-semibold block">Date Raised</span>
                              <span className="text-on-surface font-semibold">{formatDateOnly(comp.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-1.5">
                            <p className="text-xxs text-on-surface-variant line-clamp-1 flex-1 font-semibold">
                              {comp.description}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedBattery(null);
                                navigate(`/complaints/${comp._id}`);
                              }}
                              className="px-2.5 py-1 bg-surface-container-high text-on-surface text-[10px] font-bold rounded hover:bg-outline-variant/30 transition-colors shrink-0"
                            >
                              View Ticket
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-outline-variant/30 pt-4 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBattery(null)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-outline-variant/35 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerDashboard;
