import React from "react";

function Feed() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Game Testing Opportunities</h2>
      <p style={styles.subText}>[Trending / Newest / For You]</p>
      <p style={styles.details}>List of test events will go here...</p>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    background: '#1e1e1e',
    color: '#eee',
    minHeight: '80vh'
  },
  title: {
    fontSize: '2rem',
    color: '#B388EB'
  },
  subText: {
    marginTop: '0.5rem',
    fontSize: '1rem',
    color: '#ccc'
  },
  details: {
    marginTop: '1.5rem',
    fontSize: '1.1rem'
  }
};

export default Feed;
