import React from "react";
import { Link } from "react-router-dom";

function Feed() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Game Testing Opportunities</h2>
      <p style={styles.text}>List of test events will go here...</p>
      <div style={styles.nav}>
        <Link to="/profile" style={styles.link}>View Profile</Link>
        <Link to="/" style={styles.link}>Logout</Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    background: '#111',
    color: '#eee',
    minHeight: '100vh'
  },
  title: {
    color: '#B388EB'
  },
  text: {
    margin: '1rem 0'
  },
  nav: {
    marginTop: '2rem',
    display: 'flex',
    gap: '1rem'
  },
  link: {
    color: '#B388EB',
    textDecoration: 'underline'
  }
};

export default Feed;
