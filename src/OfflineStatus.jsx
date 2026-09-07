import React, { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [status, setStatus] = useState('Saving for offline use…');

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!('serviceWorker' in navigator)) {
      setStatus('Offline saving is unavailable in this browser.');
      return;
    }

    let mounted = true;
    const update = (message) => { if (mounted) setStatus(message); };
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        if (registration.active) update('Ready to use offline');
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'redundant' && !registration.active) {
            update('Offline saving failed. Reopen online to retry.');
          }
        });
        return navigator.serviceWorker.ready;
      })
      .then(() => update('Ready to use offline'))
      .catch(() => update('Offline saving failed. Reopen online to retry.'));

    return () => { mounted = false; };
  }, []);

  return import.meta.env.PROD ? <p className="offline-status" role="status">{status}</p> : null;
}
