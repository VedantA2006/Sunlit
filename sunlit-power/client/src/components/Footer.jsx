import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg tracking-wider">SUNLIT POWER PVT LTD</span>
              <span className="text-slate-600">|</span>
              <span className="text-sm">Battery Service & Support Portal</span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-slate-500">
              <span>Laxmi Avenue, Commercial Building - B, Office No. B-503&504, Near Edenn Tower, Wakad, Pune, Maharashtra - 411057</span>
              <div className="flex gap-4">
                <a href="tel:+918956225134" className="hover:text-white transition-colors">📞 +91 89562 25134</a>
                <a href="mailto:info@arenq.co.in" className="hover:text-white transition-colors">✉️ info@arenq.co.in</a>
              </div>
            </div>
          </div>
          
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="mailto:info@arenq.co.in" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs gap-4">
          <p>&copy; {new Date().getFullYear()} Sunlit Power Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-500">ISO 9001:2015 &amp; ISO 14001:2015 Certified Battery Manufacturer</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
