// src/components/ForgotEmail.js
import React, { useState } from 'react';

function ForgotEmail() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");

  const handleLookup = async () => {
    try {
      const res = await fetch("http://localhost:8000/forgot-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Lookup failed.");

      setMsg("Check your text messages for the linked email.");
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Forgot Email?</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Phone number linked to account"
        onChange={(e) => setPhone(e.target.value)}
      />
      <button style={styles.button} onClick={handleLookup}>Send Email Info</button>
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
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
    fontSize: '1.5rem',
    marginBottom: '1rem',
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
  }
};

export default ForgotEmail;