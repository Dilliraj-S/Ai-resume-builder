import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function ProTimerDisplay({ remainingMs, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(remainingMs);

  useEffect(() => {
    setTimeLeft(remainingMs);
  }, [remainingMs]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isWarning = timeLeft < 60000; // Less than 1 minute

  return (
    <div 
      className="ats-score-pill" 
      style={{ 
        backgroundColor: isWarning ? '#fef3c7' : '#dbeafe',
        animation: isWarning ? 'pulse 1s infinite' : 'none'
      }}
    >
      <Clock size={14} style={{ color: isWarning ? '#d97706' : '#2563eb' }} />
      <span style={{ 
        color: isWarning ? '#d97706' : '#2563eb', 
        fontWeight: '600',
        fontSize: '12px'
      }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
