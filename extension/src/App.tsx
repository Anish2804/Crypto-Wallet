import { HashRouter, Routes, Route } from 'react-router-dom';
import { Onboarding } from './views/Onboarding';
import { Dashboard } from './views/Dashboard';
import { WalletCreation } from './views/WalletCreation';
import { WalletImport } from './views/WalletImport';
import { Receive } from './views/Receive';
import { Send } from './views/Send';
import { Swap } from './views/Swap';
import { Buy } from './views/Buy';
import { Sell } from './views/Sell';
import { Settings } from './views/Settings';
import { Approve } from './views/Approve';
import { SignTx } from './views/SignTx';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-wallet" element={<WalletCreation />} />
        <Route path="/import-wallet" element={<WalletImport />} />
        <Route path="/receive" element={<Receive />} />
        <Route path="/send" element={<Send />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/approve" element={<Approve />} />
        <Route path="/signtx" element={<SignTx />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
