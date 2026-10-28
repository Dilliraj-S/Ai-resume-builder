import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { startTokenRefresh } from './services/api';

const HomePage = lazy(() => import('./pages/HomePage'));
const BuilderPage = lazy(() => import('./pages/BuilderPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('rb_token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('rb_user', JSON.stringify({ id: payload.id, email: payload.email, name: payload.name }));
      
      // Start auto-refresh token
      startTokenRefresh(token, (newToken) => {
        localStorage.setItem('rb_token', newToken);
      });
      
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
        <p>{error || 'Signing you in...'}</p>
      </div>
    </div>
  );
};

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  }}>
    <div style={{
      textAlign: 'center',
      color: '#64748b'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p>Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3007,
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-md)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/:tab" element={<DashboardPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/builder/:id" element={<BuilderPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
