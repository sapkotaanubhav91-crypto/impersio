
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2, Check, Edit3, Apple, HelpCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { ImpersioLogo } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'welcome' | 'profile' | 'finish';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setEmail('');
      setUsername('');
      setStep('welcome');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = async () => {
    if (step === 'welcome') {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      setStep('profile');
      setError(null);
    } else if (step === 'profile') {
      if (!username) {
        setError('Please enter a username');
        return;
      }
      setLoading(true);
      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 800));
      const { error } = await authService.signUp(email, 'password123', username); // Simple password for simulation
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        await authService.signIn(email, 'password123', true);
        setStep('finish');
        setLoading(false);
      }
    } else if (step === 'finish') {
      window.location.reload();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F1F0EC]/80 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[580px] bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-2xl border border-gray-100 dark:border-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-border/40">
           <div className="flex items-center gap-2">
             <ImpersioLogo className="w-5 h-5 text-primary opacity-60" />
             <span className="text-[15px] font-bold text-primary">Sign Up</span>
           </div>
           
           {/* Progress Dots */}
           <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'welcome' ? 'w-5 bg-[#1A1A1A]' : 'w-1.5 bg-gray-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'profile' ? 'w-5 bg-[#1A1A1A]' : 'w-1.5 bg-gray-200'}`} />
              <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'finish' ? 'w-5 bg-[#1A1A1A]' : 'w-1.5 bg-gray-200'}`} />
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={handleContinue}
                disabled={loading}
                className="px-6 py-2 bg-[#1c7483] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === 'finish' ? 'Finish' : 'Continue')}
              </button>
              <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
           </div>
        </div>

        <div className="p-12 pb-16 flex flex-col items-center text-center">
          {step === 'welcome' && (
            <div className="w-full max-w-[340px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-[42px] font-medium text-[#1c7483] tracking-tight mb-3">Welcome</h2>
                <p className="text-[15px] text-gray-500 dark:text-muted mb-10">Sign in or sign up to continue</p>
                
                <div className="space-y-3 mb-8">
                   <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="henry@example.com"
                      className="w-full bg-[#f9f9f7] dark:bg-[#262626] border border-gray-100 dark:border-border rounded-full py-3.5 px-6 text-primary focus:outline-none focus:ring-1 focus:ring-[#1c7483] text-center"
                   />
                   {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <button 
                  onClick={handleContinue}
                  className="text-[13px] font-bold text-gray-400 hover:text-primary transition-colors tracking-wide uppercase"
                >
                  Continue with Email
                </button>
            </div>
          )}

          {step === 'profile' && (
             <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500 text-left">
                <h2 className="text-[32px] font-medium text-primary tracking-tight mb-8">Create your account</h2>
                
                <div className="mb-8">
                   <label className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Avatar</label>
                   <div className="relative w-[72px] h-[72px] group cursor-pointer">
                      <div className="w-full h-full rounded-full bg-gray-100 border border-border flex items-center justify-center overflow-hidden">
                         <UserIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-[#262626] rounded-full border border-gray-100 shadow-sm flex items-center justify-center">
                         <Edit3 className="w-3.5 h-3.5 text-primary" />
                      </div>
                   </div>
                </div>

                <div className="w-full">
                   <label className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Username</label>
                   <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="rakesh"
                      className="w-full bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-border rounded-full py-3 px-6 text-primary focus:outline-none focus:ring-1 focus:ring-[#1c7483]"
                   />
                   {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>
             </div>
          )}

          {step === 'finish' && (
             <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-8">
                   <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-[32px] font-medium text-primary tracking-tight mb-2">All set!</h2>
                <p className="text-[15px] text-muted mb-8 text-center max-w-sm">Your account has been successfully created. Welcome to Impersio.</p>
                <button 
                  onClick={handleContinue}
                  className="px-8 py-3 bg-[#1c7483] text-white rounded-full font-bold shadow-lg shadow-[#1c7483]/20 hover:scale-105 transition-transform"
                >
                  Start Exploring
                </button>
             </div>
          )}
        </div>

        {/* Modal Footer (Decorative/Help) */}
        {step !== 'finish' && (
           <div className="absolute bottom-8 right-8">
              {/* Fix: Added HelpCircle to imports */}
              <button className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-lg">
                 <HelpCircle className="w-5 h-5" />
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
