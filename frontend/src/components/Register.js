import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, verify2FALogin } from '../api';

const profilePics = ["pic1", "pic2", "pic3"];

function Register() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState(profilePics[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1); // 1: Registration form, 2: 2FA setup
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await registerUser(username, email, password, displayName, socialLinks, selectedPic);
      setTwoFactorSetup(res.data.two_factor_setup);
      setStep(2); // Move to 2FA setup step
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Registration failed.");
      console.error("Registration error:", err);
    }
  };

  const handleVerify2FA = async () => {
    try {
      await verify2FALogin(verificationCode);
      alert("Account created and 2FA enabled successfully!");
      navigate("/");
    } catch (err) {
      setErrorMsg("Invalid verification code. Please try again.");
      console.error("2FA verification error:", err);
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
        <input style={styles.input} type="text" placeholder="Social Links (comma separated)" onChange={(e) => setSocialLinks(e.target.value)} />

        <p style={{ color: "#ccc", marginBottom: "0.5rem" }}>Choose a Profile Picture:</p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          {profilePics.map((pic) => (
            <div
              key={pic}
              style={{
                ...styles.picCircle,
                border: selectedPic === pic ? "3px solid #B388EB" : "2px solid #444"
              }}
              onClick={() => setSelectedPic(pic)}
            >
              {pic.toUpperCase()}
            </div>
          ))}
        </div>

        <button style={styles.button} onClick={handleRegister}>Next: Set Up 2FA</button>
        <p style={styles.alt}>Already have an account? <Link to="/" style={styles.link}>Log in</Link></p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
    fontSize: '1.75rem',
    marginBottom: '1.5rem',
    color: '#B388EB'
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
