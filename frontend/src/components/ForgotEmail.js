import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Assume you create an API endpoint for "recover-email" if needed.

function ForgotEmail() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRecoverEmail = () => {
    // Placeholder logic: in production, you’d call an API endpoint.
    setMessage(`If user ID ${userId} exists, you should receive an email.`);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Forgot Email</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Enter your user ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button style={styles.button} onClick={handleRecoverEmail}>Submit</button>
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

export default ForgotEmail;
