import React, { useState } from 'react';
import { setup2FA, verify2FA, verify2FALogin, setAuthTokens } from '../api';

const TwoFactorSetup = ({ setupData: initialSetupData, onComplete, tempToken }) => {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState(initialSetupData);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!setupData) {
      try {
        const response = await setup2FA();
        setSetupData(response.data);
        setError('');
      } catch (err) {
        setError('Failed to setup 2FA. Please try again.');
        console.error('2FA setup error:', err);
      }
    }
  };

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      // First verify the 2FA setup
      await verify2FA(verificationCode, tempToken);
      
      // Then do the 2FA login to get the actual access token
      const loginResponse = await verify2FALogin(verificationCode, tempToken);
      
      // Token is set by the verify2FALogin function now, but add a fallback just in case
      if (loginResponse.data.access_token) {
        console.log('2FA setup verified successfully');
        
        // Add a slight delay before redirecting to ensure tokens are properly saved
        setTimeout(() => {
          window.location.href = '/feed';
        }, 500);
      } else {
        console.error('Missing token in 2FA response', loginResponse.data);
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error("2FA verification error:", err.response?.data || err.message || err);
      setError(err.response?.data?.detail || "Invalid verification code. Please try again.");
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
      <h2 style={styles.title}>Two-Factor Authentication Setup</h2>
      
      {error && <p style={styles.error}>{error}</p>}

      {!setupData ? (
        <>
          <p style={styles.text}>
            Two-factor authentication is required for all accounts.
            You'll need an authenticator app like Google Authenticator or Microsoft Authenticator.
          </p>
          <button style={styles.button} onClick={handleSetup}>
            Start 2FA Setup
          </button>
        </>
      ) : (
        <>
          <p style={styles.text}>
            1. Scan this QR code with your authenticator app:
          </p>
          <img
            src={setupData.qr_code}
            alt="2FA QR Code"
            style={styles.qrCode}
          />
          <p style={styles.text}>
            2. Or manually enter this code in your authenticator app:
            <br />
            <code style={styles.secretKey}>{setupData.manual_entry_key}</code>
          </p>
          <p style={styles.text}>
            3. Enter the 6-digit code from your authenticator app to verify:
          </p>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
          />
          <button style={styles.button} onClick={handleVerify}>
            Verify and Continue
          </button>
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
  '@keyframes slideIn': {
    '0%': { transform: 'translateY(20px)', opacity: 0 },
    '100%': { transform: 'translateY(0)', opacity: 1 },
  },
  container: {
    width: '90%',
    maxWidth: '500px',
    margin: '2rem auto',
    padding: '1.5rem',
    background: '#121212',
    color: '#eee',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(128,0,128,0.3)',
    boxSizing: 'border-box',
    '@media (min-width: 768px)': {
      padding: '2rem',
    },
  },
  title: {
    fontSize: '1.75rem',
    color: '#B388EB',
    marginBottom: '1.5rem',
    textAlign: 'center',
    animation: 'slideIn 0.3s ease-out',
  },
  text: {
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  button: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    background: '#B388EB',
    color: '#121212',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(179, 136, 235, 0.3)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
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
    textAlign: 'center',
    letterSpacing: '0.2em',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: '#B388EB',
      boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
    },
  },
  qrCode: {
    display: 'block',
    margin: '1rem auto',
    maxWidth: '200px',
    background: '#fff',
    padding: '1rem',
    borderRadius: '8px',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
  secretKey: {
    display: 'inline-block',
    padding: '0.75rem',
    background: '#2a2a2a',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '1.1rem',
    letterSpacing: '0.1em',
    color: '#B388EB',
    border: '2px solid #444',
    margin: '0.5rem 0',
    userSelect: 'all',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#333',
      borderColor: '#B388EB',
    },
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: 'rgba(255,107,107,0.1)',
    borderRadius: '4px',
  },
  success: {
    color: '#69db7c',
    padding: '1rem',
    background: 'rgba(105,219,124,0.1)',
    borderRadius: '4px',
    textAlign: 'center',
  },
};

export default TwoFactorSetup;
