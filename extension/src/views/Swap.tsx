import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownUp, Settings, Loader2 } from 'lucide-react';
import { getSwapQuote } from '../hooks/useWallet';

export function Swap() {
  const navigate = useNavigate();
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [payToken, setPayToken] = useState('ETH');
  const [receiveToken, setReceiveToken] = useState('USDC');
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapTokens = () => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
    setPayAmount(receiveAmount);
    setReceiveAmount(''); // Need new quote
  };

  const getQuote = async (amount: string) => {
    setPayAmount(amount);
    if (!amount || isNaN(Number(amount))) {
      setReceiveAmount('');
      return;
    }

    setIsLoading(true);
    try {
      const res = await getSwapQuote(payToken, receiveToken, amount);
      if (res && res.quote) {
        setReceiveAmount(res.quote);
      } else {
        // Fallback mock
        setReceiveAmount((Number(amount) * 2800).toFixed(2));
      }
    } catch (e) {
      console.error("Quote failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSwap = () => {
    // In production, this would send an execute transaction to 0x or 1inch router via the background
    alert('Swap executed successfully! (Mock)');
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-surface transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Swap</h2>
        <button className="p-2 -mr-2 rounded-full hover:bg-surface transition">
          <Settings size={20} className="text-slate-400 hover:text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 animate-slide-up-delayed">
        {/* Pay Section */}
        <div className="bg-surface p-4 rounded-2xl border border-slate-700 focus-within:border-primary transition relative">
          <p className="text-xs text-slate-400 mb-2 font-medium">You Pay</p>
          <div className="flex items-center justify-between">
            <input 
              type="text" 
              placeholder="0.0" 
              value={payAmount}
              onChange={(e) => getQuote(e.target.value)}
              className="bg-transparent text-3xl font-bold outline-none w-2/3"
            />
            <button className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-700 transition">
              <span className="font-bold">{payToken}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Balance: 1.25 {payToken}</p>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-4 relative z-10">
          <button 
            onClick={handleSwapTokens}
            className="bg-slate-800 p-2 rounded-xl border-4 border-background hover:border-slate-700 transition"
          >
            <ArrowDownUp size={20} className="text-primary" />
          </button>
        </div>

        {/* Receive Section */}
        <div className="bg-surface p-4 rounded-2xl border border-slate-700 mt-2">
           <p className="text-xs text-slate-400 mb-2 font-medium">You Receive</p>
           <div className="flex items-center justify-between">
            {isLoading ? (
               <Loader2 className="animate-spin text-slate-500 w-8 h-8" />
            ) : (
              <input 
                type="text" 
                readOnly
                placeholder="0.0" 
                value={receiveAmount}
                className="bg-transparent text-3xl font-bold outline-none w-2/3 text-white"
              />
            )}
            <button className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-700 transition">
              <span className="font-bold">{receiveToken}</span>
            </button>
          </div>
        </div>

        {/* Swap Details */}
        {receiveAmount && !isLoading && (
          <div className="p-4 bg-surface/50 rounded-xl mt-4 text-sm text-slate-300 border border-slate-800">
            <div className="flex justify-between mb-2">
              <span>Rate</span>
              <span>1 {payToken} ≈ {(Number(receiveAmount) / Number(payAmount)).toFixed(2)} {receiveToken}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Network Fee</span>
              <span>~$2.50</span>
            </div>
            <div className="flex justify-between">
              <span>Slippage Tolerance</span>
              <span className="text-primary font-medium">0.5%</span>
            </div>
          </div>
        )}

      </div>

      <button 
        onClick={executeSwap}
        disabled={!payAmount || isLoading || Number(payAmount) <= 0}
        className="w-full bg-primary text-black font-bold text-lg py-4 rounded-2xl hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition mt-auto"
      >
        {isLoading ? 'Fetching Quote...' : 'Review Swap'}
      </button>
    </div>
  );
}
