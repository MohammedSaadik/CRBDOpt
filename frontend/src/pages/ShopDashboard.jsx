import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { Package, Clock, MapPin, LogOut, Star } from 'lucide-react';
import Autocomplete from 'react-google-autocomplete';
import { calculateEstimatedCost } from '../utils/pricing';

const CommuterInfo = ({ commuterId }) => {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    if (!commuterId) return;
    const fetchInfo = async () => {
      const userDoc = await getDoc(doc(db, 'users', commuterId));
      if (userDoc.exists()) {
        setInfo(userDoc.data());
      }
    };
    fetchInfo();
  }, [commuterId]);

  if (!info) return <span className="text-xs text-green-700 block mt-2">Fetching Commuter Details...</span>;
  
  return (
    <div className="mt-2 p-3 bg-green-50 rounded text-sm text-green-800 border border-green-200 text-left sm:text-right w-full">
      <p><strong>Name:</strong> {info.username || info.name || 'Unknown'}</p>
      {info.vehiclePlate && <p><strong>Plate:</strong> {info.vehiclePlate}</p>}
    </div>
  );
};

const FeedbackForm = ({ order }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert('Please select a star rating.');
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'deliveries', order.id), {
        rating,
        feedback_text: feedbackText
      });
    } catch (error) {
      console.error(error);
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  if (order.rating) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 w-full sm:text-right">
        <p className="text-sm font-semibold text-gray-700 mb-1">Your Feedback</p>
        <div className="flex justify-start sm:justify-end mb-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} className={i < order.rating ? "text-yellow-400 fill-current" : "text-gray-300"} />
          ))}
        </div>
        {order.feedback_text && <p className="text-xs text-gray-500 italic">"{order.feedback_text}"</p>}
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200 w-full sm:text-right flex flex-col items-start sm:items-end">
      <p className="text-sm font-semibold text-green-800 mb-1">Rate this completed delivery</p>
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            disabled={submitting}
          >
            <Star size={20} className={(hoverRating || rating) >= star ? "text-yellow-400 fill-current" : "text-gray-300"} />
          </button>
        ))}
      </div>
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder="How was your experience?"
        maxLength={150}
        disabled={submitting}
        className="text-sm border border-gray-300 rounded p-1.5 w-full max-w-xs focus:outline-none focus:border-green-500 mb-2"
        rows="2"
      />
      <button 
        onClick={handleSubmit} 
        disabled={submitting}
        className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-green-700"
      >
        {submitting ? 'Saving...' : 'Submit Feedback'}
      </button>
    </div>
  );
};

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [shopData, setShopData] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);

  const [deliveryForm, setDeliveryForm] = useState({
    pickup_loc: null,
    dropoff_loc: null,
    packageType: 'Small',
    readyTime: '',
    urgencyLevel: 'Standard'
  });

  const estimatedCost = calculateEstimatedCost(deliveryForm.pickup_loc, deliveryForm.dropoff_loc);

  useEffect(() => {
    let unsubscribe = null;

    const fetchUserDataAndListen = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setShopData(data);
        }

        const q = query(
          collection(db, 'deliveries'),
          where('shopOwnerId', '==', auth.currentUser.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          
          ordersData.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLiveOrders(ordersData);
        });
      }
      setLoading(false);
    };

    fetchUserDataAndListen();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    setDeliveryForm({ ...deliveryForm, [e.target.name]: e.target.value });
  };

  const getAddress = (locField) => {
    if (typeof locField === 'object' && locField !== null) return locField.address;
    return locField;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deliveryForm.pickup_loc || !deliveryForm.dropoff_loc) {
      alert("Please select proper valid locations from the Google dropdown for Pickup and Dropoff locations.");
      return;
    }
    setSubmitting(true);
    setSuccessMsg('');

    try {
      await addDoc(collection(db, 'deliveries'), {
        ...deliveryForm,
        estimated_cost: estimatedCost,
        shopOwnerId: auth.currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setSuccessMsg('Delivery request submitted successfully!');
      setDeliveryForm({
        ...deliveryForm,
        dropoff_loc: null,
        packageType: 'Small',
        readyTime: '',
        urgencyLevel: 'Standard'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Failed to submit delivery request.');
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
          <h1 className="text-2xl font-bold text-gray-900">Shop Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, <span className="font-semibold text-gray-900">{shopData?.username}</span>
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
            <Package className="text-green-600 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">New Delivery Request</h2>
          </div>
          
          <div className="p-6">
            {successMsg && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                <p className="text-sm text-green-700 font-medium">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Locations */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <MapPin className="text-gray-400" size={16} />
                    </div>
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={(place) => {
                        if (place.geometry) {
                          setDeliveryForm({
                            ...deliveryForm,
                            pickup_loc: {
                              address: place.formatted_address || place.name,
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng()
                            }
                          });
                        }
                      }}
                      options={{ types: ['geocode', 'establishment'] }}
                      placeholder="Shop address"
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <MapPin className="text-green-500" size={16} />
                    </div>
                    <Autocomplete
                      apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                      onPlaceSelected={(place) => {
                        if (place.geometry) {
                          setDeliveryForm({
                            ...deliveryForm,
                            dropoff_loc: {
                              address: place.formatted_address || place.name,
                              lat: place.geometry.location.lat(),
                              lng: place.geometry.location.lng()
                            }
                          });
                        }
                      }}
                      options={{ types: ['geocode', 'establishment'] }}
                      placeholder="Customer address"
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    />
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Type</label>
                  <select
                    name="packageType"
                    value={deliveryForm.packageType}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md border"
                  >
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ready Time</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="time"
                      name="readyTime"
                      required
                      value={deliveryForm.readyTime}
                      onChange={handleChange}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Urgency Level</label>
                  <select
                    name="urgencyLevel"
                    value={deliveryForm.urgencyLevel}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md border"
                  >
                    <option>Standard</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              {estimatedCost > 0 && (
                <div className="pt-2">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center shadow-sm">
                    <span className="text-sm font-medium text-green-800">Estimated Live Cost:</span>
                    <span className="text-lg font-bold text-green-700">LKR {estimatedCost}</span>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Create Delivery Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Orders Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center">
            <Clock className="text-blue-600 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Live Orders</h2>
          </div>
          
          <div className="p-6">
            {liveOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-500 my-4">No active orders found.</p>
            ) : (
              <div className="space-y-4">
                {liveOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between hover:border-blue-300 transition-colors bg-white">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{order.packageType} Package</h3>
                        <span className="text-xs text-gray-500">({order.urgencyLevel})</span>
                        {order.estimated_cost && (
                           <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded border border-green-200">
                             LKR {order.estimated_cost}
                           </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-1">
                         <span className="font-semibold text-gray-700">From:</span>
                         <span>{getAddress(order.pickup_loc) || order.pickupLocation}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                         <span className="font-semibold text-gray-700">To:</span>
                         <span>{getAddress(order.dropoff_loc) || order.dropoffLocation}</span>
                      </div>
                    </div>
                    
                    <div className="sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                      {order.status === 'pending' && (
                        <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full border border-gray-200">
                          🔍 Searching...
                        </span>
                      )}
                      
                      {order.status === 'proposed' && (
                        <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full border border-yellow-200">
                          ⏳ Waiting for Commuter
                        </span>
                      )}
                      
                      {order.status === 'accepted' && (
                        <div className="flex flex-col items-start sm:items-end w-full">
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full border border-green-200 mb-2 whitespace-nowrap">
                            Commuter is on the way to pickup.
                          </span>
                          <CommuterInfo commuterId={order.matched_commuter_id} />
                        </div>
                      )}

                      {order.status === 'collected' && (
                        <div className="flex flex-col items-start sm:items-end w-full">
                          <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full border border-yellow-200 mb-2 whitespace-nowrap">
                            Delivery in Progress.
                          </span>
                          <CommuterInfo commuterId={order.matched_commuter_id} />
                        </div>
                      )}
                      
                      {order.status === 'completed' && (
                        <div className="flex flex-col items-start sm:items-end w-full">
                          <span className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full mb-2 whitespace-nowrap">
                            Delivery Completed.
                          </span>
                          <FeedbackForm order={order} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopDashboard;
