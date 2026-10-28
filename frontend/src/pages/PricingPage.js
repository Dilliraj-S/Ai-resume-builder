import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowLeft, Zap, Crown, Shield, Download, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect to get started',
    icon: '🌱',
    features: [
      { text: 'Live preview', included: true },
      { text: '4 basic templates', included: true },
      { text: '3 ATS checks', included: true },
      { text: '3 AI credits', included: true },
      { text: 'PDF Download', included: false },
      { text: 'Premium templates', included: false },
    ],
  },
  {
    id: 'onetime',
    name: 'One-Time',
    price: 19,
    period: 'one-time',
    description: 'Just need one resume?',
    icon: '📄',
    features: [
      { text: 'Download 1 PDF', included: true },
      { text: 'All templates', included: true },
      { text: 'Live preview', included: true },
      { text: 'ATS score check', included: true },
      { text: 'AI enhancements', included: true },
    ],
    badge: 'Best Value',
  },
  {
    id: 'single',
    name: 'Starter',
    price: 49,
    period: 'month',
    description: 'For quick applications',
    icon: '🚀',
    features: [
      { text: '3 PDF downloads/mo', included: true },
      { text: 'All templates', included: true },
      { text: '10 ATS checks/mo', included: true },
      { text: '10 AI credits/mo', included: true },
      { text: 'Live preview', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    period: 'month',
    description: 'For serious job seekers',
    icon: '💎',
    features: [
      { text: 'Unlimited PDF downloads', included: true },
      { text: 'All templates', included: true },
      { text: 'Unlimited ATS checks', included: true },
      { text: '50 AI credits/mo', included: true },
      { text: 'Priority support', included: true },
    ],
    popular: true,
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
  warning: '#f59e0b',
};

export default function PricingPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (plan) => {
    if (plan.id === 'free') {
      toast.success('You are on the Free plan!');
      return;
    }
    navigate(`/payment?plan=${plan.id}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              display: 'inline-flex', 
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
            Back to Home
          </button>
          
          <h1 style={{ 
            fontSize: 'clamp(32px, 5vw, 48px)', 
            fontWeight: '800', 
            marginBottom: '12px', 
            color: colors.text,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, #a5a5b5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Choose Your Plan
          </h1>
          <p style={{ 
            fontSize: 'clamp(16px, 2vw, 18px)', 
            color: colors.textMuted,
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            Unlock premium features and accelerate your job search
          </p>
        </div>

        {/* Plans Grid - 4 cards in one row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          maxWidth: '1300px',
          margin: '0 auto',
        }}>
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              style={{
                background: plan.popular ? `linear-gradient(180deg, ${colors.accent}15 0%, ${colors.card} 100%)` : colors.card,
                borderRadius: '20px',
                padding: '28px 24px',
                boxShadow: plan.popular 
                  ? `0 0 0 1px ${colors.accent}, 0 20px 40px -10px rgba(99, 102, 241, 0.3)` 
                  : `0 10px 30px -10px rgba(0,0,0,0.5)`,
                position: 'relative',
                border: plan.popular ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = plan.popular 
                  ? `0 0 0 1px ${colors.accent}, 0 25px 50px -10px rgba(99, 102, 241, 0.4)` 
                  : `0 15px 40px -10px rgba(0,0,0,0.6)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = plan.popular 
                  ? `0 0 0 1px ${colors.accent}, 0 20px 40px -10px rgba(99, 102, 241, 0.3)` 
                  : `0 10px 30px -10px rgba(0,0,0,0.5)`;
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Icon & Name */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  fontSize: '36px',
                  marginBottom: '12px',
                }}>
                  {plan.icon}
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '4px',
                  color: colors.text,
                }}>
                  {plan.name}
                </h3>
                <p style={{ 
                  fontSize: '13px', 
                  color: colors.textMuted, 
                }}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ 
                  fontSize: '40px', 
                  fontWeight: '800', 
                  background: plan.popular 
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                    : 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  ₹{plan.price}
                </span>
                {plan.period !== 'one-time' && plan.period !== 'forever' && (
                  <span style={{ fontSize: '14px', color: colors.textMuted, marginLeft: '2px' }}>
                    /{plan.period}
                  </span>
                )}
                {plan.period === 'forever' && (
                  <span style={{ fontSize: '12px', color: colors.textMuted, marginLeft: '6px' }}>
                    forever
                  </span>
                )}
                {plan.period === 'one-time' && (
                  <span style={{ fontSize: '12px', color: colors.textMuted, marginLeft: '6px' }}>
                    one-time
                  </span>
                )}
              </div>

              {/* Features */}
              <div style={{ flex: 1, marginBottom: '24px' }}>
                {plan.features.map((feature, i) => (
                  <div 
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: i < plan.features.length - 1 ? `1px solid ${colors.border}40` : 'none',
                    }}
                  >
                    {feature.included ? (
                      <Check size={16} color={colors.success} style={{ flexShrink: 0 }} />
                    ) : (
                      <X size={16} color={colors.textMuted} style={{ flexShrink: 0, opacity: 0.4 }} />
                    )}
                    <span style={{
                      fontSize: '13px',
                      color: feature.included ? colors.textMuted : colors.textMuted,
                      opacity: feature.included ? 1 : 0.5,
                    }}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: plan.id === 'free' 
                    ? colors.border 
                    : plan.popular 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : `linear-gradient(135deg, ${colors.accent}dd 0%, ${colors.accentLight}dd 100%)`,
                  color: plan.id === 'free' ? colors.text : '#fff',
                  border: plan.id === 'free' ? `1px solid ${colors.border}` : 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {plan.id === 'free' ? (
                  'Current Plan'
                ) : (
                  <>
                    <Download size={16} />
                    {plan.price === 0 ? 'Get Started' : `Pay ₹${plan.price}`}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          color: colors.textMuted,
          fontSize: '13px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={14} />
            <span>Secure payments powered by Razorpay</span>
          </div>
          <p style={{ opacity: 0.7 }}>All plans include ATS-optimized templates</p>
        </div>
      </div>
      
      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 1200px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
            max-width: 800px !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
            max-width: 400px !important;
          }
        }
      `}</style>
    </div>
  );
}