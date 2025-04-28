import React, { useState } from 'react';
import { setup2FA, verify2FA, verify2FALogin } from '../api';

const TwoFactorSetup = ({ setupData: initialSetupData, onComplete, tempToken }) => {
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
      // First verify the 2FA setup
      await verify2FA(verificationCode, tempToken);
      
      // Then do the 2FA login to get the actual access token
      const loginResponse = await verify2FALogin(verificationCode, tempToken);
      
      // Store the actual access token and clear the temp token
      localStorage.setItem('token', loginResponse.data.access_token);
      localStorage.removeItem('temp_token');
      
      // Clear any errors
      setError('');
      
      // Navigate to feed
      window.location.href = '/feed';
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('2FA verification error:', err);
    }
  };

  return (
    <div style={styles.container}>
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
  container: {
    maxWidth: 600,
    margin: '2rem auto',
    padding: '2rem',
    background: '#121212',
    borderRadius: '12px',
    color: '#eee',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: '#B388EB',
  },
  text: {
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#B388EB',
    color: '#121212',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#1e1e1e',
    color: '#fff',
    fontSize: '1rem',
  },
  qrCode: {
    display: 'block',
    margin: '1rem auto',
    maxWidth: '200px',
    background: '#fff',
    padding: '1rem',
    borderRadius: '8px',
  },
  secretKey: {
    display: 'inline-block',
    padding: '0.5rem',
    background: '#1e1e1e',
    borderRadius: '4px',
    fontFamily: 'monospace',
    marginTop: '0.5rem',
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
