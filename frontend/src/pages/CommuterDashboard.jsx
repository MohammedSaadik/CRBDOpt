import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, deleteField } from 'firebase/firestore';
import { MapPin, Clock, Navigation, CheckCircle, XCircle, LogOut } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';

const CommuterDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [commuterData, setCommuterData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [pastDeliveries, setPastDeliveries] = useState([]);

  const [routeForm, setRouteForm] = useState({
    home_loc: null,
    work_loc: null,
    departureTime: '',
    detourTolerance: 5
  });

  useEffect(() => {
    let unsubscribeProposed = null;
    let unsubscribeMatched = null;

    const fetchUserDataAndListen = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCommuterData(userDoc.data());
        }

        // 1. Listen for Proposed Offers
        const qProposed = query(
          collection(db, 'deliveries'),
          where('proposed_commuter_id', '==', auth.currentUser.uid)
        );

        unsubscribeProposed = onSnapshot(qProposed, (snapshot) => {
          const offersData = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })).filter(offer => offer.status === 'proposed');
          setOffers(offersData);
        });

        // 2. Listen for Accepted/Collected/Completed Jobs
        const qMatched = query(
          collection(db, 'deliveries'),
          where('matched_commuter_id', '==', auth.currentUser.uid)
        );

        unsubscribeMatched = onSnapshot(qMatched, (snapshot) => {
           const allMatched = snapshot.docs.map(docSnap => ({
              id: docSnap.id,
              ...docSnap.data()
           }));
           
           const active = allMatched.filter(d => d.status === 'accepted' || d.status === 'collected');
           const completed = allMatched.filter(d => d.status === 'completed');
           
           // Sort history by newest first basically (or assumed natural order)
           completed.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

           setActiveDeliveries(active);
           setPastDeliveries(completed);
        });
      }
      setLoading(false);
    };

    fetchUserDataAndListen();

    return () => {
      if (unsubscribeProposed) unsubscribeProposed();
      if (unsubscribeMatched) unsubscribeMatched();
    };
  }, []);

  const handleChange = (e) => {
    setRouteForm({ ...routeForm, [e.target.name]: e.target.value });
  };

  const handleSliderChange = (e) => {
    setRouteForm({ ...routeForm, detourTolerance: parseInt(e.target.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeForm.home_loc || !routeForm.work_loc) {
      alert("Please select proper valid locations from the Google dropdown for Start and End locations.");
      return;
    }
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

  const handleAccept = async (offerId) => {
    try {
      await updateDoc(doc(db, 'deliveries', offerId), {
        status: 'accepted',
        matched_commuter_id: auth.currentUser.uid
      });
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handleDecline = async (offerId) => {
    try {
      // Remove proposed_commuter_id and reset status
      await updateDoc(doc(db, 'deliveries', offerId), {
        status: 'pending',
        proposed_commuter_id: deleteField(),
        detour_km: deleteField()
      });
    } catch (error) {
      console.error("Error declining offer:", error);
    }
  };

  const handleMarkCollected = async (id) => {
    try {
      await updateDoc(doc(db, 'deliveries', id), { status: 'collected' });
    } catch (error) {
      console.error(error);
      alert('Failed to mark as collected.');
    }
  };

  const handleMarkDelivered = async (id) => {
    try {
      await updateDoc(doc(db, 'deliveries', id), { status: 'completed' });
    } catch (error) {
      console.error(error);
      alert('Failed to mark as completed.');
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  const getAddress = (locField) => {
    if (typeof locField === 'object' && locField !== null) return locField.address;
    return locField;
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="text-gray-400" size={16} />
                  </div>
                  <Autocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={(place) => {
                      if (place.geometry) {
                        setRouteForm({
                          ...routeForm,
                          home_loc: {
                            address: place.formatted_address || place.name,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                          }
                        });
                      }
                    }}
                    options={{ types: ['geocode', 'establishment'] }}
                    placeholder="Home, Office, etc."
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Location</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="text-green-500" size={16} />
                  </div>
                  <Autocomplete
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onPlaceSelected={(place) => {
                      if (place.geometry) {
                        setRouteForm({
                          ...routeForm,
                          work_loc: {
                            address: place.formatted_address || place.name,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                          }
                        });
                      }
                    }}
                    options={{ types: ['geocode', 'establishment'] }}
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

        {/* Right Column: Dashboard Feed */}
        <div className="flex flex-col space-y-6">
          
          {/* Active Jobs */}
          {activeDeliveries.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-900">Active Jobs</h2>
                </div>
                <div className="p-6 bg-white space-y-4">
                  {activeDeliveries.map(job => (
                     <div key={job.id} className="p-5 rounded-lg border border-blue-200 shadow-sm bg-blue-50/50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{job.packageType || 'Package'} Delivery</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 mt-1 inline-block rounded-full ${job.status === 'collected' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                              {job.status === 'collected' ? 'IN TRANSIT' : 'ACCEPTED'}
                            </span>
                          </div>
                          {job.estimated_cost && (
                             <span className="font-bold text-green-700">LKR {job.estimated_cost}</span>
                          )}
                        </div>
                        <div className="space-y-3 mb-6">
                           <div className="flex items-start">
                             <MapPin size={16} className={`${job.status === 'accepted' ? 'text-blue-500' : 'text-gray-400'} mt-0.5 mr-2 flex-shrink-0`} />
                             <div>
                               <p className={`text-xs uppercase font-semibold ${job.status === 'accepted' ? 'text-blue-600' : 'text-gray-500'}`}>Pickup</p>
                               <p className="text-sm text-gray-800">{getAddress(job.pickup_loc) || job.pickupLocation}</p>
                             </div>
                           </div>
                           <div className="ml-2 border-l-2 border-dashed border-gray-300 h-4 my-1"></div>
                           <div className="flex items-start">
                             <MapPin size={16} className={`${job.status === 'collected' ? 'text-blue-500' : 'text-gray-400'} mt-0.5 mr-2 flex-shrink-0`} />
                             <div>
                               <p className={`text-xs uppercase font-semibold ${job.status === 'collected' ? 'text-blue-600' : 'text-gray-500'}`}>Dropoff</p>
                               <p className="text-sm text-gray-800">{getAddress(job.dropoff_loc) || job.dropoffLocation}</p>
                             </div>
                           </div>
                        </div>

                        {job.status === 'accepted' && (
                           <button onClick={() => handleMarkCollected(job.id)} className="w-full flex items-center justify-center py-3 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
                             Mark as Collected
                           </button>
                        )}
                        {job.status === 'collected' && (
                           <button onClick={() => handleMarkDelivered(job.id)} className="w-full flex items-center justify-center py-3 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition">
                             Mark as Delivered
                           </button>
                        )}
                     </div>
                  ))}
                </div>
             </div>
          )}

          {/* New Offers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col border-t-2 border-t-green-500">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Delivery Offers</h2>
              {offers.length > 0 && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {offers.length} New
                </span>
              )}
            </div>

            <div className="p-6 bg-gray-50 max-h-[500px] overflow-y-auto">
              {offers.length === 0 ? (
                <p className="text-center text-sm text-gray-500 my-4">
                  No delivery offers at the moment. Waiting for matches...
                </p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-md font-bold text-gray-900">{offer.packageType || 'Package'} Delivery</h3>
                          <p className="text-xs text-gray-500">Urgency: {offer.urgencyLevel || 'Standard'}</p>
                        </div>
                        <div className="text-right">
                          {offer.estimated_cost && <span className="block font-bold text-green-700 text-sm mb-1">LKR {offer.estimated_cost}</span>}
                          <span className="block text-xs font-bold text-gray-500">
                            {offer.detour_km ? `${offer.detour_km.toFixed(2)} km Detour` : 'Detour Unspecified'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-start">
                          <MapPin size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Pickup</p>
                            <p className="text-xs text-gray-800">{getAddress(offer.pickup_loc) || getAddress(offer.pickupLocation) || offer.pickup || 'Unknown Location'}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <MapPin size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-green-600 uppercase font-semibold">Dropoff</p>
                            <p className="text-xs text-gray-800">{getAddress(offer.dropoff_loc) || getAddress(offer.dropoffLocation) || offer.dropoff || 'Unknown Location'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAccept(offer.id)}
                          className="flex-1 flex items-center justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(offer.id)}
                          className="flex-1 flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors"
                        >
                          <XCircle size={16} className="mr-2 text-red-500" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Past Earnings */}
          {pastDeliveries.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center">
                   <h2 className="text-lg font-semibold text-gray-900">Past Earnings</h2>
                </div>
                <div className="p-4 bg-white space-y-3 max-h-[300px] overflow-y-auto">
                   {pastDeliveries.map(d => (
                      <div key={d.id} className="p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center bg-gray-50">
                         <div>
                            <p className="text-sm font-medium text-gray-900">{d.packageType} Package</p>
                            <p className="text-xs text-gray-500 truncate w-40">To: {getAddress(d.dropoff_loc) || 'Customer'}</p>
                         </div>
                         <div className="text-right">
                            <span className="bg-green-100 text-green-800 text-sm font-bold px-2.5 py-1 rounded">
                               LKR {d.estimated_cost || 0}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default CommuterDashboard;


