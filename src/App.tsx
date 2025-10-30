import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Marketplace } from './pages/Marketplace';
import { ItemDetails } from './pages/ItemDetails';
import { ProviderDashboard } from './pages/ProviderDashboard';
import { RenterDashboard } from './pages/RenterDashboard';
import { Profile } from './pages/Profile';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/provider"
            element={
              <ProtectedRoute requireRole="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/renter"
            element={
              <ProtectedRoute requireRole="renter">
                <RenterDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
