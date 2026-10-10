import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowLeft, Copy, Check, AlertTriangle } from 'lucide-react';
import { generateMnemonic, createVault } from '../hooks/useWallet';

export function WalletCreation() {
  const navigate = useNavigate();
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
    <div className="flex flex-col min-h-screen bg-background text-text p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">
          {step === 1 ? "Secure your wallet" : "Create Password"}
        </h2>
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex gap-3">
            <AlertTriangle className="text-orange-500 shrink-0" size={24} />
            <p className="text-sm text-orange-200">
              Write down this secret recovery phrase and keep it safe. If you lose it, you will lose access to your funds forever.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {mnemonic.map((word, i) => (
              <div key={i} className="bg-surface border border-slate-700 py-2 px-3 rounded-lg flex gap-2 items-center">
                <span className="text-xs text-slate-500 w-4">{i + 1}.</span>
                <span className="text-sm font-medium">{word}</span>
              </div>
            ))}
          </div>

          <button onClick={handleCopy} className="flex items-center justify-center gap-2 text-primary text-sm font-semibold hover:text-blue-400 transition mb-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />} 
            {copied ? "Copied to clipboard" : "Copy to clipboard"}
          </button>

          <div className="mt-8">
            <Button fullWidth onClick={() => setStep(2)}>I saved my recovery phrase</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <p className="text-slate-400 text-sm mb-6">
            This password will unlock your NOVA wallet on this device only. It cannot be used to recover your wallet.
          </p>
          
          <div className="flex flex-col gap-4 mb-auto">
            <input 
              type="password" 
              placeholder="New Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
            <input 
              type="password" 
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-surface border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition"
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
