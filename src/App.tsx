import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ProceduresPage from './pages/ProceduresPage';
import ConversationScriptsPage from './pages/ConversationScriptsPage';
import SimulationsPage from './pages/SimulationsPage';
import SystemsPage from './pages/SystemsPage';
import Layout from './components/Layout';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="knowledge" element={<KnowledgeBasePage />} />
        <Route path="procedures" element={<ProceduresPage />} />
        <Route path="scripts" element={<ConversationScriptsPage />} />
        <Route path="simulations" element={<SimulationsPage />} />
        <Route path="systems" element={<SystemsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
