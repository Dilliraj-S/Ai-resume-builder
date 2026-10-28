import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Lock, CreditCard } from 'lucide-react';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'single',
    name: 'Starter Plan',
    price: 49,
    period: '/month',
    features: ['3 PDF downloads/month', 'All Templates', '10 ATS Checks', '10 AI Credits'],
  },
  {
    id: 'onetime',
    name: 'One-Time Download',
    price: 19,
    period: 'one-time',
    features: ['1 PDF download', 'All Templates', 'Live Preview'],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 99,
    period: '/month',
    features: ['Unlimited Downloads', 'All Templates', 'Unlimited ATS', '50 AI Credits', 'Priority Support'],
  },
];

const colors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  card: '#1a1a24',
  border: '#2a2a3a',
  text: '#f0f0f5',
  textMuted: '#8888a0',
  accent: '#6366f1',
  accentLight: '#8b5cf6',
  success: '#22c55e',
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'single';
  
  const selectedPlan = PLANS.find(p => p.id === planId) || PLANS[0];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.createOrder({ plan_type: selectedPlan.id });
      
      if (res.success && res.orderId) {
        if (!window.Razorpay) {
          toast.error('Please wait, loading payment gateway...');
          setLoading(false);
          return;
        }

        const rzp = new window.Razorpay({
          key: res.keyId,
          amount: res.amount,
          currency: res.currency || 'INR',
          name: 'ResumeAI',
          description: `${selectedPlan.name} - ₹${selectedPlan.price}`,
          order_id: res.orderId,
          handler: async (response) => {
            toast.success('Payment successful! Verifying...');
            try {
              const verifyRes = await paymentAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_type: selectedPlan.id,
              });
              if (verifyRes.success) {
                toast.success('Plan activated successfully!');
                navigate('/dashboard');
              } else {
                toast.error('Payment verification failed');
              }
            } catch (err) {
              toast.error('Verification error');
            }
            setLoading(false);
          },
          modal: { ondismiss: () => setLoading(false) },
          theme: { color: '#6366f1' },
        });
        
        rzp.on('payment.failed', (response) => {
          toast.error('Payment failed: ' + (response.error?.description || 'Unknown'));
          setLoading(false);
        });
        
        rzp.open();
      } else {
        toast.error('Order creation failed');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/pricing')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: colors.card, 
            border: `1px solid ${colors.border}`, 
            cursor: 'pointer', 
            color: colors.textMuted, 
            marginBottom: '24px', 
            fontSize: '14px',
            fontWeight: '500',
            padding: '10px 20px',
            borderRadius: '10px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Pricing
        </button>

        <div style={{
          background: colors.card,
          borderRadius: '24px',
          padding: '36px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CreditCard size={26} color="#fff" />
            </div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              marginBottom: '8px',
              color: colors.text,
            }}>
              Complete Purchase
            </h1>
            <p style={{ color: colors.textMuted, fontSize: '14px' }}>
              Secure payment via Razorpay
            </p>
          </div>

          {/* Plan Details */}
          <div style={{
            background: colors.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '600', color: colors.text }}>
                  {selectedPlan.name}
                </h3>
                {selectedPlan.period !== 'one-time' && (
                  <span style={{ fontSize: '12px', color: colors.textMuted }}>Monthly subscription</span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontSize: '30px', 
                  fontWeight: '800', 
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ₹{selectedPlan.price}
                </span>
                {selectedPlan.period !== 'one-time' && (
                  <span style={{ fontSize: '13px', color: colors.textMuted }}>/mo</span>
                )}
              </div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {selectedPlan.features.map((feature, i) => (
                <li key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '8px 0',
                  fontSize: '13px',
                  color: colors.textMuted,
                }}>
                  <Check size={14} color={colors.success} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading 
                ? colors.border 
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <Lock size={17} />
                Pay ₹{selectedPlan.price}
              </>
            )}
          </button>

          {/* Security */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            marginTop: '18px',
            color: colors.textMuted,
            fontSize: '12px',
          }}>
            <Shield size={14} />
            <span>Secure encrypted payment</span>
          </div>
        </div>
      </div>
    </div>
  );
}