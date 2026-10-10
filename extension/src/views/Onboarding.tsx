import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowRight, Download } from 'lucide-react';
import { useWalletState, unlockVault } from '../hooks/useWallet';

export function Onboarding() {
  const navigate = useNavigate();
  const { state } = useWalletState();
  const [password, setPassword] = useState("");

  const handleUnlock = async () => {
    const res = await unlockVault(password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      alert("Incorrect password");
    }
  };
  
  useEffect(() => {
    if (state.hasVault && !state.isLocked) {
      navigate('/dashboard');
    }
  }, [state.hasVault, state.isLocked, navigate]);

  if (state.hasVault) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text p-6">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-24 h-24 bg-white rounded-full mb-8 flex items-center justify-center shadow-2xl shadow-white/10 p-3">
            <img src="/logo.png" alt="Nova Logo" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Welcome Back</h1>
          
          <div className="flex flex-col w-full gap-4 mb-8">
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface border border-white/10 rounded-full px-6 py-3.5 text-white focus:outline-none focus:border-white/30 transition text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <Button fullWidth onClick={handleUnlock}>Unlock Wallet</Button>
          </div>
          <p className="text-sm text-slate-500 hover:text-slate-300 cursor-pointer transition">
            Forgot password? Reset wallet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-24 h-24 bg-white rounded-full mb-8 flex items-center justify-center shadow-2xl shadow-white/10 p-3 transform hover:scale-105 transition">
          <img src="/logo.png" alt="Nova Logo" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">NOVA</h1>
        <p className="text-slate-400 mb-10 text-center text-base leading-relaxed max-w-xs">
          Your secure, self-custodial portal to the multi-chain universe.
        </p>

        <div className="flex flex-col w-full gap-4">
          <Button fullWidth onClick={() => navigate('/create-wallet')}>
            Create New Wallet <ArrowRight size={18} />
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/import-wallet')}>
            <Download size={18} /> Import Recovery Phrase
          </Button>
        </div>
      </div>
    </div>
  );
}
