import { useEffect, useState } from 'react';

// Small hook that reads the `partner-session` cookie and returns the `permissions` array if present.
// This is intentionally simple and defensive: if your auth flow supplies permissions on login
// attach them to the partner-session cookie (or adapt this hook to call an API endpoint).
export default function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      if (typeof document === 'undefined') return;
      const cookies = document.cookie.split(';');
      const partnerCookie = cookies.find((c) => c.trim().startsWith('partner-session='));
      if (!partnerCookie) return;
      const raw = partnerCookie.split('=')[1];
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (parsed && Array.isArray(parsed.permissions)) {
        setPermissions(parsed.permissions);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      setPermissions([]);
    }
  }, []);

  return permissions;
}
