import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Shield, CheckCircle2, User, Phone, MapPin, Cpu, Image as ImageIcon, Star, FileText } from 'lucide-react';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SlaBadge from '../components/SlaBadge';
import { formatDate } from '../utils/formatDate';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [feedback, setFeedback] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComplaintDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/complaints/${id}`);
      setComplaint(response.data);

      // Try fetching feedback for this complaint
      try {
        const feedRes = await api.get(`/feedback/complaint/${id}`);
        setFeedback(feedRes.data);
      } catch (feedErr) {
        // Safe to ignore if feedback doesn't exist yet
        setFeedback(null);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve complaint ticket details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const handleBack = () => {
    if (user?.role === 'admin') navigate('/admin/dashboard');
    else if (user?.role === 'technician') navigate('/technician/dashboard');
    else navigate('/customer/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Loading Ticket Details...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-grow max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-800">Error Occurred</h2>
          <p className="text-xs text-slate-500 mt-2">{error || 'Complaint not found.'}</p>
          <button
            onClick={handleBack}
            className="mt-6 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000/uploads';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Ticket Title Block */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{complaint.complaintId}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                complaint.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                complaint.status === 'Assigned' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                complaint.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-100' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {complaint.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Registered on: {formatDate(complaint.createdAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Priority:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              complaint.priority === 'Critical' ? 'bg-red-50 text-red-800 border-red-200' :
              complaint.priority === 'High' ? 'bg-orange-50 text-orange-800 border-orange-200' :
              complaint.priority === 'Medium' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
              'bg-slate-50 text-slate-800 border-slate-200'
            }`}>
              {complaint.priority}
            </span>
            <SlaBadge
              createdAt={complaint.createdAt}
              priority={complaint.priority}
              status={complaint.status}
              resolvedAt={complaint.resolvedAt}
              slaBreached={complaint.slaBreached}
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Column 1: Details & Images */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Complaint Details</h2>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Problem Type</span>
                  <span className="font-bold text-slate-800">{complaint.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Assigned Service Tech</span>
                  <span className="font-bold text-slate-800">{complaint.technicianId?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-xs block mb-1">Issue Description</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed font-medium">
                  {complaint.description}
                </p>
              </div>

              {/* Attachments */}
              {complaint.images && complaint.images.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs block mb-2 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Attached Proof & Images ({complaint.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.images.map((img, idx) => (
                      <a 
                        key={idx} 
                        href={`${imageBaseUrl}/${img}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative aspect-video bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow block"
                      >
                        <img 
                          src={`${imageBaseUrl}/${img}`} 
                          alt={`Upload ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Rating Feedback Card */}
            {feedback && (
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-brand-orange text-brand-orange" /> Customer Feedback & Ratings
                </h2>

                <div className="grid sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-1">Overall Service Support</span>
                    <div className="flex gap-1 text-brand-orange">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= feedback.serviceRating ? 'fill-brand-orange' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Technician Skill/Conduct</span>
                    <div className="flex gap-1 text-brand-orange">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= feedback.techRating ? 'fill-brand-orange' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1 font-semibold">Client Comments</span>
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "{feedback.comments}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Client & Product Info + Timeline */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Client Contact Info</h2>
              
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{complaint.customerId?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${complaint.customerId?.phone}`} className="hover:underline text-brand-blue font-semibold">
                    {complaint.customerId?.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">{complaint.customerId?.address}</span>
                </div>
              </div>
            </div>

            {/* Battery Info Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Battery Product Details</h2>
              
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold">{complaint.batteryId?.model} Category</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono font-semibold">{complaint.batteryId?.serialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Purchased: {new Date(complaint.batteryId?.purchaseDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-100 text-xxs font-semibold">
                  <Shield className="w-3.5 h-3.5" /> {complaint.batteryId?.warrantyYears} Years Manufacturer Warranty
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">Complaint Activity Timeline</h2>
              
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {complaint.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[32px] top-0.5 bg-white p-0.5 rounded-full border-2 border-brand-blue">
                      <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{step.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(step.date)}</span>
                      </div>
                      <p className="text-xxs text-slate-500 mt-0.5 leading-relaxed">{step.note}</p>
                      {step.updatedBy && (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                          By: {step.updatedBy.name} ({step.updatedBy.role})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ComplaintDetails;
