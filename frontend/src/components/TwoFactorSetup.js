import React, { useState } from 'react';
import { setup2FA, verify2FA } from '../api';

const TwoFactorSetup = () => {
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    try {
      const response = await setup2FA();
      setSetupData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to setup 2FA. Please try again.');
      console.error('2FA setup error:', err);
    }
  };

  const handleVerify = async () => {
    try {
      await verify2FA(verificationCode);
      setIsEnabled(true);
      setError('');
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('2FA verification error:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Two-Factor Authentication</h2>
      
      {error && <p style={styles.error}>{error}</p>}

      {!setupData && !isEnabled && (
        <>
          <p style={styles.text}>
            Enhance your account security by enabling two-factor authentication.
            You'll need an authenticator app like Google Authenticator or Microsoft Authenticator.
          </p>
          <button style={styles.button} onClick={handleSetup}>
            Set up 2FA
          </button>
        </>
      )}

      {setupData && !isEnabled && (
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
            Verify and Enable 2FA
          </button>
        </>
      )}

      {isEnabled && (
        <div style={styles.success}>
          <p>✓ Two-factor authentication is now enabled for your account!</p>
          <p>
            You'll need to enter a code from your authenticator app each time you log in.
          </p>
        </div>
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
