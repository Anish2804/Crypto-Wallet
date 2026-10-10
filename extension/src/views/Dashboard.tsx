import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Repeat, Settings, Copy, Check, Lock, CreditCard } from 'lucide-react';
import { useWalletState, getBalances, fetchActivity } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [balances, setBalances] = useState({ eth: "0.00", solana: "0.00", btc: "0.00" });
  const [prices, setPrices] = useState({ eth: 2800, solana: 145, btc: 64000 });
  const [changes, setChanges] = useState({ eth: 0, solana: 0, btc: 0 });
  const { state } = useWalletState();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,bitcoin&vs_currencies=usd&include_24hr_change=true')
      .then(res => res.json())
      .then(data => {
        if (data.ethereum && data.solana && data.bitcoin) {
          setPrices({
            eth: data.ethereum.usd,
            solana: data.solana.usd,
            btc: data.bitcoin.usd
          });
          setChanges({
            eth: data.ethereum.usd_24h_change || 0,
            solana: data.solana.usd_24h_change || 0,
            btc: data.bitcoin.usd_24h_change || 0
          });
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!state.isLocked && state.hasVault) {
      getBalances().then((res) => {
        if (res.success && res.balances) {
          // Format decimals nicely for display
          setBalances({
            eth: Number(res.balances.eth).toFixed(4),
            solana: Number(res.balances.solana).toFixed(4),
            btc: Number(res.balances.btc || 0).toFixed(4)
          });
        }
      });
      fetchActivity().then((res) => {
        if (res.success && res.activity) {
          setActivities(res.activity);
        }
      });
    }
  }, [state.isLocked, state.hasVault]);

  const evmAddress = state.accounts?.evm?.[0] || "0x0000000000000000000000000000000000000000";

  // We'll just show EVM by default for now
  const displayAddress = `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(evmAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (state.isLocked) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen p-6">
          <Lock className="text-slate-400 w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Wallet Locked</h2>
          <p className="text-slate-400 text-sm mb-6">Please unlock your wallet to view the dashboard.</p>
          <button onClick={() => navigate('/')} className="bg-primary px-4 py-2 rounded-xl text-white">Go to Unlock</button>
       </div>
     );
  }

  const totalBalanceUsd = (Number(balances.eth) * prices.eth) + (Number(balances.solana) * prices.solana) + (Number(balances.btc) * prices.btc);
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBalanceUsd);

  let totalChangePct = 0;
  if (totalBalanceUsd > 0) {
    const ethValue24hAgo = (Number(balances.eth) * prices.eth) / (1 + changes.eth / 100);
    const solValue24hAgo = (Number(balances.solana) * prices.solana) / (1 + changes.solana / 100);
    const btcValue24hAgo = (Number(balances.btc) * prices.btc) / (1 + changes.btc / 100);
    const totalValue24hAgo = ethValue24hAgo + solValue24hAgo + btcValue24hAgo;
    
    totalChangePct = ((totalBalanceUsd - totalValue24hAgo) / totalValue24hAgo) * 100;
  }

  const isPositive = totalChangePct >= 0;
  const changeText = `${isPositive ? '+' : ''}${totalChangePct.toFixed(2)}% (24h)`;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white animate-fade-in font-['Outfit'] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-[#1C1C1E] p-1.5 pr-4 rounded-full transition" 
          onClick={handleCopy}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">Account 1</span>
            <span className="text-[11px] text-slate-400 font-medium leading-tight flex items-center gap-1 mt-0.5">
              {displayAddress} {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} className="text-slate-400" />}
            </span>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <Settings size={22} className="text-slate-400 hover:text-white cursor-pointer transition" onClick={() => navigate('/settings')} />
        </div>
      </div>

      {/* Main Card (The Phantom "Island") */}
      <div className="bg-[#1C1C1E] mx-4 mt-2 mb-6 rounded-[32px] py-10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
        <h2 className="text-[44px] font-extrabold tracking-tight relative z-10">{formattedTotal}</h2>
        <p className={`text-sm mt-1 font-semibold relative z-10 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {changeText}
        </p>
      </div>

      {/* 4 Action Buttons */}
      <div className="flex justify-center gap-3 px-4 mb-8">
        <button className="flex-1 bg-[#1C1C1E] rounded-3xl py-4 flex flex-col items-center gap-2 hover:bg-[#27272A] transition" onClick={() => navigate('/send')}>
          <ArrowUpRight size={20} className="text-white" />
          <span className="text-[13px] font-bold text-white">Send</span>
        </button>
        <button className="flex-1 bg-[#1C1C1E] rounded-3xl py-4 flex flex-col items-center gap-2 hover:bg-[#27272A] transition" onClick={() => navigate('/receive')}>
          <ArrowDownRight size={20} className="text-white" />
          <span className="text-[13px] font-bold text-white">Receive</span>
        </button>
        <button className="flex-1 bg-[#1C1C1E] rounded-3xl py-4 flex flex-col items-center gap-2 hover:bg-[#27272A] transition" onClick={() => navigate('/buy')}>
          <CreditCard size={20} className="text-white" />
          <span className="text-[13px] font-bold text-white">Buy</span>
        </button>
        <button className="flex-1 bg-[#1C1C1E] rounded-3xl py-4 flex flex-col items-center gap-2 hover:bg-[#27272A] transition" onClick={() => navigate('/swap')}>
          <Repeat size={20} className="text-white" />
          <span className="text-[13px] font-bold text-white">Swap</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-5 px-6 mb-2">
        <button 
          className={`text-[17px] font-extrabold transition ${activeTab === 'tokens' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
        <button 
          className={`text-[17px] font-extrabold transition ${activeTab === 'activity' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>
      
      {/* Content */}
      <div className="px-3">
        {activeTab === 'tokens' ? (
          <div className="flex flex-col gap-1">
           <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1C1C1E] transition cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-[#627EEA] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">ETH</div>
                 <div>
                    <p className="text-[15px] font-bold text-white leading-tight">Ethereum</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-0.5">{balances.eth} ETH</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[15px] font-bold text-white leading-tight">${(Number(balances.eth) * prices.eth).toFixed(2)}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1C1C1E] transition cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-black border border-[#14F195] flex items-center justify-center text-[10px] font-bold text-[#14F195] shadow-lg">SOL</div>
                 <div>
                    <p className="text-[15px] font-bold text-white leading-tight">Solana</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-0.5">{balances.solana} SOL</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[15px] font-bold text-white leading-tight">${(Number(balances.solana) * prices.solana).toFixed(2)}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1C1C1E] transition cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-[#F7931A] flex items-center justify-center text-[10px] font-bold text-white shadow-lg">BTC</div>
                 <div>
                    <p className="text-[15px] font-bold text-white leading-tight">Bitcoin</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-0.5">{balances.btc} BTC</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[15px] font-bold text-white leading-tight">${(Number(balances.btc) * prices.btc).toFixed(2)}</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2">
             {activities.length === 0 ? (
               <div className="text-center py-12 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-4 text-slate-500">
                   <ArrowDownRight size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-1">No activity yet</h3>
                 <p className="text-sm text-slate-500">Buy or receive tokens to get started</p>
               </div>
             ) : (
               activities.map(act => (
                 <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#1C1C1E] transition">
                   <div className="flex items-center gap-3">
                     <div className="w-11 h-11 rounded-full bg-[#1C1C1E] flex items-center justify-center">
                        {act.type === 'receive' ? <ArrowDownRight size={20} className="text-green-400" /> : <ArrowUpRight size={20} className="text-slate-400" />}
                     </div>
                     <div>
                        <p className="text-[15px] font-bold leading-tight">{act.type === 'receive' ? 'Received' : 'Sent'} {act.currency}</p>
                        <p className="text-[13px] text-slate-400 mt-0.5 leading-tight">{new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-[15px] font-bold leading-tight ${act.type === 'receive' ? 'text-green-400' : 'text-white'}`}>
                        {act.type === 'receive' ? '+' : '-'}{act.amount} {act.currency}
                      </p>
                      <p className={`text-[13px] mt-0.5 leading-tight ${act.status === 'Failed' ? 'text-red-400' : 'text-slate-400'}`}>{act.status}</p>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>

      {/* Optional: Phantom-style Bottom Nav Bar placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-4 z-50">
         <div className="p-2 cursor-pointer text-white" onClick={() => { navigate('/dashboard'); setActiveTab('tokens'); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
         </div>
         <div className="p-2 cursor-pointer text-slate-500 hover:text-white transition" onClick={() => navigate('/swap')}>
            <Repeat size={24} />
         </div>
         <div className="p-2 cursor-pointer text-slate-500 hover:text-white transition" onClick={() => { setActiveTab('activity'); window.scrollTo(0, 0); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
         </div>
         <div className="p-2 cursor-pointer text-slate-500 hover:text-white transition" onClick={() => window.open('https://jup.ag', '_blank')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
         </div>
      </div>
    </div>
  );
}
