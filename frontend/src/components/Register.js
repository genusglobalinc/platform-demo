import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api'; // ← import the function

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      // Clear previous errors before making the request
      setErrorMsg("");

      const response = await registerUser(username, email, password);

      // Successful registration
      alert("Account created! Check your email to verify your account.");
      navigate("/"); // Redirect to home or login page
    } catch (err) {
      // Handle different types of errors here
      if (err.response) {
        // If we have a response object, the server responded with an error
        setErrorMsg(err.response.data.detail || "Registration failed.");
      } else if (err.request) {
        // If we don't have a response, it means the request was made but no response was received
        setErrorMsg("Network error. Please check your connection and try again.");
      } else {
        // Something else went wrong (e.g., setting up the request)
        setErrorMsg("An error occurred. Please try again.");
      }

      console.error("Registration error:", err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create an Account</h2>

      {/* Show error message if any */}
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <input style={styles.input} type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input style={styles.input} type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

      <button style={styles.button} onClick={handleRegister}>Register</button>

      <p style={styles.alt}>
        Already have an account? <Link to="/" style={styles.link}>Log in</Link>
      </p>
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
