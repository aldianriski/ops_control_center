import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InfraOps from './pages/InfraOps';
import FinOps from './pages/FinOps';
import Reports from './pages/Reports';
import SOPs from './pages/SOPs';

function App() {
  const { isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="infra" element={<InfraOps />} />
          <Route path="finops" element={<FinOps />} />
          <Route path="reports" element={<Reports />} />
          <Route path="sops" element={<SOPs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
