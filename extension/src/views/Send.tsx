import { useState } from 'react';
import { ArrowLeft, Send as SendIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { sendTransaction } from '../hooks/useWallet';

export function Send() {
  const navigate = useNavigate();
  const [chain, setChain] = useState<'ethereum' | 'polygon' | 'base' | 'solana'>('ethereum');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!address || !amount) return;
    setIsSending(true);
    
    const res = await sendTransaction(chain, address, amount);
    setIsSending(false);

    if (res.success) {
      alert(`Transaction Sent! Hash: ${res.hash}`);
      navigate('/dashboard');
    } else {
      alert(`Transaction Failed: ${res.error}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text animate-fade-in">
      <div className="flex items-center p-4 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">Send</h1>
      </div>

      <div className="p-6 flex flex-col flex-1 animate-slide-up-delayed">
        <label className="text-sm font-medium text-slate-400 mb-2">Network</label>
        <select 
          value={chain} 
          onChange={(e: any) => setChain(e.target.value)}
          className="bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition mb-6"
        >
          <option value="ethereum">Ethereum (ETH)</option>
          <option value="polygon">Polygon (POL)</option>
          <option value="base">Base (ETH)</option>
          <option value="solana">Solana (SOL)</option>
        </select>

        <label className="text-sm font-medium text-slate-400 mb-2">Send To</label>
        <input 
          type="text" 
          placeholder="Paste address here" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition mb-6"
        />

        <label className="text-sm font-medium text-slate-400 mb-2">Amount</label>
        <div className="relative mb-8">
          <input 
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
            {chain === 'solana' ? 'SOL' : 'ETH'}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <Button fullWidth onClick={handleSend} disabled={isSending || !address || !amount}>
            {isSending ? (
              <span className="flex items-center justify-center gap-2">Sending...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <SendIcon size={18} /> Send
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
