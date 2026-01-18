import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { X, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';
import { GithubIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setVerificationSent(false);
      setPassword('');
    }
  }, [isOpen, isLogin]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Redirect back to the current URL after email confirmation
            emailRedirectTo: window.location.origin, 
          }
        });
        if (error) throw error;
        
        // If session is null after sign up, email verification is required
        if (data.session) {
          onClose(); 
        } else if (data.user) {
          setVerificationSent(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      // Redirect will happen automatically
    } catch (err: any) {
      setError(err.message || "GitHub login failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {verificationSent ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-primary mb-2">Check your email</h2>
            <p className="text-muted mb-6">
              We've sent a confirmation link to <span className="font-medium text-primary">{email}</span>. Please click the link to verify your account and sign in.
            </p>
            <button 
              onClick={() => {
                setVerificationSent(false);
                setIsLogin(true);
              }}
              className="w-full bg-surface-hover border border-border text-primary font-medium py-2.5 rounded-xl hover:bg-muted/10 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-primary mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-muted mb-6">
              {isLogin ? 'Sign in to access your search history' : 'Sign up to save your conversations'}
            </p>

            <div className="space-y-4">
              <button 
                onClick={handleGithubLogin}
                className="w-full bg-[#24292e] hover:bg-[#24292e]/90 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <GithubIcon className="w-5 h-5" />
                Continue with GitHub
              </button>

              <div className="relative flex items-center justify-center">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-border"></div>
                 </div>
                 <span className="relative bg-surface px-4 text-xs text-muted font-medium uppercase tracking-wider">
                   Or continue with email
                 </span>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 pl-10 pr-4 text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl py-2 pl-10 pr-4 text-primary focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-background font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
              </form>
            </div>

            <div className="mt-6 text-center text-sm text-muted">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};