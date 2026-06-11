import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import SlaBadge from '../components/SlaBadge';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Stats Counters
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalBatteries: 0,
    openComplaints: 0,
    closedComplaints: 0,
    activeTechnicians: 0,
    satisfactionPct: 100
  });

  // Chart Data
  const [monthlyData, setMonthlyData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [slaSummary, setSlaSummary] = useState({ compliant: 0, nearBreach: 0, breached: 0, compliancePct: 100 });
  const [techPerf, setTechPerf] = useState([]);

  // Ticket Table & Filters
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Selection Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assignment Modal
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    complaintId: '',
    complaintTextId: '',
    technicianId: ''
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [
        statsRes,
        monthlyRes,
        trendsRes,
        productRes,
        slaRes,
        techPerfRes,
        ticketsRes,
        techsRes
      ] = await Promise.all([
        api.get('/reports/dashboard-stats'),
        api.get('/reports/monthly-complaints'),
        api.get('/reports/resolution-trends'),
        api.get('/reports/product-complaints'),
        api.get('/reports/sla-summary'),
        api.get('/reports/technician-perf'),
        api.get('/complaints'),
        api.get('/technicians')
      ]);

      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
      setTrendData(trendsRes.data);
      setProductData(productRes.data);
      setSlaSummary(slaRes.data);
      setTechPerf(techPerfRes.data);
      setTickets(ticketsRes.data);
      setTechnicians(techsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters calculation
  const filteredTickets = tickets.filter(t => {
    const matchesPriority = filterPriority ? t.priority === filterPriority : true;
    const matchesStatus = filterStatus ? t.status === filterStatus : true;
    const matchesSearch = searchQuery 
      ? t.complaintId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesPriority && matchesStatus && matchesSearch;
  });

  // Escalate ticket
  const handleEscalate = async (id) => {
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const response = await api.put(`/complaints/${id}/escalate`);
      setSuccess(`Ticket priority escalated successfully to "${response.data.complaint.priority}"!`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to escalate ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Close ticket
  const handleClose = async (id) => {
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.put(`/complaints/${id}/close`);
      setSuccess('Ticket closed and archived successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete ticket
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this complaint ticket?')) return;
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.delete(`/complaints/${id}`);
      setSuccess('Ticket deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Assignment logic
  const handleOpenAssign = (id, textId) => {
    setAssignModal({
      isOpen: true,
      complaintId: id,
      complaintTextId: textId,
      technicianId: technicians[0]?._id || ''
    });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.technicianId) {
      setError('Please select a technician.');
      return;
    }
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.put(`/complaints/${assignModal.complaintId}/assign`, {
        technicianId: assignModal.technicianId
      });
      setSuccess('Technician assigned successfully.');
      setAssignModal(prev => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign technician.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Color arrays for Recharts Pie charts
  const COLORS = ['#00236f', '#F97316', '#CA8A04', '#16A34A', '#8B5CF6', '#EC4899'];
  const SLA_COLORS = {
    'compliant': '#16A34A',
    'nearBreach': '#CA8A04',
    'breached': '#DC2626'
  };

  const slaPieData = [
    { name: 'Compliant', value: slaSummary.compliant, color: SLA_COLORS.compliant },
    { name: 'Near Breach', value: slaSummary.nearBreach, color: SLA_COLORS.nearBreach },
    { name: 'Breached', value: slaSummary.breached, color: SLA_COLORS.breached }
  ].filter(d => d.value > 0);

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

          {/* Quick User Status Info */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-1.5 text-left">
            <span className="font-label-md text-label-md text-on-surface-variant font-bold">Hello, {user?.name || 'Admin'}!</span>
            <span className="font-caption text-caption text-outline">System Control Portal</span>
            <span className="font-caption text-caption font-mono text-primary bg-primary-fixed/50 px-2 py-0.5 rounded self-start mt-1">Role: {user?.role}</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all bg-primary text-on-primary shadow-md text-left"
            >
              <span className="material-symbols-outlined">dashboard</span>
              Admin Overview
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all text-on-surface-variant hover:bg-surface-container-low hover:text-primary text-left"
            >
              <span className="material-symbols-outlined">group</span>
              User Management
            </Link>
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
        
        {/* Header Block */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display-lg text-headline-lg text-on-surface">Support Analytics &amp; Control</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Admin oversight panel for complaints, technicians, and SLAs.</p>
          </div>
          <button 
            onClick={loadData}
            disabled={isLoading || actionLoading}
            className="flex items-center gap-1.5 bg-surface border border-outline-variant px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin' : ''}`}>sync</span> Refresh Portal
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">Total Clients</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{stats.totalCustomers}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-outline-variant">
                <span className="material-symbols-outlined text-base">group</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">Reg Batteries</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{stats.totalBatteries}</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-outline-variant">
                <span className="material-symbols-outlined text-base">battery_charging_full</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">Open Tickets</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{stats.openComplaints}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                <span className="material-symbols-outlined text-base">assignment_late</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">Resolved</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{stats.closedComplaints}</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0 border border-green-100">
                <span className="material-symbols-outlined text-base">verified</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">SLA Compliance</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{slaSummary.compliancePct}%</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-outline-variant">
                <span className="material-symbols-outlined text-base">percent</span>
              </div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-outline text-xxs font-semibold uppercase tracking-wider block">Client Rating</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black text-on-surface">{stats.satisfactionPct}%</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-outline-variant">
                <span className="material-symbols-outlined text-base font-variation-settings-[('FILL'_1)]">star</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Bento Block */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Monthly Ticket Volumes */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-4">Monthly Ticket Volume</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#00236f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Complaint Model Breakdown */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-4">Product Category Breakdown</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={8} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SLA Status Summary */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-4">SLA Compliance Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                {slaPieData.length === 0 ? (
                  <div className="text-xs text-outline">No open tickets to evaluate.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slaPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {slaPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconSize={8} 
                        iconType="square"
                        wrapperStyle={{ fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Average Resolution Days */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm md:col-span-2">
              <h3 className="text-sm font-bold text-on-surface mb-4">Avg Resolution Speed (Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="days" stroke="#F97316" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Technician Performance */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm lg:col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-on-surface mb-4">Technician Performance Ratings</h3>
              <div className="h-64 overflow-y-auto space-y-3 pr-2">
                {techPerf.map((t) => (
                  <div key={t.technicianId} className="flex justify-between items-center border-b border-outline-variant/30 pb-2 text-xs">
                    <div>
                      <div className="font-bold text-on-surface">{t.name}</div>
                      <div className="text-[10px] text-outline font-semibold">Resolved: {t.resolved} | Speed: {t.avgDays}d</div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-secondary px-2 py-0.5 rounded font-bold">
                      <span className="material-symbols-outlined text-xs font-variation-settings-[('FILL'_1)]">star</span> {t.avgRating}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ticket ID, client name, description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-on-surface bg-surface-container-low"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant focus:outline-none text-xs font-semibold text-on-surface bg-surface-container-low"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant focus:outline-none text-xs font-semibold text-on-surface bg-surface-container-low"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Complaints Data Table */}
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-8">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-base font-bold text-on-surface">Support Tickets Control Room</h2>
            <span className="text-xs text-outline font-semibold">{filteredTickets.length} matching tickets</span>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-16 text-center text-outline text-sm">
              No tickets matched the active search and filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-outline uppercase tracking-wider">
                    <th className="py-3 px-5">Ticket ID</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Product Serial</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">SLA Timer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-surface-container-low/35 transition-colors">
                      <td className="py-4 px-5 font-extrabold text-on-surface">{ticket.complaintId}</td>
                      <td className="py-4 px-4 font-semibold text-on-surface">
                        {ticket.customerId?.name}
                        <span className="block text-[10px] text-on-surface-variant font-normal">{ticket.customerId?.phone}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-on-surface">{ticket.batteryId?.model}</span>
                        <span className="block text-[10px] font-mono text-outline">{ticket.batteryId?.serialNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                          ticket.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                          ticket.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <SlaBadge
                          createdAt={ticket.createdAt}
                          priority={ticket.priority}
                          status={ticket.status}
                          resolvedAt={ticket.resolvedAt}
                          slaBreached={ticket.slaBreached}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider ${
                          ticket.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          ticket.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          ticket.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-on-surface">
                        {ticket.technicianId?.name || (
                          <span className="text-outline italic font-normal">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                        {/* Assignment */}
                        {['Submitted', 'Assigned'].includes(ticket.status) && (
                          <button
                            onClick={() => handleOpenAssign(ticket._id, ticket.complaintId)}
                            className="bg-primary text-on-primary px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-primary-container transition-colors"
                          >
                            Assign
                          </button>
                        )}
                        
                        {/* Escalation */}
                        {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && ticket.priority !== 'Critical' && (
                          <button
                            onClick={() => handleEscalate(ticket._id)}
                            className="bg-secondary text-on-secondary px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-secondary-container transition-colors"
                            title="Escalate priority one level"
                          >
                            Escalate
                          </button>
                        )}

                        {/* Closure */}
                        {ticket.status === 'Resolved' && (
                          <button
                            onClick={() => handleClose(ticket._id)}
                            className="bg-green-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-green-800 transition-colors"
                          >
                            Close
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/complaints/${ticket._id}`)}
                          className="bg-surface-container-high text-on-surface px-2.5 py-1 rounded-md text-[10px] font-bold hover:bg-outline-variant/30 transition-colors"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleDelete(ticket._id)}
                          className="text-outline hover:text-error transition-colors p-1"
                          title="Delete ticket"
                        >
                          <span className="material-symbols-outlined text-sm align-middle">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Assign Technician Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-outline-variant relative text-left">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Assign Support Technician</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Dispatch a certified support engineer for ticket <strong className="text-on-surface">{assignModal.complaintTextId}</strong>.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Available Technicians</label>
                {technicians.length === 0 ? (
                  <div className="text-xs text-error font-medium p-2 bg-red-50 border border-red-100 rounded-lg">
                    No active technicians.
                  </div>
                ) : (
                  <select
                    value={assignModal.technicianId}
                    onChange={(e) => setAssignModal(prev => ({ ...prev, technicianId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  >
                    {technicians.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-surface-container-high hover:bg-outline-variant/35 text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || technicians.length === 0}
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl transition-colors shadow-sm hover:bg-primary-container"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
