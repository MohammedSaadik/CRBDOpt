import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, PackageCheck, DollarSign, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      },
      (error) => {
        console.error("Firebase Error (Users Collection):", error.message);
        alert(`Users Data Error: ${error.message} \n(Check your Firestore Security Rules to ensure Admins can list the 'users' collection.)`);
      }
    );

    const unsubDeliveries = onSnapshot(
      collection(db, 'deliveries'), 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort newest first
        data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setDeliveries(data);
      },
      (error) => {
        console.error("Firebase Error (Deliveries Collection):", error.message);
      }
    );

    setLoading(false);

    return () => {
      unsubUsers();
      unsubDeliveries();
    };
  }, []);

  const totalRevenue = deliveries
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + (Number(d.estimated_cost) || 0), 0);

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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={20} className="mr-1" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
            <Users className="text-green-600 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
            <PackageCheck className="text-blue-600 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
            <p className="text-3xl font-bold text-gray-900">{deliveries.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
             <DollarSign className="text-yellow-600 mb-2" size={32} />
             <p className="text-sm font-medium text-gray-500">Platform Revenue (Completed)</p>
             <p className="text-3xl font-bold text-gray-900">LKR {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
               <span className="text-xs text-gray-500">All registered accounts</span>
             </div>
             <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-white sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name / Contact</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {users.map(u => (
                     <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-gray-900">{u.username || u.name || 'N/A'}</div>
                         <div className="text-xs text-gray-500">{u.email}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           u.role === 'Admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 
                           u.role === 'Commuter' ? 'bg-green-100 text-green-800 border border-green-200' : 
                           'bg-blue-100 text-blue-800 border border-blue-200'
                         }`}>
                           {u.role || 'Unknown'}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h2 className="text-lg font-semibold text-gray-900">Platform Deliveries</h2>
               <span className="text-xs text-gray-500">Live order status</span>
             </div>
             <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
               <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-white sticky top-0 z-10 shadow-sm">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Package Details</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost (LKR)</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {deliveries.slice(0, 100).map(d => (
                     <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-gray-900">{d.packageType} Package</div>
                         <div className="text-xs text-gray-500 truncate w-40" title={d.pickup_loc?.address || d.pickupLocation}>
                           From: {d.pickup_loc?.address || d.pickupLocation || 'Unknown'}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                           d.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                           d.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : 
                           d.status === 'proposed' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                           'bg-gray-100 text-gray-800 border-gray-200'
                         }`}>
                           {d.status?.toUpperCase() || 'PENDING'}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                         {d.estimated_cost ? `${d.estimated_cost.toLocaleString()}` : '-'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
