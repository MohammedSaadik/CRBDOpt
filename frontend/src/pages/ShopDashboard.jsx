import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Package, Clock, MapPin, LogOut } from 'lucide-react';

const ShopDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [shopData, setShopData] = useState(null);

  const [deliveryForm, setDeliveryForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    packageType: 'Small',
    readyTime: '',
    urgencyLevel: 'Standard'
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setShopData(data);
          setDeliveryForm(prev => ({
            ...prev,
            pickupLocation: data.shopAddress || ''
          }));
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setDeliveryForm({ ...deliveryForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    try {
      await addDoc(collection(db, 'deliveries'), {
        ...deliveryForm,
        shopOwnerId: auth.currentUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setSuccessMsg('Delivery request submitted successfully!');
      setDeliveryForm({
        ...deliveryForm,
        dropoffLocation: '',
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
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="text"
                      name="pickupLocation"
                      required
                      value={deliveryForm.pickupLocation}
                      onChange={handleChange}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="text-green-500" size={16} />
                    </div>
                    <input
                      type="text"
                      name="dropoffLocation"
                      required
                      value={deliveryForm.dropoffLocation}
                      onChange={handleChange}
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
      </main>
    </div>
  );
};

export default ShopDashboard;
