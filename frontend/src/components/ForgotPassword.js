import React, { useState } from "react";
import { forgotPassword } from "../api";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    try {
      const response = await forgotPassword(email);
      setMessage(response.data.message);
      // Optionally, navigate to a reset password form or clear the form
    } catch (err) {
      setMessage("Error: " + (err?.response?.data?.detail || "Could not process request."));
      console.error("Forgot Password Error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Forgot Password</h2>
      <input
        style={styles.input}
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button style={styles.button} onClick={handleForgotPassword}>Submit</button>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

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
  message: {
    marginTop: '1rem',
    fontSize: '1rem'
  }
};

export default ForgotPassword;
