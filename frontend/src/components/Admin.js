import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [postStatus, setPostStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkEmailAddress, setBulkEmailAddress] = useState("");
  const usersPerPage = 10;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Load profile to check if user is admin
    fetchProfile();
    // Fetch users with demographic info
    fetchUsers();
    // Load pending posts as well
    fetchPendingPosts();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      
      // Redirect if not admin
      if (res.data.user_type !== "Admin") {
        navigate("/feed");
      }
    } catch (err) {
      console.error("Failed to load profile", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users...");
      const res = await axios.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Users API response:", res.data);
      const userArr = Array.isArray(res.data) ? res.data : res.data?.users || [];
      console.log("Processed users array:", userArr);
      setUsers(userArr);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/pending-posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.posts || [];
      setPendingPosts(list);
    } catch (err) {
      console.error("Failed to load pending posts", err);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (userId) => {
    try {
      setLoading(true);
      setEmailStatus("");
      const res = await axios.post(
        "/admin/send-demographic-email",
        { user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailStatus(`Email sent successfully to ${res.data.recipient}`);
    } catch (err) {
      setEmailStatus(`Failed to send email: ${err.response?.data?.detail || err.message}`);
      console.error("Email sending error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const sendBulkEmail = async () => {
    if (!bulkEmailAddress || selectedUsers.length === 0) {
      setEmailStatus("Please provide an email address and select at least one user");
      return;
    }
    
    try {
      setLoading(true);
      setEmailStatus("");
      const res = await axios.post(
        "/admin/send-bulk-demographic-email",
        { 
          user_ids: selectedUsers,
          email_address: bulkEmailAddress 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailStatus(`Demographic data for ${selectedUsers.length} users sent to ${bulkEmailAddress}`);
      setSelectedUsers([]);
    } catch (err) {
      setEmailStatus(`Failed to send bulk email: ${err.response?.data?.detail || err.message}`);
      console.error("Bulk email sending error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const selectAllUsersOnPage = () => {
    // Make sure we're using the normalized user IDs
    const currentPageUsers = paginatedUsers.map(user => user.user_id);
    const allSelected = currentPageUsers.every(id => selectedUsers.includes(id));
    
    if (allSelected) {
      // Deselect all on current page
      setSelectedUsers(prev => prev.filter(id => !currentPageUsers.includes(id)));
    } else {
      // Select all on current page
      const newSelected = [...selectedUsers];
      currentPageUsers.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedUsers(newSelected);
    }
  };

  const updatePostApproval = async (postId, approve = true) => {
    try {
      setLoading(true);
      const res = await axios.post(
        "/admin/approve-post",
        { post_id: postId, approve },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostStatus(res.data.message);
      // refresh list
      fetchPendingPosts();
    } catch (err) {
      setPostStatus(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLoadingSpinner = () => (
    <div style={styles.loadingSpinner}>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading...</p>
    </div>
  );

  // Normalize user objects to handle both Sanity and DynamoDB formats
  const normalizeUser = (user) => {
    return {
      user_id: user._id || user.user_id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      user_type: user.user_type,
      demographic_info: user.demographic_info || null,
      // Add other fields as needed
    };
  };

  const normalizedUsers = (Array.isArray(users) ? users : []).map(normalizeUser);
  
  const filteredUsers = normalizedUsers.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchLower))
    );
  });
  
  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="responsive-container" style={styles.container}>
      {loading && renderLoadingSpinner()}

      {/* Left Sidebar */}
      <div className="left-sidebar" style={styles.leftSidebar}>
        <h3 style={{ marginBottom: "24px" }}>Lost Gates</h3>
        <div style={{ marginBottom: "32px" }}>
          <div style={styles.navItem} onClick={() => navigate("/feed")}>Home</div>
          <div style={styles.navItem} onClick={() => navigate("/profile")}>Profile</div>
          <div style={styles.navItem} onClick={() => navigate("/profile/settings")}>Settings</div>
          <div style={{...styles.navItem, background: "#333"}} onClick={() => navigate("/admin")}>Admin</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Dashboard</h2>
          <div style={styles.headerRight}>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Pending Posts */}
        <div style={styles.usersList}>
          <h3 style={styles.sectionTitle}>Pending Posts</h3>
          {(Array.isArray(pendingPosts) ? pendingPosts : []).length === 0 ? (
            <p>No posts awaiting approval.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(Array.isArray(pendingPosts) ? pendingPosts : []).map((p) => (
                <div key={p._id || p.post_id} style={{ background: "#222", padding: 16, borderRadius: 8 }}>
                  <h4 style={{ margin: 0 }}>{p.title}</h4>
                  <p style={{ opacity: 0.8 }}>{p.description?.slice(0, 120)}...</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      style={{ ...styles.emailButton, background: "#28a745", color: "#fff" }}
                      onClick={() => updatePostApproval(p._id || p.post_id, true)}
                    >
                      Approve
                    </button>
                    <button
                      style={{ ...styles.emailButton, background: "#E57373", color: "#fff" }}
                      onClick={() => updatePostApproval(p._id || p.post_id, false)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {postStatus && <p style={{ marginTop: 8 }}>{postStatus}</p>}
        </div>

        {/* Users */}
        <div style={styles.usersList}>
          <h3 style={styles.sectionTitle}>
            Users ({filteredUsers.length} total)
          </h3>
          
          {/* Bulk Email Controls */}
          <div style={styles.bulkEmailContainer}>
            <div style={styles.bulkEmailHeader}>
              <h4>Bulk Email Selected Users</h4>
              <div style={styles.selectedCount}>
                {selectedUsers.length} selected
              </div>
            </div>
            <div style={styles.bulkEmailControls}>
              <input
                type="email"
                placeholder="Enter recipient email address"
                value={bulkEmailAddress}
                onChange={(e) => setBulkEmailAddress(e.target.value)}
                style={styles.bulkEmailInput}
              />
              <button
                onClick={sendBulkEmail}
                disabled={selectedUsers.length === 0 || !bulkEmailAddress}
                style={{
                  ...styles.bulkEmailButton,
                  opacity: selectedUsers.length === 0 || !bulkEmailAddress ? 0.5 : 1
                }}
              >
                Send Demographics
              </button>
            </div>
            {emailStatus && <div style={styles.emailStatus}>{emailStatus}</div>}
          </div>
          
          {/* Users Table */}
          <div style={styles.usersTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>
                    <input 
                      type="checkbox" 
                      checked={paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUsers.includes(user.user_id))}
                      onChange={selectAllUsersOnPage}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.tableHeader}>Username</th>
                  <th style={styles.tableHeader}>Display Name</th>
                  <th style={styles.tableHeader}>Email</th>
                  <th style={styles.tableHeader}>Account Type</th>
                  <th style={styles.tableHeader}>Demographics</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.user_id} 
                    style={{
                      ...styles.tableRow,
                      ...(selectedUser?.user_id === user.user_id ? styles.selectedRow : {})
                    }}
                  >
                    <td style={styles.tableCell}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => toggleUserSelection(user.user_id)}
                        style={styles.checkbox}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td style={styles.tableCell}>{user.username}</td>
                    <td style={styles.tableCell}>{user.display_name || '-'}</td>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>{user.user_type}</td>
                    <td style={styles.tableCell}>
                      {user.demographic_info ? (
                        <span style={styles.tagDemographic}>Yes</span>
                      ) : (
                        <span style={styles.tagNoDemographic}>No</span>
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      <button 
                        style={styles.viewButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                &laquo; Prev
              </button>
              <div style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </div>

        {/* Selected User Details */}
        {selectedUser && (
          <div style={styles.userDetails}>
            <h3 style={styles.sectionTitle}>
              {selectedUser.display_name || selectedUser.username}'s Details
            </h3>
            <div style={styles.userInfo}>
              <p>
                <strong>Username:</strong> {selectedUser.username}
              </p>
              <p>
                <strong>Display Name:</strong> {selectedUser.display_name || "Not set"}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>User Type:</strong> {selectedUser.user_type}
              </p>

              {selectedUser.demographic_info &&
              Object.keys(selectedUser.demographic_info).length > 0 ? (
                <div style={styles.demographicSection}>
                  <h4 style={styles.demographicTitle}>Demographic Information</h4>
                  {selectedUser.demographic_info.age && (
                    <p>
                      <strong>Age Range:</strong> {selectedUser.demographic_info.age}
                    </p>
                  )}
                  {selectedUser.demographic_info.gender && (
                    <p>
                      <strong>Gender:</strong> {selectedUser.demographic_info.gender}
                    </p>
                  )}
                  {selectedUser.demographic_info.location && (
                    <p>
                      <strong>Location:</strong> {selectedUser.demographic_info.location}
                    </p>
                  )}
                  {selectedUser.demographic_info.preferred_platforms && (
                    <p>
                      <strong>Preferred Platforms:</strong>{" "}
                      {selectedUser.demographic_info.preferred_platforms}
                    </p>
                  )}
                  {selectedUser.demographic_info.gaming_experience && (
                    <p>
                      <strong>Gaming Experience:</strong>{" "}
                      {selectedUser.demographic_info.gaming_experience}
                    </p>
                  )}
                  {selectedUser.demographic_info.favorite_genres && (
                    <p>
                      <strong>Favorite Genres:</strong>{" "}
                      {selectedUser.demographic_info.favorite_genres}
                    </p>
                  )}
                  {selectedUser.demographic_info.weekly_playtime && (
                    <p>
                      <strong>Weekly Playtime:</strong>{" "}
                      {selectedUser.demographic_info.weekly_playtime}
                    </p>
                  )}
                  {selectedUser.demographic_info.previous_playtest_experience && (
                    <div>
                      <p>
                        <strong>Previous Playtest Experience:</strong>
                      </p>
                      <p style={styles.experienceText}>
                        {selectedUser.demographic_info.previous_playtest_experience}
                      </p>
                    </div>
                  )}
                  <button
                    style={styles.emailButton}
                    onClick={() => sendEmail(selectedUser.user_id)}
                  >
                    Send Demographics to Developers
                  </button>
                  {emailStatus && (
                    <p
                      style={{
                        ...styles.emailStatus,
                        color: emailStatus.includes("Failed")
                          ? "#ff6b6b"
                          : "#69db7c",
                      }}
                    >
                      {emailStatus}
                    </p>
                  )}
                </div>
              ) : (
                <div style={styles.noDemographics}>
                  <p>No demographic information available for this user.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar" style={styles.rightSidebar}></div>
    </div>
  );
}

const styles = {
  loadingSpinner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "16px",
    backgroundColor: "#222",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tableHeader: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#333",
    color: "#B388EB",
    fontWeight: "bold",
  },
  tableRow: {
    borderBottom: "1px solid #333",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  selectedRow: {
    backgroundColor: "#333",
  },
  tableCell: {
    padding: "12px 16px",
    textAlign: "left",
  },
  checkbox: {
    cursor: "pointer",
    width: "18px",
    height: "18px",
  },
  viewButton: {
    padding: "6px 12px",
    backgroundColor: "#B388EB",
    color: "#121212",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "24px",
    gap: "16px",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#B388EB",
  },
  bulkEmailContainer: {
    backgroundColor: "#222",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  bulkEmailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  selectedCount: {
    backgroundColor: "#B388EB",
    color: "#121212",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "bold",
  },
  bulkEmailControls: {
    display: "flex",
    gap: "16px",
  },
  bulkEmailInput: {
    flex: 1,
    padding: "10px 16px",
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "4px",
  },
  bulkEmailButton: {
    padding: "10px 16px",
    backgroundColor: "#B388EB",
    color: "#121212",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #B388EB",
    borderTop: "5px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#B388EB",
    marginTop: "1rem",
    fontSize: "1.2rem",
  },
  container: {
    background: "#111",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "sans-serif",
    display: "flex",
  },
  leftSidebar: {
    width: "250px",
    padding: "24px 16px",
    borderRight: "1px solid #333",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },
  mainContent: {
    flex: 1,
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  rightSidebar: {
    width: "250px",
    padding: "24px",
    borderLeft: "1px solid #333",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, margin: 0 },
  headerRight: { display: "flex", gap: 16 },
  logoutButton: {
    background: "#E57373",
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  navItem: {
    padding: "12px 8px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "8px",
    transition: "background 0.2s",
  },
  searchBar: {
    marginBottom: "24px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "#222",
    color: "#fff",
    fontSize: "1rem",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    marginBottom: "16px",
    color: "#B388EB",
  },
  usersList: {
    marginBottom: "32px",
  },
  usersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },
  userCard: {
    background: "#222",
    padding: "16px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  selectedUserCard: {
    background: "#333",
    boxShadow: "0 0 0 2px #B388EB",
  },
  userName: {
    fontSize: "1.2rem",
    margin: "0 0 8px 0",
  },
  userEmail: {
    fontSize: "0.9rem",
    margin: "0 0 8px 0",
    opacity: 0.7,
  },
  userType: {
    fontSize: "0.9rem",
    margin: "0 0 12px 0",
    color: "#B388EB",
  },
  hasDemographics: {
    marginTop: "8px",
  },
  tagDemographic: {
    background: "rgba(40, 167, 69, 0.2)",
    color: "#28a745",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  tagNoDemographic: {
    background: "rgba(255, 107, 107, 0.2)",
    color: "#ff6b6b",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
  },
  userDetails: {
    background: "#222",
    padding: "24px",
    borderRadius: "12px",
    marginTop: "24px",
  },
  userInfo: {
    lineHeight: "1.6",
  },
  demographicSection: {
    marginTop: "24px",
    padding: "16px",
    background: "#333",
    borderRadius: "8px",
  },
  demographicTitle: {
    fontSize: "1.2rem",
    marginBottom: "16px",
    color: "#B388EB",
  },
  experienceText: {
    marginLeft: "16px",
    fontStyle: "italic",
    opacity: 0.9,
  },
  noDemographics: {
    marginTop: "16px",
    padding: "16px",
    background: "#333",
    borderRadius: "8px",
    opacity: 0.7,
  },
  emailButton: {
    marginTop: "16px",
    padding: "10px 16px",
    background: "#B388EB",
    color: "#121212",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  emailStatus: {
    marginTop: "8px",
    padding: "8px",
    borderRadius: "4px",
    background: "rgba(0, 0, 0, 0.2)",
  },
};
