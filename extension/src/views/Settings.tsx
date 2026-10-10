import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield } from 'lucide-react';

export function Settings() {
  const navigate = useNavigate();

  const handleLock = () => {
    chrome.runtime.sendMessage({ type: "LOCK_VAULT" }, (response) => {
      if (response?.success) {
        navigate('/');
      }
    });
  };

  return (
    <div className="flex flex-col h-[600px] w-[375px] bg-background text-text">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-slate-800">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold ml-2">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Security Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Security</h2>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <button 
              onClick={handleLock}
              className="w-full flex items-center p-4 hover:bg-slate-800 transition text-left"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4">
                <Lock size={18} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">Lock Wallet</h3>
                <p className="text-xs text-slate-400 mt-0.5">Require password to open</p>
              </div>
            </button>
            <div className="h-px bg-slate-800 mx-4"></div>
            <button 
              className="w-full flex items-center p-4 hover:bg-slate-800 transition text-left opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mr-4">
                <Shield size={18} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">Show Recovery Phrase</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hidden for security in this demo</p>
              </div>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 mt-6 uppercase tracking-wider">About</h2>
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-300">Version</span>
              <span className="text-slate-500 font-mono text-sm">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Network</span>
              <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div> Mainnet
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
