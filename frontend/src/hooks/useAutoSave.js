import { useEffect, useRef, useCallback } from 'react';
import useResumeStore from '../store/resumeStore';
import toast from 'react-hot-toast';

const DEBOUNCE_MS = 3000; // Save to server every 3 seconds of inactivity

export const useAutoSave = () => {
  const { resumeId, resumeData, selectedTemplate, isDirty, isSaving, saveResume, resumeTitle, renameResume } = useResumeStore();
  const timerRef = useRef(null);

  const save = useCallback(async () => {
    if (!isDirty || isSaving || !resumeId) return;
    
    try {
      await saveResume();
    } catch (err) {
      // Silent fail on auto-save — user will see on manual save
      console.warn('Auto-save failed:', err.message);
    }
  }, [isDirty, isSaving, resumeId, saveResume]);

  useEffect(() => {
    if (!isDirty || !resumeId) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [isDirty, resumeId, save]);

  const saveNow = async () => {
    if (!resumeId) {
      toast.error('Please create a resume first');
      return;
    }
    clearTimeout(timerRef.current);
    const toastId = toast.loading('Saving...');
    try {
      const success = await saveResume();
      if (success) {
        toast.success('Saved to server!', { id: toastId });
      } else {
        toast.error('Save failed', { id: toastId });
      }
    } catch {
      toast.error('Save failed', { id: toastId });
    }
  };

  return { saveNow };
};