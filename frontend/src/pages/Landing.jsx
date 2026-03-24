import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Store, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    // Navigate to register with selected role
    navigate(`/register?role=${encodeURIComponent(role)}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-green-600 text-white py-6 px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">CRBDOpti</h1>
          <nav>
            <button 
              onClick={() => navigate('/login')}
              className="font-medium hover:text-green-100 transition-colors"
            >
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl w-full">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Optimized Deliveries for Everyone
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join our platform to streamline package deliveries. Whether you're commuting or running a shop, we make logistics easier.
          </p>

          <h3 className="text-2xl font-bold text-gray-800 mb-8">Choose your role to get started</h3>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Commuter Card */}
            <button
              onClick={() => handleRoleSelection('Commuter')}
              className="group relative bg-white border-2 border-green-100 rounded-2xl p-8 hover:border-green-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Car size={120} className="text-green-600 -mt-6 -mr-6" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Car size={32} />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">I am a Commuter</h4>
                <p className="text-gray-600 mb-6">
                  Earn on your daily routes by delivering packages that match your path.
                </p>
                <div className="flex items-center text-green-600 font-semibold mt-auto">
                  <span>Join as Commuter</span>
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Shop Owner Card */}
            <button
              onClick={() => handleRoleSelection('Shop Owner')}
              className="group relative bg-white border-2 border-green-100 rounded-2xl p-8 hover:border-green-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Store size={120} className="text-green-600 -mt-6 -mr-6" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <Store size={32} />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">I am a Shop Owner</h4>
                <p className="text-gray-600 mb-6">
                  Request deliveries and get your packages to customers faster and cheaper.
                </p>
                <div className="flex items-center text-green-600 font-semibold mt-auto">
                  <span>Join as Shop Owner</span>
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 py-8 text-center text-gray-500 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} CRBDOpti. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
