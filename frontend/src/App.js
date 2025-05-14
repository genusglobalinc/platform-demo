import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // ⬅️ add Navigate
import Login from './components/Login';
import Register from './components/Register';
import Feed from './components/Feed';
import Profile from './components/Profile';
import ForgotEmail from './components/ForgotEmail';
import ForgotPassword from './components/ForgotPassword';
import CreatePost from './components/CreatePost';
import ProfileSettings from './components/ProfileSettings';
import Admin from './components/Admin';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/settings" element={<ProfileSettings />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/forgot-email" element={<ForgotEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
