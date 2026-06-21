import React from "react";

export default function BulkImportProgress({ currentEmail, currentCount, totalCount }) {
  const percentage = totalCount > 0 ? Math.round((currentCount / totalCount) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <h3 style={styles.title}>Processing Import...</h3>
      <div style={styles.progressBarBg}>
        <div style={{ ...styles.progressBarFill, width: `${percentage}%` }}></div>
      </div>
      <p style={styles.progressText}>
        {currentCount} of {totalCount} users processed
      </p>
      {currentEmail && (
        <p style={styles.description}>
          Currently processing: <strong>{currentEmail}</strong>
        </p>
      )}
      <p style={styles.warning}>
        Please do not close this window.
      </p>
      <p style={styles.providerNote}>
        Note: User creation rate is intentionally regulated due to Google Firebase provider limits.
      </p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3e8dd",
    borderTop: "4px solid #f97316",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "24px",
  },
  title: {
    margin: "0 0 16px",
    color: "#2b160c",
    fontSize: "22px",
    fontWeight: "bold",
  },
  progressBarBg: {
    width: "100%",
    maxWidth: "400px",
    height: "10px",
    background: "#f3e8dd",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  progressBarFill: {
    height: "100%",
    background: "#f97316",
    transition: "width 0.3s ease-in-out",
  },
  progressText: {
    margin: "0 0 8px",
    color: "#f97316",
    fontWeight: "bold",
    fontSize: "14px",
  },
  description: {
    margin: "0 0 16px",
    color: "#7e6d62",
    fontSize: "15px",
    maxWidth: "400px",
  },
  warning: {
    margin: "0 0 12px",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: "600",
  },
  providerNote: {
    margin: 0,
    color: "#9ca3af",
    fontSize: "12px",
    maxWidth: "400px",
    fontStyle: "italic",
  },
};

// We inject keyframes for the spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
