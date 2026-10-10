import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { formatEther } from 'viem';

export const SignTx: React.FC = () => {
  const [origin, setOrigin] = useState<string>('');
  const [txParams, setTxParams] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('id');

  useEffect(() => {
    if (requestId) {
      chrome.runtime.sendMessage({ type: 'GET_APPROVAL_DATA', id: requestId }, (response) => {
        if (response && response.success) {
          setOrigin(response.data.origin);
          setTxParams(response.data.txParams);
        } else {
          setError('Transaction request not found or expired.');
        }
      });
    }
  }, [requestId]);

  const handleResolve = (approved: boolean) => {
    if (!approved) {
      chrome.runtime.sendMessage({ type: 'RESOLVE_TX', id: requestId, approved: false }, () => {
        window.close();
      });
      return;
    }

    setIsProcessing(true);
    chrome.runtime.sendMessage({ type: 'RESOLVE_TX', id: requestId, approved: true }, (response) => {
      setIsProcessing(false);
      if (response && !response.success) {
        setError(response.error);
      } else {
        window.close();
      }
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text p-6">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-slate-300 text-center mb-8">{error}</p>
        <Button onClick={() => window.close()}>Close</Button>
      </div>
    );
  }

  if (!txParams) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const valueEth = txParams.value ? formatEther(BigInt(txParams.value)) : "0";

  return (
    <div className="flex flex-col min-h-screen bg-background text-text">
      <div className="p-4 border-b border-slate-800 text-center">
        <h1 className="text-lg font-bold">Sign Transaction</h1>
      </div>
      
      <div className="p-6 flex-1 flex flex-col items-center">
        <h2 className="text-primary font-medium mb-1">{origin}</h2>
        <p className="text-sm text-slate-400 mb-8">is requesting to send a transaction.</p>

        <div className="w-full glass-panel rounded-2xl p-4 mb-6">
          <div className="flex justify-between mb-4">
            <span className="text-slate-400 text-sm">Amount</span>
            <span className="font-bold">{valueEth} ETH</span>
          </div>
          <div className="flex justify-between mb-4 border-t border-slate-700/50 pt-4">
            <span className="text-slate-400 text-sm">To</span>
            <span className="font-mono text-xs">{txParams.to?.slice(0,6)}...{txParams.to?.slice(-4)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700/50 pt-4">
            <span className="text-slate-400 text-sm">Data</span>
            <span className="font-mono text-xs text-slate-500 max-w-[150px] truncate">
              {txParams.data || "0x"}
            </span>
          </div>
        </div>

        <div className="flex w-full gap-3 mt-auto">
          <Button variant="secondary" onClick={() => handleResolve(false)} disabled={isProcessing} fullWidth>
            Reject
          </Button>
          <Button onClick={() => handleResolve(true)} disabled={isProcessing} fullWidth>
            {isProcessing ? "Confirming..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};
