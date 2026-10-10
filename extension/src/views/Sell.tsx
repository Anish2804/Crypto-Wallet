import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote } from 'lucide-react';
import { useWalletState } from '../hooks/useWallet';

export function Sell() {
  const navigate = useNavigate();
  const [fiatAmount, setFiatAmount] = useState('1000');
  const [cryptoSelect, setCryptoSelect] = useState('SOL');
  
  const { state } = useWalletState();
  const evmAddress = state.accounts?.evm?.[0] || "";
  const solAddress = state.accounts?.solana?.[0] || "";

  const handleCheckout = () => {
    // If selling SOL, use Solana address, otherwise use EVM address
    const walletAddress = cryptoSelect === 'SOL' ? solAddress : evmAddress;
    
    // Using Onramp.money for Crypto-to-Fiat Offramp (supports INR via IMPS/NEFT)
    const onrampUrl = `https://onramp.money/main/sell/?appId=1&coinCode=${cryptoSelect.toLowerCase()}&fiatAmount=${fiatAmount}&walletAddress=${walletAddress}`;
    
    chrome.tabs.create({ url: onrampUrl });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-surface transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold ml-2">Sell Crypto</h2>
      </div>

      <div className="flex-1 flex flex-col gap-6 items-center">
        {/* Value Input */}
        <div className="flex flex-col items-center mt-10 w-full max-w-[250px]">
          <p className="text-sm text-slate-400 font-medium mb-2">You Receive (INR)</p>
          <div className="flex items-center justify-center border-b-2 border-red-400 pb-2 w-full">
            <span className="text-4xl font-bold text-slate-400 mr-2">₹</span>
            <input 
              type="text" 
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              className="bg-transparent text-5xl font-extrabold outline-none text-center w-full"
            />
          </div>
          {Number(fiatAmount) < 640 && (
            <p className="text-red-400 text-xs mt-2 font-medium">Minimum sell amount is ₹640</p>
          )}
        </div>

        {/* Sell Token Select */}
        <div className="bg-surface w-full p-4 rounded-2xl border border-white/10 flex justify-between items-center mt-4">
          <span className="text-slate-300 font-medium">To Sell</span>
          <select 
            value={cryptoSelect} 
            onChange={(e) => setCryptoSelect(e.target.value)}
            className="bg-[#27272a] outline-none text-white font-bold py-2 px-4 rounded-full border border-white/10 cursor-pointer"
          >
            <option value="SOL">Solana (SOL)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDC">USDC (Polygon)</option>
          </select>
        </div>
        
        {/* Provider List */}
        <div className="w-full mt-4 flex flex-col gap-3 animate-slide-up-delayed">
           <h3 className="text-sm font-bold text-slate-400">Providers</h3>
           
           {/* Active Provider */}
           <div className="flex items-center justify-between bg-red-400/5 p-4 rounded-2xl border border-red-400/50 relative overflow-hidden">
             <div className="absolute inset-0 bg-red-400/10 pointer-events-none"></div>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                   <span className="text-black font-extrabold text-xs">O</span>
                </div>
                 <div>
                  <p className="font-bold text-white">Onramp.money <span className="text-[10px] bg-red-400 text-black px-1.5 py-0.5 rounded-md ml-1 font-bold">Direct Bank</span></p>
                  <p className="text-xs text-red-400">≈ {(Number(fiatAmount) / 12500).toFixed(4)} {cryptoSelect}</p>
                </div>
             </div>
             <p className="text-sm font-medium text-slate-300">IMPS, NEFT</p>
           </div>
           
           {/* Disabled Provider */}
           <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-white/10 opacity-60">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                   <span className="text-white font-extrabold text-xs">T</span>
                </div>
                 <div>
                  <p className="font-bold">Transak</p>
                  <p className="text-xs text-slate-400">Unavailable (API key required)</p>
                </div>
             </div>
             <p className="text-sm font-medium">SEPA / Swift</p>
           </div>
        </div>

      </div>

      <button 
        onClick={handleCheckout}
        disabled={!fiatAmount || Number(fiatAmount) < 640}
        className="w-full bg-red-400 text-black font-extrabold tracking-wide text-lg py-4 rounded-full hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6 flex justify-center items-center gap-2 shadow-lg shadow-red-400/20"
      >
        <Banknote size={20} /> Sell {cryptoSelect}
      </button>
      <p className="text-center text-xs text-slate-500 mt-3">Powered by Onramp.money</p>
    </div>
  );
}
