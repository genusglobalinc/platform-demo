import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    console.log("Registering:", username, email);
    // You’d normally send this to backend
    navigate("/feed");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create an Account</h2>
      <input style={styles.input} type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input style={styles.input} type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button style={styles.button} onClick={handleRegister}>Register</button>
      <p style={styles.alt}>Already have an account? <Link to="/" style={styles.link}>Log in</Link></p>
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
  alt: {
    marginTop: '1rem',
    fontSize: '0.85rem'
  },
  link: {
    color: '#B388EB',
    textDecoration: 'underline'
  }
};

export default Register;
