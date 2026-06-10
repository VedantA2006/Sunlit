import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import SlaBadge from '../components/SlaBadge';

export const TechnicianDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Search and priority filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Right-hand dispatch form state
  const [updateForm, setUpdateForm] = useState({
    status: 'In Progress',
    note: '',
    files: []
  });

  // Accordion toggle states (per ticket ID)
  const [expandedTickets, setExpandedTickets] = useState({});

  const fetchAssignedTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/complaints/assigned');
      setComplaints(response.data);
      if (response.data.length > 0) {
        // Automatically select the first ticket
        setSelectedTicket(response.data[0]);
        setUpdateForm({
          status: response.data[0].status === 'Assigned' ? 'In Progress' : 'Resolved',
          note: '',
          files: []
        });
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch assigned complaints.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedTickets();
  }, [fetchAssignedTickets]);

  const toggleAccordion = (id) => {
    setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setUpdateForm({
      status: ticket.status === 'Assigned' ? 'In Progress' : 'Resolved',
      note: '',
      files: []
    });
    setSuccess('');
    setError('');
  };

  const handleFileChange = (e) => {
    setUpdateForm(prev => ({ ...prev, files: Array.from(e.target.files) }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setBtnLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('status', updateForm.status);
      formData.append('note', updateForm.note);
      updateForm.files.forEach(file => {
        formData.append('images', file);
      });

      await api.put(`/complaints/${selectedTicket._id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(`Ticket ${selectedTicket.complaintId} status updated to "${updateForm.status}" successfully!`);
      
      // Refresh list
      const response = await api.get('/complaints/assigned');
      setComplaints(response.data);
      // Keep selected ticket updated
      const updated = response.data.find(c => c._id === selectedTicket._id);
      if (updated) {
        setSelectedTicket(updated);
        setUpdateForm({
          status: updated.status === 'Assigned' ? 'In Progress' : 'Resolved',
          note: '',
          files: []
        });
      } else {
        setSelectedTicket(response.data[0] || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(comp => {
    const matchesSearch = searchQuery 
      ? comp.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesPriority = filterPriority ? comp.priority === filterPriority : true;
    return matchesSearch && matchesPriority;
  });

  // Calculate metrics
  const totalAssigned = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const breachedCount = complaints.filter(c => c.slaBreached || (c.status !== 'Resolved' && c.status !== 'Closed' && (new Date() - new Date(c.createdAt) > 24 * 60 * 60 * 1000 * (c.priority === 'Critical' ? 1 : c.priority === 'High' ? 2 : c.priority === 'Medium' ? 3 : 5)))).length;

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex">
      {/* SideBar Shared Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-outline-variant flex flex-col justify-between p-6 z-30">
        <div className="space-y-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">bolt</span>
            <span className="font-display-lg text-headline-md text-primary font-bold tracking-tight">ARENQ</span>
          </Link>

          {/* Quick Info */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-1.5 text-left">
            <span className="font-label-md text-label-md text-on-surface-variant">Hello, {user?.name || 'Technician'}!</span>
            <span className="font-caption text-caption text-outline">Technician Portal</span>
            <span className="font-caption text-caption font-mono text-[#783200] bg-secondary-fixed/50 px-2 py-0.5 rounded self-start mt-1">Active Duty</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all bg-primary text-on-primary shadow-md text-left"
            >
              <span className="material-symbols-outlined">assignment_turned_in</span>
              Assigned Complaints
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
              <h1 className="font-display-lg text-headline-lg text-on-surface">Assigned Complaints</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Manage technical inspections and submit resolution files.</p>
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
              <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">pending_actions</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">Assigned Complaints</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{totalAssigned}</h3>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-secondary/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-secondary text-3xl font-variation-settings-[('FILL'_1)]">engineering</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">In Progress</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{inProgressCount}</h3>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="bg-error/10 p-3 rounded-xl">
              <span className="material-symbols-outlined text-error text-3xl font-variation-settings-[('FILL'_1)]">running_with_errors</span>
            </div>
            <div>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider block">SLA Near Breach</span>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{breachedCount}</h3>
            </div>
          </div>
        </div>

        {/* Two-Column Interactive Grid */}
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Search Filters & Active Complaints List */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            
            {/* Quick Filter / Search */}
            <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-gutter items-center">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Ticket ID, description or customer..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-on-surface bg-surface-container-low"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-outline-variant focus:outline-none text-xs font-semibold text-on-surface bg-surface-container-low w-full sm:w-auto"
                >
                  <option value="">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Complaints List */}
            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-surface border border-outline-variant rounded-2xl p-16 text-center text-outline-variant">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50 text-outline">check_box</span>
                <h4 className="text-sm font-bold text-on-surface">No assigned work orders</h4>
                <p className="text-xs mt-1">Check back later for new customer complaints.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredComplaints.map(comp => {
                  const isSelected = selectedTicket && selectedTicket._id === comp._id;
                  const isExpanded = !!expandedTickets[comp._id];
                  
                  return (
                    <div
                      key={comp._id}
                      onClick={() => handleSelectTicket(comp)}
                      className={`bg-surface border rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col text-left cursor-pointer ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'
                      }`}
                    >
                      {/* Priority strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        comp.priority === 'Critical' ? 'bg-error' :
                        comp.priority === 'High' ? 'bg-secondary' :
                        comp.priority === 'Medium' ? 'bg-yellow-500' :
                        'bg-outline-variant'
                      }`} />

                      {/* Header content */}
                      <div className="p-gutter pl-5">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-extrabold text-on-surface">{comp.complaintId}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              comp.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                              comp.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              comp.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                              'bg-slate-100 text-slate-700'
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

                        {/* Customer contact summary */}
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold mt-1">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span>{comp.customerId?.name}</span>
                          <span className="text-outline-variant">|</span>
                          <a href={`tel:${comp.customerId?.phone}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                            {comp.customerId?.phone}
                          </a>
                        </div>
                      </div>

                      {/* Collapsible details section */}
                      <div className="border-t border-outline-variant/50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAccordion(comp._id);
                          }}
                          className="w-full flex justify-between items-center px-gutter py-2.5 bg-surface-container-low hover:bg-surface-container border-b border-outline-variant/50 text-left"
                        >
                          <span className="font-bold text-on-surface text-xxs uppercase tracking-wider">Problem Details & Description</span>
                          <span className={`material-symbols-outlined transition-transform duration-300 text-outline ${
                            isExpanded ? 'rotate-180' : ''
                          }`}>expand_more</span>
                        </button>

                        {isExpanded && (
                          <div className="p-gutter bg-surface-container-lowest space-y-3 text-xs pl-5">
                            <div>
                              <span className="text-outline font-semibold uppercase text-[10px]">Problem Type</span>
                              <p className="text-on-surface font-semibold mt-0.5">{comp.type}</p>
                            </div>
                            <div>
                              <span className="text-outline font-semibold uppercase text-[10px]">Description</span>
                              <p className="text-on-surface leading-relaxed mt-0.5">{comp.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-2">
                              <div>
                                <span className="text-outline font-semibold uppercase text-[10px]">Battery Model</span>
                                <p className="text-on-surface font-semibold">{comp.batteryId?.model || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-outline font-semibold uppercase text-[10px]">Serial Number</span>
                                <p className="text-on-surface font-mono font-semibold">{comp.batteryId?.serialNumber || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="border-t border-outline-variant/30 pt-2">
                              <span className="text-outline font-semibold uppercase text-[10px]">Customer Installation Address</span>
                              <p className="text-on-surface mt-0.5">{comp.customerId?.address || 'No address provided'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card actions footer */}
                      <div className="px-gutter py-3 bg-surface-container-low/50 flex justify-between items-center text-xxs font-semibold text-outline-variant pl-5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Assigned: {new Date(comp.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-primary font-bold flex items-center gap-0.5">
                          Select for Update <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Dispatch & Status Center Form */}
          <div className="col-span-12 lg:col-span-5 bg-surface border border-outline-variant rounded-xl p-container-padding flex flex-col gap-6 sticky top-20 text-left">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Dispatch & Status Center</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Submit resolution notes and mark complaints resolved.</p>
            </div>

            {selectedTicket ? (
              <form onSubmit={handleUpdateStatus} className="flex flex-col gap-4">
                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-outline">Active Ticket:</span>
                    <span className="font-bold text-on-surface font-mono">{selectedTicket.complaintId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-outline">Customer Name:</span>
                    <span className="font-bold text-on-surface">{selectedTicket.customerId?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-outline">Current Status:</span>
                    <span className="font-bold text-primary">{selectedTicket.status}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Update Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                    disabled={selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved (Resolution complete)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Status Note / Work Summary *</label>
                  <textarea
                    value={updateForm.note}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, note: e.target.value }))}
                    required
                    disabled={selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                    rows="3"
                    placeholder="Detail the repairs, component replacements, or diagnostics completed..."
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>

                {updateForm.status === 'Resolved' && (
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 cursor-pointer flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">cloud_upload</span> Attach Proof of Work / Report
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                      className="w-full text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-surface-container-high file:text-on-surface hover:file:bg-outline-variant/50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={btnLoading || selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                  className="w-full bg-secondary text-on-secondary py-3 rounded-xl text-xs font-bold hover:bg-secondary-container transition-all active:scale-95 shadow-sm disabled:bg-slate-300"
                >
                  {btnLoading ? 'Updating...' : 'Update Ticket Status'}
                </button>
              </form>
            ) : (
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-8 text-center text-outline-variant">
                <span className="material-symbols-outlined text-5xl mb-2 opacity-50 text-outline">touch_app</span>
                <p className="text-xs font-semibold">Select a complaint card on the left panel to update status details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TechnicianDashboard;
