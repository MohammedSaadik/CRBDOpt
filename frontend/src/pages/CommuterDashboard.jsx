import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { MapPin, Clock, Navigation, CheckCircle, XCircle, LogOut } from 'lucide-react';

const CommuterDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [commuterData, setCommuterData] = useState(null);

  const [routeForm, setRouteForm] = useState({
    startLocation: '',
    endLocation: '',
    departureTime: '',
    detourTolerance: 5
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCommuterData(userDoc.data());
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setRouteForm({ ...routeForm, [e.target.name]: e.target.value });
  };

  const handleSliderChange = (e) => {
    setRouteForm({ ...routeForm, detourTolerance: parseInt(e.target.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    try {
      await addDoc(collection(db, 'commuters'), {
        ...routeForm,
        commuterId: auth.currentUser.uid,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      setSuccessMsg('Route saved successfully!');
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error saving route: ", error);
      alert('Failed to save route.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Commuter Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-900">{commuterData?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} className="mr-1" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Route Setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
            <Navigation className="text-green-600 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Route Setup</h2>
          </div>
          
          <div className="p-6">
            {successMsg && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <p className="text-sm text-green-700 font-medium">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Location</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    name="startLocation"
                    required
                    value={routeForm.startLocation}
                    onChange={handleChange}
                    placeholder="Home, Office, etc."
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Location</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-green-500" size={16} />
                  </div>
                  <input
                    type="text"
                    name="endLocation"
                    required
                    value={routeForm.endLocation}
                    onChange={handleChange}
                    placeholder="Destination"
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="time"
                    name="departureTime"
                    required
                    value={routeForm.departureTime}
                    onChange={handleChange}
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Detour Tolerance</label>
                  <span className="text-sm text-gray-500">{routeForm.detourTolerance} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  name="detourTolerance"
                  value={routeForm.detourTolerance}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving Route...' : 'Save Daily Route'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">New Delivery Offers</h2>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">1 New</span>
          </div>

          <div className="p-6 flex-grow bg-gray-50">
            {/* Hardcoded Sample Offer */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-green-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Small Package</h3>
                  <p className="text-sm text-gray-500">Urgent Delivery</p>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-bold text-green-600">Rs. 450</span>
                  <span className="text-xs text-gray-500">Est. Earning</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Pickup</p>
                    <p className="text-sm text-gray-800">12 Station Road, Colombo 03</p>
                  </div>
                </div>
                <div className="ml-2 border-l-2 border-dashed border-gray-300 h-4 my-1"></div>
                <div className="flex items-start">
                  <MapPin size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-green-600 uppercase font-semibold">Dropoff</p>
                    <p className="text-sm text-gray-800">45 Park Avenue, Colombo 07</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
                  <CheckCircle size={18} className="mr-2" />
                  Accept
                </button>
                <button className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <XCircle size={18} className="mr-2 text-gray-400" />
                  Decline
                </button>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Offers are matched based on your active route and detour tolerance.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CommuterDashboard;
