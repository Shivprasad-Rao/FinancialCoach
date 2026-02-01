import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { Dashboard } from './features/dashboard/Dashboard';
import { Analytics } from './features/analytics/Analytics';

import { Subscriptions } from './features/subscriptions/Subscriptions';
import { Goals } from './features/goals/Goals';
import { Advisor } from './features/advisor/Advisor';

import { TransactionsPage } from './pages/TransactionsPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics" element={<Analytics />} />

            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/advisor" element={<Advisor />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
