import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/authContext.jsx';
import LandingPage from "./pages/LandingPage.jsx";
import { Toaster } from 'react-hot-toast';
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import VerifyOtp from './pages/VerifyOtp.jsx';
import Dashboard from "./pages/Dashboard.jsx";

function App() {
const { user, loading } = useAuth();
if(loading) {
  return <p>loading...</p>;
}

  return (
    <>
    <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default App;
