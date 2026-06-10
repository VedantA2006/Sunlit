import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import SlaBadge from '../components/SlaBadge';
import { formatDateOnly } from '../utils/formatDate';

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

  const [complaintForm, setComplaintForm] = useState({
    batteryId: '',
    type: 'Not Charging',
    description: '',
    priority: 'Medium'
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);

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
      await api.post('/batteries', batteryForm);
      setSuccess('Battery warranty registered successfully!');
      setBatteryForm({
        serialNumber: '',
        model: 'Telecom',
        purchaseDate: '',
        dealerName: '',
        warrantyYears: 3
      });
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
            <div className="lg:col-span-8 space-y-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Your Active Support Tickets</h3>
              
              {isLoading ? (
                <div className="py-20 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : complaints.length === 0 ? (
                <div className="bg-surface border border-outline-variant rounded-2xl p-12 text-center text-outline-variant">
                  <span className="material-symbols-outlined text-5xl mb-2 opacity-50 text-outline">info</span>
                  <p className="text-sm font-semibold">You have not raised any service complaints yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map(comp => (
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
                  {batteries.map(b => (
                    <div
                      key={b._id}
                      className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow relative overflow-hidden text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0 border border-outline-variant">
                        <span className="material-symbols-outlined text-2xl font-variation-settings-[('FILL'_1)]">battery_charging_full</span>
                      </div>
                      
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-bold text-on-surface text-sm truncate">{b.model} Battery</h4>
                        <div className="text-xxs font-mono text-on-surface-variant uppercase">
                          S/N: {b.serialNumber}
                        </div>
                        <div className="text-xxs text-outline">
                          Purchased: {formatDateOnly(b.purchaseDate)}
                        </div>
                        <div className="text-xxs text-outline">
                          Dealer: {b.dealerName}
                        </div>
                        
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xxs font-semibold mt-2 border border-green-100">
                          <span className="material-symbols-outlined text-xs">verified_user</span> {b.warrantyYears} Years Warranty
                        </span>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};

export default CustomerDashboard;
