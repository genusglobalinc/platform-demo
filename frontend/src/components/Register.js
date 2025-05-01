import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verify2FALogin } from '../api';

// Default profile pictures will be handled server-side; users can upload later in profile settings

function Register() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1); // 1: Registration form, 2: 2FA setup
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await registerUser(username, email, password, displayName);
      setTwoFactorSetup(res.data.two_factor_setup);
      setTempToken(res.data.temp_token);
      setStep(2); // Move to 2FA setup step
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Registration failed.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await verify2FALogin(verificationCode, tempToken);
      setStep(3); // Show success animation
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setErrorMsg("Invalid verification code. Please try again.");
      console.error("2FA verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Create an Account</h2>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
        <input style={styles.input} type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input style={styles.input} type="text" placeholder="Display Name" onChange={(e) => setDisplayName(e.target.value)} />
        <input style={styles.input} type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

        <button style={styles.button} onClick={handleRegister}>Next: Set Up 2FA</button>
        <p style={styles.alt}>Already have an account? <Link to="/" style={styles.link}>Log in</Link></p>
      </div>
    );
  }

  const renderLoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );

  const renderSuccessAnimation = () => (
    <div style={styles.successContainer}>
      <div style={styles.successCheckmark}>
        <div style={styles.checkmarkCircle}></div>
        <div style={styles.checkmarkStem}></div>
        <div style={styles.checkmarkKick}></div>
      </div>
      <p style={styles.successText}>Account created successfully!</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {loading && renderLoadingSpinner()}
      <h2 style={styles.title}>Set Up Two-Factor Authentication</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      
      <p style={styles.text}>
        Two-factor authentication is required for all accounts. Please follow these steps:
      </p>
      
      <p style={styles.text}>
        1. Install an authenticator app like Google Authenticator or Microsoft Authenticator
      </p>
      
      <p style={styles.text}>
        2. Scan this QR code with your authenticator app:
      </p>
      
      <img
        src={twoFactorSetup?.qr_code}
        alt="2FA QR Code"
        style={styles.qrCode}
      />
      
      <p style={styles.text}>
        3. Or manually enter this code in your authenticator app:
        <br />
        <code style={styles.secretKey}>{twoFactorSetup?.manual_entry_key}</code>
      </p>
      
      <p style={styles.text}>
        4. Enter the 6-digit code from your authenticator app:
      </p>
      
      <input
        style={styles.input}
        type="text"
        placeholder="Enter 6-digit code"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        maxLength={6}
      />
      
      <button style={styles.button} onClick={handleVerify2FA}>
        Complete Registration
      </button>
    </div>
  );
}

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
  successContainer: {
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
  successCheckmark: {
    width: '80px',
    height: '80px',
    position: 'relative',
    animation: 'scale-in 0.3s ease-out',
  },
  checkmarkCircle: {
    width: '80px',
    height: '80px',
    border: '4px solid #B388EB',
    borderRadius: '50%',
    position: 'absolute',
    animation: 'circle-fill 0.4s ease-in-out 0.3s forwards',
  },
  checkmarkStem: {
    height: '40px',
    width: '4px',
    background: '#B388EB',
    position: 'absolute',
    left: '38px',
    top: '20px',
    transform: 'rotate(45deg)',
    animation: 'stem-draw 0.3s ease-out 0.7s forwards',
  },
  checkmarkKick: {
    height: '4px',
    width: '20px',
    background: '#B388EB',
    position: 'absolute',
    left: '24px',
    top: '50px',
    transform: 'rotate(45deg)',
    animation: 'kick-draw 0.3s ease-out 0.7s forwards',
  },
  successText: {
    color: '#B388EB',
    marginTop: '2rem',
    fontSize: '1.5rem',
    animation: 'fade-in 0.5s ease-out',
  },
  text: {
    marginBottom: '1.5rem',
    lineHeight: '1.5',
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
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  '@keyframes scale-in': {
    '0%': { transform: 'scale(0)' },
    '100%': { transform: 'scale(1)' },
  },
  '@keyframes circle-fill': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  '@keyframes stem-draw': {
    '0%': { height: 0 },
    '100%': { height: '40px' },
  },
  '@keyframes kick-draw': {
    '0%': { width: 0 },
    '100%': { width: '20px' },
  },
  '@keyframes fade-in': {
    '0%': { opacity: 0, transform: 'translateY(20px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  container: {
    width: '90%',
    maxWidth: '500px',
    margin: '2rem auto',
    padding: '1.5rem',
    background: '#1a1a1a',
    color: '#eee',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(128,0,128,0.3)',
    boxSizing: 'border-box',
    '@media (min-width: 768px)': {
      margin: '5rem auto',
      padding: '2rem',
    },
  },
  title: {
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    color: '#B388EB'
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
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#B388EB',
      boxShadow: '0 0 0 2px rgba(179, 136, 235, 0.3)',
    },
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
    },
  },
  alt: {
    marginTop: '1rem',
    fontSize: '0.85rem'
  },
  link: {
    color: '#B388EB',
    textDecoration: 'underline'
  },
  picCircle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#222",
    color: "#B388EB",
    fontWeight: "bold"
  }
};

export default Register;
