
import React, { useEffect, useMemo, useState } from 'react'
import CallCenterDashboard from './CallCenterDashboard'
import Login from './Login'

function App() {
  const apiBase = useMemo(() => (import.meta?.env?.VITE_BASE_API_URL) || 'https://112.rcs.ir/api', []);
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    const uRaw = localStorage.getItem('authUser');
    setAuthToken(t);
    try { setUser(uRaw ? JSON.parse(uRaw) : null);} catch {}
  }, []);

  const handleLoginSuccess = (data) => {
    setAuthToken(data?.token || null);
    setUser(data?.user || null);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } catch {}
    setAuthToken(null);
    setUser(null);
    try { window.location.hash = '#/login'; } catch {}
  };

if(!authToken){
  return <Login onSuccess={handleLoginSuccess} apiBase={apiBase}/>
}

  return (
    <>
      <CallCenterDashboard user={user} token={authToken} onLogout={handleLogout} />
    </>
  )
}

export default App
