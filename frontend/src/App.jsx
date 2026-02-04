import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './pages/Login';
import CommuterForm from './pages/CommuterForm';
import RequestForm from './pages/RequestForm';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Navbar = () => {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, u => setUser(u)), []);

  return (
    <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        CRBDOpti
      </div>
      {user && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/commuter-onboarding" className='btn' style={{ color: 'white', textDecoration: 'none' }}>Drive</Link>
          <Link to="/request-delivery" className='btn' style={{ color: 'white', textDecoration: 'none' }}>Send</Link>
          <button className='btn' style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => auth.signOut()}>Log Out</button>
        </div>
      )}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/commuter-onboarding" element={
          <ProtectedRoute>
            <CommuterForm />
          </ProtectedRoute>
        } />
        <Route path="/request-delivery" element={
          <ProtectedRoute>
            <RequestForm />
          </ProtectedRoute>
        } />
        {/* Default route redirect to one of the forms or a dashboard (not implemented yet) */}
        <Route path="/" element={<Navigate to="/request-delivery" />} />
      </Routes>
    </Router>
  );
}

export default App;
