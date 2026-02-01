import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

import { Dashboard } from './features/dashboard/Dashboard';
import { Analytics } from './features/analytics/Analytics';
import { Subscriptions } from './features/subscriptions/Subscriptions';
import { Goals } from './features/goals/Goals';
import { Advisor } from './features/advisor/Advisor';
import { TransactionsPage } from './pages/TransactionsPage';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes - Redirect to / if logged in */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected Routes - Redirect to /login if not logged in */}
            <Route path="/*" element={
              <ProtectedRoute>
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
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
