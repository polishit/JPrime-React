import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ msg: '', type: 'success', show: false });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  return { toast, showToast };
}

export default function Toast({ toast }) {
  return (
    <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`} id="toast">
      {toast.type === 'success'
        ? <i className="fa-solid fa-circle-check" />
        : <i className="fa-solid fa-circle-xmark" />}
      <span>{toast.msg}</span>
    </div>
  );
}
