import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const Approve: React.FC = () => {
  const [origin, setOrigin] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('id');

  useEffect(() => {
    if (requestId) {
      chrome.runtime.sendMessage({ type: 'GET_APPROVAL_DATA', id: requestId }, (response) => {
        if (response && response.success) {
          setOrigin(response.data.origin);
          setAddress(response.data.address);
        } else {
          setError('Approval request not found or expired.');
        }
      });
    }
  }, [requestId]);

  const handleResolve = (approved: boolean) => {
    chrome.runtime.sendMessage({ type: 'RESOLVE_APPROVAL', id: requestId, approved }, () => {
      // Close the popup window after resolving
      window.close();
    });
  };

  if (error) {
    return (
      <div className="settings-container">
        <h1 style={{ color: 'var(--nova-red)' }}>Error</h1>
        <p>{error}</p>
        <button className="primary-button" onClick={() => window.close()}>Close</button>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Connect Request</h1>
      </div>
      
      <div className="settings-content" style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--nova-blue)', marginBottom: '10px' }}>{origin}</h2>
          <p style={{ color: 'var(--nova-text-secondary)' }}>would like to connect to your wallet.</p>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '15px', 
          borderRadius: '12px',
          marginBottom: '40px',
          wordBreak: 'break-all'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--nova-text-secondary)', marginBottom: '5px' }}>Requested Address:</p>
          <p style={{ fontFamily: 'monospace' }}>{address}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
          <button 
            onClick={() => handleResolve(false)}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid var(--nova-red)',
              color: 'var(--nova-red)',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Reject
          </button>
          <button 
            className="primary-button" 
            style={{ flex: 1 }}
            onClick={() => handleResolve(true)}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
