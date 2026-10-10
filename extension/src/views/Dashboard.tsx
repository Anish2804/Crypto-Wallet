import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, Repeat, Settings, Copy, Check, Lock, CreditCard, Plus, X, Wallet, Download, Trash2 } from 'lucide-react';
import { useWalletState, getBalances, fetchActivity, switchWallet, deleteWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'activity'>('tokens');
  const [balances, setBalances] = useState({ eth: "0.00", solana: "0.00", btc: "0.00" });
  const [prices, setPrices] = useState({ eth: 2800, solana: 145, btc: 64000 });
  const [changes, setChanges] = useState({ eth: 0, solana: 0, btc: 0 });
  const { state, fetchState } = useWalletState();
  const navigate = useNavigate();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const handleAddAccount = () => {
    navigate('/create-wallet?addWallet=true');
  };

  const selectAccount = async (id: string) => {
    await switchWallet(id);
    fetchState();
    
    // Fetch new balances and activity for the new account
    const balRes = await getBalances();
    if (balRes.success) setBalances(balRes.balances);
    const actRes = await fetchActivity();
    if (actRes.success) setActivities(actRes.activity);
    
    setIsDrawerOpen(false);
  };

  const handleDeleteWallet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(state.wallets.length <= 1) {
      alert("Cannot delete the last wallet");
      return;
    }
    if(confirm("Are you sure you want to delete this wallet?")) {
       await deleteWallet(id);
       fetchState();
       const balRes = await getBalances();
       if (balRes.success) setBalances(balRes.balances);
       const actRes = await fetchActivity();
       if (actRes.success) setActivities(actRes.activity);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(true);
  };

  const activeWalletName = state.wallets?.find(w => w.id === state.activeWalletId)?.name || 'Account 1';

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
    <div className="flex flex-col min-h-screen bg-mesh text-white animate-fade-in font-['Outfit'] pb-20 relative">
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-transparent z-10 relative">
        <div 
          className="flex items-center gap-3 cursor-pointer glass-button p-2 pr-5 rounded-full transition" 
          onClick={handleCopy}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleDrawer(); }} title="Switch or Add Accounts">
            <span className="text-sm font-bold text-white leading-tight flex items-center gap-1">{activeWalletName} ▾</span>
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
      <div className="glass-panel mx-4 mt-2 mb-6 rounded-[32px] py-10 flex flex-col items-center justify-center relative overflow-hidden z-10 transition-transform duration-500 hover:scale-[1.02]">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 rounded-[32px] pointer-events-none"></div>
        <div className="absolute w-40 h-40 bg-purple-500/20 blur-3xl rounded-full top-0 left-0 animate-pulse-slow"></div>
        <h2 className="text-[44px] font-extrabold tracking-tight relative z-10 text-gradient drop-shadow-lg">{formattedTotal}</h2>
        <p className={`text-sm mt-1 font-semibold relative z-10 ${isPositive ? 'text-[#14F195] drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-red-400'}`}>
          {changeText}
        </p>
      </div>

      {/* 4 Action Buttons */}
      <div className="flex justify-center gap-3 px-4 mb-8 z-10 relative">
        <button className="flex-1 glass-button rounded-[24px] py-4 flex flex-col items-center gap-2" onClick={() => navigate('/send')}>
          <ArrowUpRight size={20} className="text-white drop-shadow-md" />
          <span className="text-[13px] font-bold text-white tracking-wide">Send</span>
        </button>
        <button className="flex-1 glass-button rounded-[24px] py-4 flex flex-col items-center gap-2" onClick={() => navigate('/receive')}>
          <ArrowDownRight size={20} className="text-white drop-shadow-md" />
          <span className="text-[13px] font-bold text-white tracking-wide">Receive</span>
        </button>
        <button className="flex-1 glass-button rounded-[24px] py-4 flex flex-col items-center gap-2" onClick={() => navigate('/buy')}>
          <CreditCard size={20} className="text-white drop-shadow-md" />
          <span className="text-[13px] font-bold text-white tracking-wide">Buy</span>
        </button>
        <button className="flex-1 glass-button rounded-[24px] py-4 flex flex-col items-center gap-2" onClick={() => navigate('/swap')}>
          <Repeat size={20} className="text-white drop-shadow-md" />
          <span className="text-[13px] font-bold text-white tracking-wide">Swap</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-6 mb-4 z-10 relative">
        <button 
          className={`text-[17px] font-extrabold transition-all duration-300 ${activeTab === 'tokens' ? 'text-white scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </button>
        <button 
          className={`text-[17px] font-extrabold transition-all duration-300 ${activeTab === 'activity' ? 'text-white scale-105 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>
      
      {/* Content */}
      <div className="px-3 z-10 relative">
          <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between p-4 rounded-[20px] glass-button cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#627EEA] to-[#8A9DF0] flex items-center justify-center text-[11px] font-bold text-white shadow-[0_0_15px_rgba(98,126,234,0.4)]">ETH</div>
                 <div>
                    <p className="text-[16px] font-bold text-white leading-tight">Ethereum</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-1">{balances.eth} ETH</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[16px] font-bold text-white leading-tight">${(Number(balances.eth) * prices.eth).toFixed(2)}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-[20px] glass-button cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-black to-slate-800 border border-[#14F195]/40 flex items-center justify-center text-[11px] font-bold text-[#14F195] shadow-[0_0_15px_rgba(20,241,149,0.3)]">SOL</div>
                 <div>
                    <p className="text-[16px] font-bold text-white leading-tight">Solana</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-1">{balances.solana} SOL</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[16px] font-bold text-white leading-tight">${(Number(balances.solana) * prices.solana).toFixed(2)}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-[20px] glass-button cursor-pointer" onClick={() => navigate('/send')}>
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#F7931A] to-[#F9A825] flex items-center justify-center text-[11px] font-bold text-white shadow-[0_0_15px_rgba(247,147,26,0.4)]">BTC</div>
                 <div>
                    <p className="text-[16px] font-bold text-white leading-tight">Bitcoin</p>
                    <p className="text-[13px] text-slate-400 font-medium leading-tight mt-1">{balances.btc} BTC</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-[16px] font-bold text-white leading-tight">${(Number(balances.btc) * prices.btc).toFixed(2)}</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             {activities.length === 0 ? (
               <div className="text-center py-12 flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4 text-slate-400">
                   <ArrowDownRight size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-1">No activity yet</h3>
                 <p className="text-sm text-slate-400">Buy or receive tokens to get started</p>
               </div>
             ) : (
               activities.map(act => (
                 <div key={act.id} className="flex items-center justify-between p-4 rounded-[20px] glass-panel transition-all hover:bg-white/5">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        {act.type === 'receive' ? <ArrowDownRight size={22} className="text-[#14F195]" /> : <ArrowUpRight size={22} className="text-slate-300" />}
                     </div>
                     <div>
                        <p className="text-[16px] font-bold leading-tight text-white">{act.type === 'receive' ? 'Received' : 'Sent'} {act.currency}</p>
                        <p className="text-[13px] text-slate-400 mt-1 leading-tight">{new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-[16px] font-bold leading-tight ${act.type === 'receive' ? 'text-[#14F195]' : 'text-white'}`}>
                        {act.type === 'receive' ? '+' : '-'}{act.amount} {act.currency}
                      </p>
                      <p className={`text-[13px] mt-1 leading-tight ${act.status === 'Failed' ? 'text-red-400' : 'text-slate-400'}`}>{act.status}</p>
                   </div>
                 </div>
               ))
             )}
          </div>
        )}
      </div>

      {/* Phantom-style Bottom Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-[72px] glass-panel border-t border-white/10 flex items-center justify-around px-2 z-40 rounded-t-[32px]">
         <div className="p-3 cursor-pointer text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all" onClick={toggleDrawer} title="Accounts">
            <Plus size={26} strokeWidth={2.5} />
         </div>
         <div className="p-3 cursor-pointer text-white bg-white/10 rounded-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all" onClick={() => { navigate('/dashboard'); setActiveTab('tokens'); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
         </div>
         <div className="p-3 cursor-pointer text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all" onClick={() => navigate('/swap')}>
            <Repeat size={24} />
         </div>
         <div className="p-3 cursor-pointer text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all" onClick={() => { setActiveTab('activity'); window.scrollTo(0, 0); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
         </div>
      </div>

      {/* Account Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in flex flex-col justify-end">
          <div className="absolute inset-0" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative glass-panel rounded-t-[32px] max-h-[85vh] flex flex-col animate-slide-up pb-safe border-x-0 border-b-0">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Select Account</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 max-h-[50vh]">
              {state.wallets?.map((wallet) => (
                <div 
                  key={wallet.id} 
                  onClick={() => selectAccount(wallet.id)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition ${state.activeWalletId === wallet.id ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Wallet className="text-white" size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{wallet.name}</span>
                      <span className="text-xs text-slate-400">{wallet.evmAddress ? `${wallet.evmAddress.slice(0, 6)}...${wallet.evmAddress.slice(-4)}` : 'Loading...'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.activeWalletId === wallet.id && <Check size={20} className="text-primary" />}
                    {state.wallets.length > 1 && (
                      <button 
                        onClick={(e) => handleDeleteWallet(wallet.id, e)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                        title="Delete Wallet"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 flex flex-col gap-2">
              <button 
                onClick={handleAddAccount}
                className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-xl transition cursor-pointer text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Plus size={20} className="text-white group-hover:text-primary" />
                </div>
                <span className="font-semibold text-white">Create a new account</span>
              </button>
              
              <button 
                onClick={() => alert("Importing keys coming soon!")}
                className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-xl transition cursor-pointer text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Download size={20} className="text-white group-hover:text-primary" />
                </div>
                <span className="font-semibold text-white">Import existing wallet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
