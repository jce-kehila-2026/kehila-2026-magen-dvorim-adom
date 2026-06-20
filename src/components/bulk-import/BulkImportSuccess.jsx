import React, { useState } from "react";

export default function BulkImportSuccess({
  successCount,
  generatedPasswordsCsv,
  processingError,
  onClose,
}) {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const requiresDownload = generatedPasswordsCsv !== null;

  const handleDownload = () => {
    const blob = new Blob([generatedPasswordsCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "new_user_passwords.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setHasDownloaded(true);
  };

  return (
    <div style={styles.container}>
      {processingError && (
        <div style={styles.errorBanner}>
          <strong>Partial Success:</strong> {processingError}
        </div>
      )}


      <h3 style={styles.title}>Import Successful!</h3>
      <p style={styles.description}>
        Successfully imported or updated <strong>{successCount}</strong> users.
      </p>

      {requiresDownload && (
        <div style={styles.downloadBox}>
          <p style={styles.warningTitle}> Urgent: Download Passwords</p>
          <p style={styles.warningText}>
            New users have been created with securely generated passwords. 
            You <strong>must</strong> download this CSV file to distribute the passwords to the new users. 
            This is the only time these passwords will be visible!
          </p>
          <button onClick={handleDownload} style={styles.downloadButton}>
            ⬇️ Download Passwords CSV
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <button 
          onClick={onClose} 
          disabled={requiresDownload && !hasDownloaded}
          style={{
            ...styles.closeButton,
            opacity: requiresDownload && !hasDownloaded ? 0.5 : 1,
            cursor: requiresDownload && !hasDownloaded ? "not-allowed" : "pointer"
          }}
        >
          {requiresDownload && !hasDownloaded ? "Download required to close" : "Close"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    textAlign: "center",
  },
  icon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  errorBanner: {
    width: "100%",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "left",
    border: "1px solid #fca5a5",
  },
  title: {
    margin: "0 0 12px",
    color: "#166534",
    fontSize: "24px",
    fontWeight: "bold",
  },
  description: {
    margin: "0 0 24px",
    color: "#374151",
    fontSize: "16px",
  },
  downloadBox: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    padding: "20px",
    maxWidth: "500px",
    marginBottom: "24px",
  },
  warningTitle: {
    margin: "0 0 8px",
    color: "#92400e",
    fontWeight: "bold",
    fontSize: "16px",
  },
  warningText: {
    margin: "0 0 16px",
    color: "#92400e",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  downloadButton: {
    background: "#d97706",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
    width: "100%",
  },
  actions: {
    marginTop: "16px",
  },
  closeButton: {
    padding: "12px 32px",
    background: "#e5e7eb",
    color: "#374151",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "16px",
  },
};
