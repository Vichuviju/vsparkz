import React, { useState } from 'react';
import { Check, Star, Crown, Zap, ShieldAlert, LogOut } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function SelectPlan() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requestingVip, setRequestingVip] = useState(false);
  const [vipRequested, setVipRequested] = useState(false);

  const handleStripeCheckout = async (planName, price) => {
    try {
      setLoading(true);
      const { data } = await api.post('/admin/payments/subscription', {
        plan_name: planName,
        amount: price,
      });

      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create Stripe Checkout session');
      }
      
    } catch (error) {
      console.error(error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVipRequest = async () => {
    try {
      setRequestingVip(true);
      await api.post('/admin/vip-requests', { reason: 'Requested from Select Plan UI' });
      toast.success('VIP Access Request sent successfully! Admin will review your account.');
      
      setVipRequested(true);
      
      // Update local storage so UI updates instantly on next load
      const updatedUser = { ...user, subscription_status: 'vip_pending' };
      localStorage.setItem('vsparkz_user', JSON.stringify(updatedUser));
      
      // Switch view after a short delay
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to request VIP Access.');
    } finally {
      setRequestingVip(false);
    }
  };

  const isVipPending = user?.subscription_status === 'vip_pending';
  const isExpired = user?.subscription_status === 'expired';

  return (
    <div className="min-h-screen bg-slate-900 selection:bg-blue-500 selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">V-Sparkz</span>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-12 pb-24 px-4">
        
        {isExpired && (
          <div className="mb-8 flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-bounce">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <p className="text-sm font-bold text-red-200">Your subscription has expired. Please renew to regain access.</p>
          </div>
        )}

        {isVipPending ? (
          <div className="text-center max-w-xl mx-auto mt-20">
            <div className="w-24 h-24 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">VIP Request Pending</h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              Your request for VIP Enterprise access is currently being reviewed by our Super Admins. You will receive an email once approved.
            </p>
            <button onClick={logout} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black shadow-xl hover:scale-105 transition-transform">
              Return to Login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Unlock the Ultimate <br className="hidden md:block"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Marketing OS</span></h1>
              <p className="text-lg md:text-xl text-slate-400 font-medium">
                Select a plan to access CRM, Talent Management, Landing Builders, and SEO tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
              
              {/* Pro Plan */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col hover:border-white/20 transition-colors">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-2">Professional</h3>
                  <p className="text-sm text-slate-400 font-medium">Perfect for growing agencies.</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black text-white">₹2,999</span>
                  <span className="text-slate-500 font-medium">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Full CRM & Lead Management', 'Influencer & Freelancer Network', 'Advanced SEO Analyzer', 'Social Media Planner', 'Standard Landing Builder'].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleStripeCheckout('Professional', 2999)}
                  disabled={loading}
                  className="w-full py-4 bg-white text-slate-900 rounded-xl font-black shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  Pay with Stripe
                </button>
              </div>

              {/* Business Plan - Highlighted */}
              <div className="bg-gradient-to-b from-blue-600/20 to-purple-600/10 border border-blue-500/30 rounded-3xl p-8 backdrop-blur-xl flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-blue-400 fill-current" /> Business</h3>
                  <p className="text-sm text-blue-200/70 font-medium">For established marketing teams.</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-black text-white">₹6,999</span>
                  <span className="text-blue-200/50 font-medium">/month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Everything in Professional', 'Unlimited Invoices & Quotations', 'AI Email Automation Workflows', 'Custom Service Packages', 'Advanced Campaign Analytics', 'Premium Landing Builder'].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-blue-300" />
                      </div>
                      <span className="text-sm text-blue-50 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleStripeCheckout('Business', 6999)}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-black shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  Pay with Stripe
                </button>
              </div>

              {/* VIP Plan */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col hover:border-white/20 transition-colors">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> VIP Enterprise</h3>
                  <p className="text-sm text-slate-400 font-medium">Exclusive access, by approval only.</p>
                </div>
                <div className="mb-8">
                  <span className="text-3xl font-black text-white">Custom</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {['Dedicated Account Manager', 'Custom API Integrations', 'White-labeled Workflows', 'Priority 24/7 Support', 'Unlimited Team Members'].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleVipRequest}
                  disabled={requestingVip || vipRequested}
                  className="w-full py-4 bg-transparent border border-amber-500/50 text-amber-400 rounded-xl font-black hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {vipRequested ? 'Request Submitted' : requestingVip ? 'Requesting...' : 'Request VIP Access'}
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
