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
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
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
      alert("Login failed. Please check your credentials.");
      console.error("Login error:", err);
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
      alert("Invalid 2FA code. Please try again.");
      console.error("2FA error:", err);
    }
  };

  return (
    <div style={styles.container}>
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
  container: {
    maxWidth: 400,
    margin: '5rem auto',
    padding: '2rem',
    background: '#121212',
    color: '#eee',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(128,0,128,0.3)'
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
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#1e1e1e',
    color: '#fff'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#B388EB',
    color: '#121212',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
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
