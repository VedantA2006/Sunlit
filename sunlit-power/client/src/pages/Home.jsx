import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import { formatDate } from '../utils/formatDate';

export const Home = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setIsLoading(true);
    setError('');
    setComplaint(null);
    try {
      const response = await api.get(`/complaints/track/${ticketId.trim()}`);
      setComplaint(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint ticket not found. Please verify the ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'technician') return '/technician/dashboard';
    return '/customer/dashboard';
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* TopNavBar Shared Component */}
      <nav className="bg-surface/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-outline-variant w-full">
        <div className="flex justify-between items-center w-full px-container-padding max-w-[1440px] mx-auto h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">bolt</span>
            <span className="font-display-lg text-headline-md text-primary font-bold tracking-tight">ARENQ</span>
          </Link>
          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-primary font-bold border-b-2 border-secondary pb-1 font-label-md text-label-md transition-colors hover:bg-surface-container-low px-2 rounded-t" to="/">Home</Link>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md hover:bg-surface-container-low px-2 py-1 rounded" href="#about">About</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md hover:bg-surface-container-low px-2 py-1 rounded" href="#products">Products</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md hover:bg-surface-container-low px-2 py-1 rounded" href="#services">Services</a>
          </div>
          {/* Trailing Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  to={getDashboardLink()}
                  className="text-primary font-bold font-label-md text-label-md hover:bg-surface-container-low px-3 py-2 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low px-4 py-2 rounded-md font-label-md text-label-md font-bold transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-secondary text-on-secondary px-6 py-2 rounded-md font-label-md text-label-md font-bold hover:bg-secondary-container transition-all active:scale-95 shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] min-h-[700px] flex items-center relative overflow-hidden px-container-padding py-20">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-fixed-dim rounded-full mix-blend-multiply filter blur-[128px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary-fixed rounded-full mix-blend-multiply filter blur-[128px] opacity-10 translate-y-1/3 -translate-x-1/4"></div>
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-center relative z-10">
          {/* Left Content */}
          <div className="text-white space-y-6 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 font-label-md text-label-md">
              <span className="text-secondary-fixed">⚡</span>
              <span className="text-primary-fixed">India's Most Trusted Battery Manufacturer</span>
            </div>
            <h1 className="font-display-lg text-display-lg text-white">Powering Every Journey with Reliable Energy</h1>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim opacity-90 max-w-xl">
              Industrial-grade battery solutions engineered for peak performance, longevity, and sustainability. Supporting telecom, EV, solar, and industrial sectors across the nation.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to={isAuthenticated ? "/customer/dashboard" : "/login"} className="bg-secondary text-on-secondary px-8 py-3 rounded-md font-label-md text-label-md font-bold hover:bg-secondary-container transition-all shadow-lg flex items-center gap-2">
                Register Your Battery
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <button
                onClick={() => document.getElementById('tracker-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-white/30 text-white px-8 py-3 rounded-md font-label-md text-label-md font-bold hover:bg-white/10 hover:border-white transition-all flex items-center gap-2"
              >
                Track Complaint
                <span className="material-symbols-outlined text-sm">troubleshoot</span>
              </button>
            </div>
          </div>
          {/* Right Animation */}
          <div className="relative h-[350px] w-full lg:h-[450px] flex justify-center items-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full filter blur-[80px] animate-pulse"></div>
            <div className="w-full h-full object-contain relative z-10 drop-shadow-2xl" id="animated-svg-ANIMATION_1" style={{ display: 'block' }}>
              <svg className="w-full h-full" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                <style>{`
                  @keyframes fillBar {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                  }
                  @keyframes pulseLightning {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                  }
                  @keyframes floatDot {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(10px, -10px); }
                  }
                  @keyframes blinkText {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                  }
                `}</style>
                {/* Battery Body */}
                <rect fill="none" height="140" rx="15" stroke="white" stroke-width="3" width="280" x="50" y="80"></rect>
                {/* Battery Cap */}
                <path d="M330 120 Q345 120 345 130 L345 170 Q345 180 330 180" fill="none" stroke="white" stroke-width="3"></path>
                {/* Bars */}
                <rect fill="#F97316" height="110" rx="4" style={{ animation: 'fillBar 3s infinite', animationDelay: '0s' }} width="45" x="65" y="95"></rect>
                <rect fill="#F97316" height="110" rx="4" style={{ animation: 'fillBar 3s infinite', animationDelay: '0.5s' }} width="45" x="120" y="95"></rect>
                <rect fill="#F97316" height="110" rx="4" style={{ animation: 'fillBar 3s infinite', animationDelay: '1s' }} width="45" x="175" y="95"></rect>
                <rect fill="#F97316" height="110" rx="4" style={{ animation: 'fillBar 3s infinite', animationDelay: '1.5s' }} width="45" x="230" y="95"></rect>
                <rect fill="#F97316" height="110" rx="4" style={{ animation: 'fillBar 3s infinite', animationDelay: '2s' }} width="30" x="285" y="95"></rect>
                {/* Lightning Bolt */}
                <path d="M210 110 L180 150 L200 150 L190 190 L220 150 L200 150 Z" fill="#F97316" style={{ animation: 'pulseLightning 2s infinite', transformOrigin: '200px 150px' }}></path>
                {/* Floating Dots */}
                <circle cx="40" cy="60" fill="#F97316" opacity="0.6" r="4" style={{ animation: 'floatDot 4s infinite' }}></circle>
                <circle cx="360" cy="240" fill="#F97316" opacity="0.4" r="3" style={{ animation: 'floatDot 5s infinite reverse' }}></circle>
                <circle cx="340" cy="50" fill="#F97316" opacity="0.5" r="5" style={{ animation: 'floatDot 3s infinite' }}></circle>
                {/* Charged Text */}
                <text fill="#F97316" font-family="Inter, sans-serif" font-size="16" font-weight="bold" style={{ animation: 'blinkText 1.5s infinite' }} text-anchor="middle" x="200" y="260">100% CHARGED</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* TICKET TRACKER SECTION */}
      <section id="tracker-section" className="relative -mt-16 max-w-4xl mx-auto w-full px-container-padding z-20">
        <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-6 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-bold text-on-surface">Instant Complaint Status Tracker</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Check the resolution progress, status, and SLA timeline of your ticket without logging in.
            </p>
          </div>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Enter Ticket ID (e.g., CMP-20260601-0001)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary transition-all text-on-surface bg-surface-container-low font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary-container transition-colors disabled:bg-slate-400 flex items-center justify-center gap-2 min-w-[120px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Track'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-error-container/30 text-error text-sm rounded-lg flex items-center gap-2 border border-error-container">
              <span className="material-symbols-outlined text-sm">warning</span>
              {error}
            </div>
          )}

          {/* Tracked Complaint Results Display */}
          {complaint && (
            <div className="mt-6 border-t border-outline-variant/50 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-on-surface-variant">TICKET DETAILS</span>
                  <h3 className="text-lg font-bold text-on-surface">{complaint.complaintId}</h3>
                </div>
                <div className="flex gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {complaint.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    complaint.priority === 'Critical' ? 'bg-error-container text-on-error-container font-semibold' :
                    complaint.priority === 'High' ? 'bg-secondary-fixed text-on-secondary-fixed font-semibold' :
                    complaint.priority === 'Medium' ? 'bg-surface-container text-on-surface font-semibold' :
                    'bg-surface-container-low text-on-surface-variant'
                  }`}>
                    {complaint.priority} Priority
                  </span>
                </div>
              </div>

              {/* Status Header */}
              <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs text-on-surface-variant">Current Status</span>
                  <div className="text-base font-bold text-on-surface">{complaint.status}</div>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant">Battery Model</span>
                  <div className="text-sm font-semibold text-on-surface">{complaint.batteryModel || (complaint.batteryId?.model)}</div>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant">Registered On</span>
                  <div className="text-sm font-semibold text-on-surface">{formatDate(complaint.createdAt)}</div>
                </div>
              </div>

              {/* Timeline Flow */}
              <div className="relative pl-6 border-l-2 border-outline-variant space-y-6">
                {complaint.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle icon */}
                    <div className="absolute -left-[37px] top-0.5 bg-surface-container-lowest p-1 rounded-full border-2 border-outline-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">{step.status}</span>
                        <span className="text-xs text-on-surface-variant font-mono">{formatDate(step.date)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="max-w-[1440px] mx-auto px-container-padding py-16 w-full">
        <div className="bg-surface rounded-xl border border-outline-variant/30 p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-outline-variant/50">
            <div className="flex flex-col items-center text-center px-4">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">battery_charging_full</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">10,000+</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Batteries Sold</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <div className="bg-secondary/10 p-3 rounded-full mb-3">
                <span className="material-symbols-outlined text-secondary text-3xl font-variation-settings-[('FILL'_1)]">store</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">500+</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Service Centers</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">thumb_up</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">98%</h3>
              <p class="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Customer Satisfaction</p>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <div className="bg-secondary/10 p-3 rounded-full mb-3">
                <span className="material-symbols-outlined text-secondary text-3xl font-variation-settings-[('FILL'_1)]">map</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">28</h3>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 px-container-padding max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 text-left">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-bold">About Arenq</span>
            <h2 className="font-display-lg text-display-lg text-on-surface leading-tight">Pioneering Clean Energy Solutions Since 2010</h2>
            <div className="space-y-4 font-body-md text-body-md text-on-surface-variant border-l-4 border-primary pl-6 py-2">
              <p>
                Established over a decade ago, Arenq has grown to become a cornerstone in India's energy storage sector. We specialize in designing and manufacturing robust batteries that withstand the rigorous demands of various industries.
              </p>
              <p>
                Our commitment to innovation is driven by a deep understanding of energy needs in emerging markets. We leverage advanced materials and engineering practices to ensure every unit delivers uncompromised reliability and superior lifecycle value.
              </p>
              <p>
                Beyond manufacturing, our comprehensive network of over 500 service centers ensures that our clients receive unparalleled support, making us a true partner in their operational success.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-primary text-4xl mb-4 opacity-80">event</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">2010</h4>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Year Established</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm hover:-translate-y-1 transition-transform mt-8">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4 opacity-80">public</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">Pan-India</h4>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">28 States Covered</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-primary text-4xl mb-4 opacity-80">engineering</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">500+</h4>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Service Centers</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm hover:-translate-y-1 transition-transform mt-8">
              <span className="material-symbols-outlined text-secondary text-4xl mb-4 opacity-80">groups</span>
              <h4 className="font-headline-md text-headline-md text-on-surface">50k+</h4>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase mt-1">Happy Customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION SECTION */}
      <section className="bg-tertiary py-24 relative overflow-hidden w-full">
        {/* Abstract BG Elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-[1440px] mx-auto px-container-padding relative z-10 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Mission Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-2xl text-white">
              <div className="bg-primary/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-primary/50">
                <span className="material-symbols-outlined text-primary-fixed text-3xl">ads_click</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white mb-4">Our Mission</h3>
              <p className="font-body-md text-body-md text-primary-fixed-dim mb-6">
                To empower industries and communities with reliable, efficient, and sustainable energy storage solutions through relentless innovation and uncompromising quality.
              </p>
              <ul className="space-y-3 font-body-md text-body-md text-primary-fixed-dim">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-1 text-xl">check_circle</span>
                  Deliver zero-defect industrial batteries.
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-1 text-xl">check_circle</span>
                  Ensure rapid response service nationwide.
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-1 text-xl">check_circle</span>
                  Promote eco-friendly manufacturing practices.
                </li>
              </ul>
            </div>
            {/* Vision Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-2xl text-white">
              <div className="bg-secondary/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-secondary/50">
                <span className="material-symbols-outlined text-secondary-fixed text-3xl">visibility</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-white mb-4">Our Vision</h3>
              <p className="font-body-md text-body-md text-primary-fixed-dim mb-6">
                To be the leading global brand in advanced energy storage, recognized for pioneering technologies that drive the transition towards a sustainable, electrified future.
              </p>
              <ul className="space-y-3 font-body-md text-body-md text-primary-fixed-dim">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed mt-1 text-xl">arrow_forward</span>
                  Expand to international markets by 2026.
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed mt-1 text-xl">arrow_forward</span>
                  Lead R&D in next-gen solid-state tech.
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-fixed mt-1 text-xl">arrow_forward</span>
                  Achieve carbon-neutral operations.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="bg-surface-container-low py-24 w-full">
        <div className="max-w-[1440px] mx-auto px-container-padding w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-bold">Our Capabilities</span>
            <h2 className="font-display-lg text-display-lg text-on-surface mt-2 mb-4">End-to-End Service Ecosystem</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">We provide comprehensive support throughout the lifecycle of your energy solutions, ensuring maximum uptime and efficiency.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* Service Card 1 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-primary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">factory</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Battery Manufacturing</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">State-of-the-art facilities producing high-yield industrial batteries with stringent quality control.</p>
            </div>
            {/* Service Card 2 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-secondary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-2xl">app_registration</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Registration Portal</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Seamless online registration for newly purchased units to activate warranty and support services immediately.</p>
            </div>
            {/* Service Card 3 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-primary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Warranty Support</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Comprehensive warranty coverage with hassle-free claims processing through our dedicated support desk.</p>
            </div>
            {/* Service Card 4 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-secondary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-2xl">health_and_safety</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Health Checks</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Scheduled diagnostic tests and preventive maintenance to maximize the lifespan of your battery fleet.</p>
            </div>
            {/* Service Card 5 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-primary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Complaint Resolution</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">24/7 dedicated support team ensuring rapid response and resolution to technical issues across all regions.</p>
            </div>
            {/* Service Card 6 */}
            <div className="bg-surface p-8 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
              <div className="bg-secondary/5 w-14 h-14 rounded-lg flex items-center justify-center mb-6 group-hover:bg-secondary/10 transition-colors">
                <span className="material-symbols-outlined text-secondary text-2xl">local_shipping</span>
              </div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Service Tracking</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Real-time GPS and status tracking for service requests, replacements, and maintenance dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      <section id="products" className="py-24 bg-surface w-full">
        <div className="max-w-[1440px] mx-auto px-container-padding w-full">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-left">
            <div className="max-w-2xl">
              <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-bold">Industrial Portfolio</span>
              <h2 className="font-display-lg text-display-lg text-on-surface mt-2">Specialized Power Solutions</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {/* Product 1 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-primary/20 text-primary-fixed px-3 py-1 rounded-full font-caption text-caption border border-primary/30 backdrop-blur-sm">TX-Series</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">cell_tower</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">Telecom Batteries</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">High-density deep cycle solutions designed for telecom towers.</p>
              </div>
            </div>
            {/* Product 2 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-secondary/20 text-secondary-fixed px-3 py-1 rounded-full font-caption text-caption border border-secondary/30 backdrop-blur-sm">EV-Pro</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">electric_car</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">EV Solutions</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">Advanced lithium-ion packs for electric mobility and fleet vehicles.</p>
              </div>
            </div>
            {/* Product 3 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-primary/20 text-primary-fixed px-3 py-1 rounded-full font-caption text-caption border border-primary/30 backdrop-blur-sm">SOL-Max</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">solar_power</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">Solar Storage</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">Robust tubular gel batteries optimized for off-grid solar installations.</p>
              </div>
            </div>
            {/* Product 4 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-secondary/20 text-secondary-fixed px-3 py-1 rounded-full font-caption text-caption border border-secondary/30 backdrop-blur-sm">IND-Heavy</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">forklift</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">Industrial Range</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">Heavy-duty traction batteries for forklifts and material handling.</p>
              </div>
            </div>
            {/* Product 5 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-primary/20 text-primary-fixed px-3 py-1 rounded-full font-caption text-caption border border-primary/30 backdrop-blur-sm">ROB-Core</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">precision_manufacturing</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">Robotics Power</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">Compact, high-discharge power units for automated systems.</p>
              </div>
            </div>
            {/* Product 6 */}
            <div className="bg-tertiary rounded-2xl overflow-hidden shadow-lg border border-outline-variant/10 relative group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-secondary/20 text-secondary-fixed px-3 py-1 rounded-full font-caption text-caption border border-secondary/30 backdrop-blur-sm">AGR-Tough</span>
              </div>
              <div className="p-8 pt-12">
                <span className="material-symbols-outlined text-white text-5xl mb-6 opacity-90">agriculture</span>
                <h4 className="font-headline-md text-headline-md text-white mb-2">Agriculture</h4>
                <p className="font-body-md text-body-md text-tertiary-fixed-dim mb-8 h-12">Vibration-resistant batteries built for tractors and heavy farm equipment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Shared Component */}
      <footer className="bg-surface-container-highest border-t border-outline-variant w-full mt-auto text-left">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-lg px-container-padding py-stack-lg max-w-[1440px] mx-auto text-on-surface">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl font-variation-settings-[('FILL'_1)]">bolt</span>
              <span className="font-headline-md text-primary font-bold">ARENQ</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Powering Every Journey with Reliable Energy. India's most trusted manufacturer of industrial battery solutions.
            </p>
          </div>
          {/* Quick Links */}
          <div>
            <h4 className="font-label-md text-label-md font-bold mb-4 uppercase text-on-surface-variant tracking-wider">Quick Links</h4>
            <ul className="space-y-2 font-label-md text-label-md">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#about">About Us</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#products">Products</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors opacity-80 hover:opacity-100" href="#services">Services</a></li>
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="font-label-md text-label-md font-bold mb-4 uppercase text-on-surface-variant tracking-wider">Contact</h4>
            <ul className="space-y-3 font-body-md text-body-md text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                <span>Plot No 45, Industrial Area Phase 2, New Delhi, 110020</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">call</span>
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">mail</span>
                <span>support@arenq.com</span>
              </li>
            </ul>
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="border-t border-outline-variant/50 px-container-padding py-4 text-center flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto">
          <p className="font-caption text-caption text-on-surface-variant">© 2026 ARENQ PRIVATE LIMITED. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-2 md:mt-0 font-caption text-caption text-on-surface-variant">
            <span>Proudly Made in India</span>
            <span className="text-secondary text-lg">🇮🇳</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
