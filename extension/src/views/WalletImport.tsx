import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';
import { createVault } from '../hooks/useWallet';

export function WalletImport() {
  const navigate = useNavigate();
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleImport = async () => {
    const words = mnemonicInput.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      alert("Invalid recovery phrase. Must be 12 or 24 words.");
      return;
    }
    if (password !== confirmPassword || password.length < 8) {
      alert("Passwords must match and be at least 8 characters");
      return;
    }

    const res = await createVault(words, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      alert("Failed to import vault");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">Import Wallet</h2>
      </div>

      <div className="flex-1 flex flex-col">
        <p className="text-slate-400 text-sm mb-4">
          Enter your 12 or 24-word secret recovery phrase to restore your wallet.
        </p>

        <textarea 
          placeholder="Paste your recovery phrase here, separating words by spaces..."
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          className="bg-surface border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition h-32 resize-none mb-4"
        ></textarea>

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
        </div>

        <div className="mt-8">
          <Button fullWidth onClick={handleImport}>Import Wallet</Button>
        </div>
      </div>
    </div>
  );
}
