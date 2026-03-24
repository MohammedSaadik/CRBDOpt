import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || 'Commuter';

  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    contact: '',
    vehicleNumberPlate: '',
    shopAddress: ''
  });

  useEffect(() => {
    // If user changes initialRole via URL, update the state
    if (initialRole === 'Commuter' || initialRole === 'Shop Owner') {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Prepare Data for Firestore
      const userData = {
        uid: user.uid,
        username: formData.username,
        email: formData.email,
        contact: formData.contact,
        role: role,
        createdAt: new Date().toISOString()
      };

      if (role === 'Commuter') {
        userData.vehicleNumberPlate = formData.vehicleNumberPlate;
      } else if (role === 'Shop Owner') {
        userData.shopAddress = formData.shopAddress;
      }

      // 3. Save to Firestore 'users' collection with UID as document ID
      await setDoc(doc(db, 'users', user.uid), userData);

      // 4. Redirect based on role
      if (role === 'Commuter') {
        navigate('/commuter-dashboard');
      } else {
        navigate('/shop-dashboard');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button 
            onClick={() => navigate('/login')}
            className="font-medium text-green-600 hover:text-green-500"
          >
            login to your existing account
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          
          {/* Role Toggle */}
          <div className="flex rounded-md shadow-sm mb-6">
            <button
              type="button"
              onClick={() => setRole('Commuter')}
              className={`w-1/2 flex justify-center py-2 px-4 border text-sm font-medium rounded-l-md ${
                role === 'Commuter' 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Commuter
            </button>
            <button
              type="button"
              onClick={() => setRole('Shop Owner')}
              className={`w-1/2 flex justify-center py-2 px-4 border border-l-0 text-sm font-medium rounded-r-md ${
                role === 'Shop Owner' 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Shop Owner
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1">
                <input
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <div className="mt-1">
                <input
                  name="contact"
                  type="tel"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            {role === 'Commuter' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Number Plate</label>
                <div className="mt-1">
                  <input
                    name="vehicleNumberPlate"
                    type="text"
                    required
                    value={formData.vehicleNumberPlate}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Shop Address</label>
                <div className="mt-1">
                  <textarea
                    name="shopAddress"
                    required
                    rows={3}
                    value={formData.shopAddress}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
