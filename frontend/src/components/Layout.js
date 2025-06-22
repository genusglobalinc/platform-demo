import React from 'react';
import Sidebar from './Sidebar';

// A consistent layout wrapper for all pages
const Layout = ({ children, pageTitle, showBackButton = false, onBack = null }) => {
  return (
    <div style={styles.container}>
      {/* Left sidebar with navigation */}
      <Sidebar />
      
      {/* Main content area */}
      <div style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          <div style={styles.header}>
            {showBackButton && (
              <button 
                style={styles.backButton} 
                onClick={onBack || (() => window.history.back())}
              >
                ← Back
              </button>
            )}
            {pageTitle && <h1 style={styles.pageTitle}>{pageTitle}</h1>}
          </div>
          
          {/* Actual page content */}
          {children}
        </div>
      </div>
      
      {/* Right sidebar - can be empty */}
      <div style={styles.rightSidebar}></div>
    </div>
  );
};

const styles = {
  container: {
    background: "#111",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "sans-serif",
    display: "flex",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
    overflowY: "auto",
  },
  contentWrapper: {
    maxWidth: "100%",
  },
  rightSidebar: {
    width: "250px",
    borderLeft: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#B388EB",
    cursor: "pointer",
    fontSize: "16px",
    padding: "8px 0",
    marginRight: "16px",
  },
  pageTitle: {
    color: "#B388EB",
    fontSize: "28px",
    margin: 0,
  }
};

// Common section styles that can be used across all pages
export const sectionStyles = {
  section: {
    background: "rgba(30, 30, 30, 0.5)",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "20px",
    margin: 0,
    color: "#B388EB",
  },
  card: {
    background: "rgba(40, 40, 40, 0.5)",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  button: {
    background: "#B388EB",
    color: "#121212",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  lightButton: {
    background: "transparent",
    color: "#B388EB",
    border: "1px solid #B388EB",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  dangerButton: {
    background: "#E57373",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  }
};

export default Layout;
