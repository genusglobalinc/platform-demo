import React, { useState } from 'react';
import { loginUser, verify2FALogin, setup2FA, verify2FA } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import TwoFactorSetup from './TwoFactorSetup';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await loginUser(username, password);
      
      if (response.data.requires_2fa) {
        setTempToken(response.data.temp_token);
        
        if (response.data.requires_setup) {
          // User needs to set up 2FA first
          const setupResponse = await setup2FA(response.data.temp_token);
          setSetupData(setupResponse.data);
          setShowSetup(true);
        } else {
          // User has 2FA enabled, just needs to enter code
          setShow2FA(true);
        }
      } else {
        // This shouldn't happen anymore as 2FA is mandatory
        localStorage.setItem("token", response.data.access_token);
        navigate("/feed");
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Login failed.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async () => {
    try {
      const response = await verify2FALogin(code2FA, tempToken);
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        navigate("/feed");
      } else {
        alert("Failed to verify 2FA code. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Invalid verification code. Please try again.");
      console.error("2FA verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {loading && renderLoadingSpinner()}
      <h1 style={styles.title}>Welcome to Lost Gates</h1>
      <p style={styles.subText}>
        Discover and participate in exclusive game testing events.
      </p>
      
      {!show2FA && !showSetup ? (
        // Show login form initially
        <>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={styles.button} onClick={handleLogin}>Login</button>
          <div style={styles.alt}>
            <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
            {" | "}
            <Link to="/forgot-email" style={styles.link}>Forgot Email?</Link>
          </div>
          <p style={styles.alt}>
            Don't have an account? <Link to="/register" style={styles.link}>Create one</Link>
          </p>
        </>
      ) : showSetup ? (
        // Show 2FA setup if user hasn't set it up yet
        <TwoFactorSetup
          setupData={setupData}
          tempToken={tempToken}
          onComplete={() => {
            setShowSetup(false);
            setShow2FA(true);
          }}
        />
      ) : (
        // Show 2FA verification form
        <>
          <p style={styles.subText}>
            Please enter the verification code from your authenticator app.
          </p>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter 6-digit code"
            value={code2FA}
            onChange={(e) => setCode2FA(e.target.value)}
            maxLength={6}
          />
          <button style={styles.button} onClick={handle2FASubmit}>Verify</button>
        </>
      )}
    </div>
  );
};

const styles = {
  loadingSpinner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #B388EB',
    borderTop: '5px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#B388EB',
    marginTop: '1rem',
    fontSize: '1.2rem',
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  container: {
    width: '90%',
    maxWidth: '400px',
    margin: '2rem auto',
    padding: '1.5rem',
    background: '#121212',
    color: '#eee',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(128,0,128,0.3)',
    boxSizing: 'border-box',
    '@media (min-width: 768px)': {
      margin: '5rem auto',
      padding: '2rem',
    }
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#B388EB'
  },
  subText: {
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    color: '#bbb'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '8px',
    border: '2px solid #444',
    background: '#2a2a2a',
    color: '#fff',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: '#B388EB',
      boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
    }
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#B388EB',
    color: '#121212',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(179, 136, 235, 0.3)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    }
  },
  alt: {
    marginTop: '1rem',
    fontSize: '0.85rem'
  },
  link: {
    color: '#B388EB',
    textDecoration: 'underline'
  }
};

export default Login;
