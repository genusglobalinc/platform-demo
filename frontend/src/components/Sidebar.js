import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jwtDecode from "jwt-decode";
import Cookies from 'js-cookie';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState('');
  
  useEffect(() => {
    // Extract user type from token
    try {
      const token = Cookies.get('access_token') || localStorage.getItem('token') || "";
      if (token) {
        const decoded = jwtDecode(token);
        setUserType(decoded.user_type || '');
      }
    } catch (err) {
      console.error('Error decoding token:', err);
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const logout = () => {
    // Clear tokens and redirect to login
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>Lost Gates</h2>
      </div>
      
      <div style={styles.navItems}>
        <div 
          style={{...styles.navItem, ...(isActive('/feed') ? styles.activeNavItem : {})}}
          onClick={() => navigate('/feed')}
        >
          Home
        </div>
        
        <div 
          style={{...styles.navItem, ...(isActive('/profile') ? styles.activeNavItem : {})}}
          onClick={() => navigate('/profile')}
        >
          Profile
        </div>
        
        <div 
          style={{...styles.navItem, ...(isActive('/profile/settings') ? styles.activeNavItem : {})}}
          onClick={() => navigate('/profile/settings')}
        >
          Settings
        </div>
        
        {userType === 'Dev' && (
          <div 
            style={{...styles.navItem, ...(isActive('/create-post') ? styles.activeNavItem : {})}}
            onClick={() => navigate('/create-post')}
          >
            Create Post
          </div>
        )}
        
        {userType === 'Admin' && (
          <div 
            style={{...styles.navItem, ...(isActive('/admin') ? styles.activeNavItem : {})}}
            onClick={() => navigate('/admin')}
          >
            Admin Panel
          </div>
        )}
      </div>
      
      <div style={styles.bottomSection}>
        <button style={styles.logoutButton} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: "250px",
    height: "100vh",
    background: "#121212",
    borderRight: "1px solid #333",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    overflowY: "auto",
  },
  logo: {
    marginBottom: "40px",
    textAlign: "center",
  },
  logoText: {
    color: "#B388EB",
    margin: 0,
    fontSize: "24px",
  },
  navItems: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  navItem: {
    padding: "14px 16px",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#eee",
    fontSize: "16px",
    '&:hover': {
      background: "#333",
    },
  },
  activeNavItem: {
    background: "#B388EB",
    color: "#121212",
    fontWeight: "bold",
  },
  bottomSection: {
    marginTop: "auto",
    paddingTop: "20px",
  },
  logoutButton: {
    width: "100%",
    padding: "12px 16px",
    background: "#E57373",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background 0.2s ease",
    '&:hover': {
      background: "#ef5350",
    },
  }
};

export default Sidebar;
