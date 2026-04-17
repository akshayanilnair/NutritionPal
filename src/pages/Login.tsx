import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Phone, Lock, Loader2, ArrowLeft } from 'lucide-react';

export const Login = () => {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail, setupRecaptcha, loginWithPhone, verifyPhoneCode } = useAuth();
  const [mode, setMode] = useState<'options' | 'email' | 'phone'>('options');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'phone') {
      setupRecaptcha('recaptcha-container');
    }
  }, [mode, setupRecaptcha]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signupWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      await loginWithPhone(formattedPhone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyPhoneCode(otp);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/40 backdrop-blur-sm p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-xl overflow-hidden relative"
      >
        {mode !== 'options' && (
          <button 
            onClick={() => { setMode('options'); setError(''); setOtpSent(false); }}
            className="absolute top-6 left-6 p-2 text-muted-foreground/70 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="p-8 pt-12 text-center">
          <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-spice">
            N
          </div>
          <h1 className="text-3xl font-serif italic font-bold text-foreground font-bold mb-2 tracking-tight">NutritionPal</h1>
          <p className="text-muted-foreground mb-8 text-sm">Your AI-powered Indian Nutrition Tracker</p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {mode === 'options' && (
            <div className="space-y-3">
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-card/80 backdrop-blur-md lovable-gradient-card border border-border text-foreground font-medium py-3 px-4 rounded-xl hover:bg-background/40 backdrop-blur-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
              
              <button
                onClick={() => setMode('email')}
                className="w-full flex items-center justify-center gap-3 bg-card/80 backdrop-blur-md lovable-gradient-card border border-border text-foreground font-medium py-3 px-4 rounded-xl hover:bg-background/40 backdrop-blur-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <Mail className="w-5 h-5 text-muted-foreground" />
                Continue with Email
              </button>

              <button
                onClick={() => setMode('phone')}
                className="w-full flex items-center justify-center gap-3 bg-card/80 backdrop-blur-md lovable-gradient-card border border-border text-foreground font-medium py-3 px-4 rounded-xl hover:bg-background/40 backdrop-blur-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <Phone className="w-5 h-5 text-muted-foreground" />
                Continue with Phone
              </button>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white font-medium py-3 px-4 rounded-xl hover:scale-[1.02] transition-transform text-white transition-colors disabled:opacity-50 flex justify-center mt-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}

          {mode === 'phone' && (
            <div className="text-left">
              <div id="recaptcha-container"></div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white font-medium py-3 px-4 rounded-xl hover:scale-[1.02] transition-transform text-white transition-colors disabled:opacity-50 flex justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Enter OTP</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none text-center tracking-widest text-lg"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white font-medium py-3 px-4 rounded-xl hover:scale-[1.02] transition-transform text-white transition-colors disabled:opacity-50 flex justify-center"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Verify OTP'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
        <div className="bg-muted p-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </motion.div>
    </div>
  );
};
