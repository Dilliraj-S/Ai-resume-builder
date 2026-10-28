import React, { useCallback, useEffect, useState } from 'react';
import './ResizeHandle.css';

export default function ResizeHandle({ direction = 'horizontal', onResize, minSize = 200, maxSize = 600 }) {
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    let rafId = null;
    const handleMouseMove = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        onResize(e.clientX);
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onResize, direction]);

  return (
    <div
      className={`resize-handle ${direction} ${isResizing ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <div className="resize-handle-bar" />
    </div>
  );
}
