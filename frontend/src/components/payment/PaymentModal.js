import React, { useState } from 'react';
import { X, Check, Zap, Crown, Download, Sparkles, Shield, Star } from 'lucide-react';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'single',
    name: 'Starter Plan',
    price: 49,
    credits: 10,
    downloads: 3,
    atsChecks: 10,
    description: 'One-time - Best for quick applications',
    features: ['Download PDF (3 times)', 'All Templates', 'Live Preview', '10 ATS Checks', '10 AI Credits'],
    notIncluded: ['Unlimited Downloads', 'Priority Support'],
    popular: false,
    period: 'one-time',
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 99,
    credits: 50,
    downloads: -1,
    atsChecks: -1,
    description: 'Monthly - Best for serious job seekers',
    features: ['Unlimited Downloads', 'All Templates', 'Live Preview', 'Unlimited ATS Checks', '50 AI Credits/mo', 'Priority Support'],
    notIncluded: [],
    popular: true,
    period: '/month',
  },
];

export default function PaymentModal({ onClose, onSuccess, onAutoDownload, reason = 'payment' }) {
  const [loading, setLoading] = useState(null);

  const getMessage = () => {
    if (reason === 'credits') {
      return "You've used your free AI checks";
    } else if (reason === 'completion') {
      return "Your resume is ready! Upgrade to download and enhance more.";
    } else if (reason === 'ats') {
      return "Unlock to get more AI ATS checks";
    } else if (reason === 'download') {
      return "Download your resume";
    }
    return "Unlock premium features";
  };

  const handlePaymentSuccess = (result) => {
    if (result.success) {
      onSuccess(result);
    }
  };

const handlePayment = async (planId) => {
    setLoading(planId);
    try {
      const { orderId, keyId, amount, currency } = await paymentAPI.createOrder({ plan_type: planId });
      
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'ResumeAI',
        description: planId === 'pro' ? 'Pro Plan - Monthly' : 'Single Download',
        order_id: orderId,
        handler: async (response) => {
          try {
            const result = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planId,
            });
            if (result.success) {
              toast.success(planId === 'pro' ? 'Pro plan activated!' : 'Download unlocked!');
              handlePaymentSuccess(result);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
          setLoading(null);
        },
        prefill: { name: 'Resume Builder User' },
        theme: { color: '#3b82f6' },
      };
      
      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Payment gateway not loaded');
      }
    } catch (err) {
      toast.error('Failed to create order');
      setLoading(null);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Gradient Header */}
        <div className="h-1.5 bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#0ea5e9] flex-shrink-0"></div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={18} className="text-slate-500" />
        </button>

        <div className="p-5 overflow-y-auto">
          {/* Title Section */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] mb-3 shadow-lg shadow-blue-500/25">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{reason === 'ats' ? 'ATS Checks Limit Reached' : 'Unlock Premium Features'}</h2>
            <p className="text-slate-500 text-sm mt-1">{getMessage()}</p>
            {reason === 'ats' && (
              <p className="text-amber-600 text-sm mt-2 font-medium">Upgrade to get more ATS checks and downloads!</p>
            )}
          </div>

          {/* Plans */}
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl p-4 transition-all hover:scale-[1.01] ${
                  plan.popular
                    ? 'bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] text-white shadow-xl shadow-blue-500/20 border-2 border-amber-400'
                    : 'border-2 border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Crown size={10} />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs ${plan.popular ? 'text-blue-200' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                      ₹{plan.price}
                    </div>
                    <div className={`text-[10px] ${plan.popular ? 'text-blue-200' : 'text-slate-400'}`}>
                      {plan.period || 'one-time'}
                    </div>
                  </div>
                </div>

                {/* ATS Checks Badge */}
                {plan.atsChecks > 0 && (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      <Sparkles size={12} />
                      {plan.atsChecks} ATS Checks/mo
                    </div>
                  </div>
                )}

                {/* Downloads Badge */}
                {plan.downloads > 0 && (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                      <Download size={12} />
                      {plan.downloads} Downloads
                    </div>
                  </div>
                )}
                {plan.downloads === -1 && (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <Download size={12} />
                      Unlimited Downloads
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {plan.features.map((feature, idx) => (
                    <span key={idx} className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                      plan.popular ? 'bg-white/20 text-blue-100' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Not Included */}
                {plan.notIncluded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 opacity-60">
                    {plan.notIncluded.map((feature, idx) => (
                      <span key={idx} className={`text-[10px] px-2 py-1 rounded-lg line-through ${
                        plan.popular ? 'bg-white/10 text-blue-300' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Button */}
                <button
                  onClick={() => handlePayment(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-white text-[#1e3a8a] hover:bg-blue-50 shadow-md'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : plan.popular ? (
                    'Get Started'
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Shield size={14} />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Star size={14} />
              <span>Instant Access</span>
            </div>
          </div>
          
          <p className="text-center text-[10px] text-slate-400 mt-2">
            🔒 Powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
