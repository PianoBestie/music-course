import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PaymentRequired() {
  const location = useLocation();
  const retry = location.state?.retry;
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    if (retry) {
      setIsRetrying(true);
      retry();
      // Reset retry state after a short delay
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  // Optional auto-retry after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (retry) handleRetry();
    }, 5000);
    return () => clearTimeout(timer);
  }, [retry]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Required</h2>
        <p className="text-gray-600 mb-6">
          You need to complete your payment to access this content.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/signup"  // Update to your actual payment route
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Complete Payment
          </Link>
          
          {retry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`w-full font-medium py-2 px-4 rounded-md transition duration-300 ${
                isRetrying 
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {isRetrying ? 'Checking...' : 'Already Paid? Check Status'}
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Need help? <Link to="/contact" className="text-indigo-600 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}