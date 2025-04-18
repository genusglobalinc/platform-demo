import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

const profilePics = ["pic1", "pic2", "pic3"];

function Register() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [selectedPic, setSelectedPic] = useState(profilePics[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await registerUser(username, email, password, displayName, socialLinks, selectedPic);
      alert("Account created! Check your email to verify.");
      navigate("/");
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Registration failed.");
      console.error("Registration error:", err);
    }
  };

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
