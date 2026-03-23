import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CommuterDashboard from './pages/CommuterDashboard';
import ShopDashboard from './pages/ShopDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch user role from Firestore
          let userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          // Retry logic to prevent race condition right after registration
          if (!userDoc.exists()) {
            await new Promise(r => setTimeout(r, 1500));
            userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          }

          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Logged in but incorrect role, redirect to appropriate dashboard
    if (userRole === 'Commuter') {
      return <Navigate to="/commuter-dashboard" replace />;
    } else if (userRole === 'Shop Owner') {
      return <Navigate to="/shop-dashboard" replace />;
    } else {
      // Unknown role, force login again
      auth.signOut();
      return <Navigate to="/login" replace />;
    }
  }

  // Authorized
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/commuter-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Commuter']}>
                <CommuterDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/shop-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Shop Owner']}>
                <ShopDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
