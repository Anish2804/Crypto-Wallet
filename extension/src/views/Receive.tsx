import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWalletState } from '../hooks/useWallet';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Receive() {
  const { state } = useWalletState();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<'evm' | 'solana'>('evm');

  const evmAddress = state.accounts?.evm?.[0] || "";
  const solanaAddress = state.accounts?.solana?.[0] || "";

  const currentAddress = selectedChain === 'evm' ? evmAddress : solanaAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(currentAddress);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text animate-fade-in">
      <div className="flex items-center p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">Receive</h1>
      </div>

      <div className="p-6 flex flex-col items-center flex-1 animate-slide-up-delayed">
        <div className="flex bg-surface p-1 rounded-xl w-full mb-8">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${selectedChain === 'evm' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setSelectedChain('evm')}
          >
            Ethereum / EVM
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${selectedChain === 'solana' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setSelectedChain('solana')}
          >
            Solana
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl mb-8">
          <QRCodeSVG value={currentAddress} size={200} level="M" includeMargin={false} />
        </div>

        <p className="text-slate-400 text-sm mb-2 font-medium">Your {selectedChain === 'evm' ? 'Ethereum' : 'Solana'} Address</p>
        
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="bg-surface border border-slate-700 w-full p-4 rounded-xl flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-300 break-all">{currentAddress}</p>
            <button 
              onClick={handleCopy}
              className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition flex-shrink-0"
            >
              {copied === currentAddress ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-slate-300" />}
            </button>
          </div>
          <p className="text-xs text-center text-slate-500 mt-2 leading-relaxed">
            Only send {selectedChain === 'evm' ? 'Ethereum, Polygon, or Base' : 'Solana'} assets to this address. Sending other assets may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
}
