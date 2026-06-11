import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Phone, Lock, ChevronRight, AlertCircle, ShieldAlert } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [role, setRole] = useState('customer'); // 'customer', 'technician', 'admin'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getDashboardRedirect(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const getDashboardRedirect = (userRole) => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'technician') return '/technician/dashboard';
    return '/customer/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const loginIdentifier = loginMethod === 'email' ? email : phone;
    if (!loginIdentifier || !password) {
      setError('Please fill out all credentials.');
      return;
    }

    setIsLoading(true);
    const result = await login(loginIdentifier, password, role);
    setIsLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-6">
          
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal Sign In</h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Access your Sunlit Power Pvt Ltd support dashboard
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-brand-error text-xs rounded-xl border border-red-100 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Role selector tab */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            {['customer', 'technician', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 px-1.5 rounded-lg capitalize transition-all ${
                  role === r ? 'bg-white text-brand-blue shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Method Toggle */}
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`font-semibold ${loginMethod === 'email' ? 'text-brand-blue underline' : 'text-slate-400'}`}
              >
                Use Email
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`font-semibold ${loginMethod === 'phone' ? 'text-brand-blue underline' : 'text-slate-400'}`}
              >
                Use Phone
              </button>
            </div>

            {/* Credential Field */}
            {loginMethod === 'email' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/35 transition-all text-sm text-slate-700 font-medium"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-XXXXX-XXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/35 transition-all text-sm text-slate-700 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/35 transition-all text-sm text-slate-700 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-blue text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-brand-blue/15 disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign In <ChevronRight className="w-4.5 h-4.5" /></>
              )}
            </button>
          </form>

          {role === 'customer' && (
            <div className="text-center pt-2 text-sm text-slate-500">
              New customer?{' '}
              <Link to="/signup" className="text-brand-blue font-bold hover:underline">
                Create an account
              </Link>
            </div>
          )}

          {/* Quick Demo Assist details */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Seed Login Credentials
              </span>
              <ul className="text-xxs text-slate-500 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-700">Admin:</strong> admin@sunlitpower.in / Admin@123</li>
                <li><strong className="text-slate-700">Tech:</strong> tech1@sunlitpower.in / Tech@123</li>
                <li><strong className="text-slate-700">Customer:</strong> ramesh.kumar@example.com / Customer@123</li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
