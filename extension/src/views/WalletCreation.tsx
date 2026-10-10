import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, Check, AlertTriangle } from 'lucide-react';
import { generateMnemonic, createVault, addWallet } from '../hooks/useWallet';

export function WalletCreation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAddingWallet = new URLSearchParams(location.search).get('addWallet') === 'true';
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    generateMnemonic().then(setMnemonic);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (password !== confirmPassword || password.length < 8) {
      alert("Passwords must match and be at least 8 characters");
      return;
    }
    const res = await createVault(mnemonic, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      alert("Failed to create vault");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-mesh text-text p-6 relative">
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      
      <div className="flex items-center mb-6 z-10 relative">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="p-2 -ml-2 text-slate-300 hover:text-white transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">
          {step === 1 ? "Secure your wallet" : "Create Password"}
        </h2>
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col z-10 relative">
          <div className="glass-panel bg-orange-500/10 border-orange-500/30 p-4 rounded-xl mb-6 flex gap-3">
            <AlertTriangle className="text-orange-400 shrink-0" size={24} />
            <p className="text-sm text-orange-100/90 font-medium leading-relaxed">
              Write down this secret recovery phrase and keep it safe. If you lose it, you will lose access to your funds forever.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {mnemonic.map((word, i) => (
              <div key={i} className="glass-panel py-2.5 px-3 rounded-lg flex gap-2 items-center justify-center">
                <span className="text-[11px] text-slate-400/80">{i + 1}.</span>
                <span className="text-[15px] font-bold text-white tracking-wide">{word}</span>
              </div>
            ))}
          </div>

          <button onClick={handleCopy} className="flex items-center justify-center gap-2 text-primary text-sm font-semibold hover:text-blue-400 transition mb-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />} 
            {copied ? "Copied to clipboard" : "Copy to clipboard"}
          </button>

          <div className="mt-8">
            <Button fullWidth onClick={() => {
              if (isAddingWallet) {
                addWallet(mnemonic).then(() => navigate('/dashboard'));
              } else {
                setStep(2);
              }
            }}>I saved my recovery phrase</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col z-10 relative">
          <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
            This password will unlock your NOVA wallet on this device only. It cannot be used to recover your wallet.
          </p>
          
          <div className="flex flex-col gap-4 mb-auto">
            <input 
              type="password" 
              placeholder="New Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-panel rounded-xl px-5 py-4 text-white focus:outline-none focus:border-white/40 transition placeholder:text-slate-400 font-medium"
            />
            <input 
              type="password" 
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-panel rounded-xl px-5 py-4 text-white focus:outline-none focus:border-white/40 transition placeholder:text-slate-400 font-medium"
            />
            <div className="flex items-start gap-2 mt-2">
               <input type="checkbox" id="terms" className="mt-1" />
               <label htmlFor="terms" className="text-xs text-slate-400 leading-tight">
                 I understand that NOVA cannot recover this password for me.
               </label>
            </div>
          </div>

          <div className="mt-8">
            <Button fullWidth onClick={handleCreate}>Create Wallet</Button>
          </div>
        </div>
      )}
    </div>
  );
}
