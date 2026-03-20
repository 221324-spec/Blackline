import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import RequestReset from './pages/RequestReset';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import TraderDashboard from './pages/TraderDashboard';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Resources from './pages/Resources';
import Forum from './pages/Forum';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import AIAnalysis from './pages/AIAnalysis';
import Profile from './pages/Profile';
import TraderProfile from './pages/TraderProfile';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { jwtDecode } from 'jwt-decode';

// Role-based profile router
function RoleBasedProfile() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const decoded = jwtDecode(token);
    const role = decoded.role?.toLowerCase();
    
    if (role === 'trader') {
      return <TraderProfile />;
    } else {
      // Default to general Profile for mentors and admins
      return <Profile />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
}

function RoleBasedDashboard() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const decoded = jwtDecode(token);
    const role = decoded.role?.toLowerCase();
    
    if (role === 'admin') {
      return <AdminDashboard />;
    } else if (role === 'mentor') {
      return <MentorDashboard />;
    } else {
      return <TraderDashboard />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Landing page - full screen without Layout wrapper */}
          <Route path="/" element={<LandingPage />} />
          
          {/* All other routes with Layout wrapper */}
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/verify-email" element={<Layout><VerifyEmail /></Layout>} />
          <Route path="/request-reset" element={<Layout><RequestReset /></Layout>} />
          <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
          <Route path="/dashboard" element={<Layout><PrivateRoute><RoleBasedDashboard /></PrivateRoute></Layout>} />
          <Route path="/trades" element={<Layout><PrivateRoute><Trades /></PrivateRoute></Layout>} />
          <Route path="/analytics" element={<Layout><PrivateRoute><Analytics /></PrivateRoute></Layout>} />
          <Route path="/ai-analysis" element={<Layout><PrivateRoute><AIAnalysis /></PrivateRoute></Layout>} />
          <Route path="/resources" element={<Layout><Resources /></Layout>} />
          <Route path="/forum" element={<Layout><PrivateRoute><Forum /></PrivateRoute></Layout>} />
          <Route path="/admin" element={<Layout><PrivateRoute><Admin /></PrivateRoute></Layout>} />
          <Route path="/profile" element={<Layout><PrivateRoute><RoleBasedProfile /></PrivateRoute></Layout>} />
          {/* Legacy route - redirect to dashboard */}
          <Route path="/old-dashboard" element={<Layout><PrivateRoute><Dashboard /></PrivateRoute></Layout>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
