// src/components/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      localStorage.setItem("token", data.access_token);
      navigate("/feed");
    } catch (err) {
      setErrorMsg(err.message);
      console.error("Login error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Lost Gates</h1>
      <p style={styles.subText}>
        Discover and participate in exclusive game testing events.
      </p>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <input style={styles.input} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      
      <button style={styles.button} onClick={handleLogin}>Login</button>

      <p style={styles.alt}>
        <Link to="/forgot-password" style={styles.link}>Forgot password?</Link> | 
        <Link to="/forgot-email" style={styles.link}> Forgot email?</Link>
      </p>
      <p style={styles.alt}>
        Don’t have an account? <Link to="/register" style={styles.link}>Create one</Link>
      </p>
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
