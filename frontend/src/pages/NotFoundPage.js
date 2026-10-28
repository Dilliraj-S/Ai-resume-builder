import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '20px',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}>
        <FileText style={{ width: 64, height: 64, color: '#94a3b8', marginBottom: '20px' }} />
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '12px',
        }}>
          Page Not Found
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '24px',
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          <Home style={{ width: 16, height: 16 }} />
          Go to Home
        </Link>
      </div>
    </div>
  );
}