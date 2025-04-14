import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollHeight - scrollTop === clientHeight;
    setIsScrolledToBottom(isBottom);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Terms of Service | Piano Tutorial App</title>
        <meta name="description" content="Read our Terms of Service for the Piano Tutorial App" />
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <span className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</span>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div 
              className="prose prose-indigo max-h-[60vh] overflow-y-auto mb-6"
              onScroll={handleScroll}
            >
              <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing or using our piano tutorial service ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Service.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">2. Subscription Requirements</h2>
              <p className="text-gray-600">
                Access to premium features requires payment. All payments are final and non-refundable, except where required by law. Subscriptions automatically renew unless canceled.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">3. User Responsibilities</h2>
              <p className="text-gray-600">
                You agree to:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>Maintain account security</li>
                <li>Use content for personal, non-commercial purposes only</li>
                <li>Not share, resell, or redistribute our materials</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">4. Prohibited Conduct</h2>
              <p className="text-gray-600">
                You may not:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>Reverse engineer or hack our systems</li>
                <li>Use automated tools to access content</li>
                <li>Violate copyright laws</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">5. Intellectual Property</h2>
              <p className="text-gray-600">
                All tutorial content, including videos and sheet music, is protected by copyright and owned by our company.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">6. Termination</h2>
              <p className="text-gray-600">
                We may terminate accounts for violations of these Terms without notice.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                We are not liable for any indirect damages resulting from Service use.
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-6">8. Governing Law</h2>
              <p className="text-gray-600">
                These Terms are governed by the laws.
              </p>
            </div>

            <div className={`transition-opacity duration-300 ${isScrolledToBottom ? 'opacity-100' : 'opacity-0'}`}>
          
              <div className="mt-4 flex justify-end">
               <Link to='/signup'> <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={!isScrolledToBottom}
                >
                  Continue
                </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;