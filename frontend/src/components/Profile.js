import React from "react";

function Profile() {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Profile</h2>
      <p style={styles.details}>Profile details, followers, and liked posts will be displayed here.</p>
      {/* You could add a link to profile settings */}
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
  details: {
    marginTop: '1rem',
    fontSize: '1.1rem'
  }
};

export default Profile;
