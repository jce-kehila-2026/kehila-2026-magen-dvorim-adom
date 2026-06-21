import React, { useRef } from "react";

export default function BulkImportFileSelector({
  onFileSelect,
  shouldFlush,
  setShouldFlush,
  onCancel,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.uploadArea}>
        <div style={styles.icon}>📄</div>
        <p style={styles.instructions}>
          <strong>Click to upload</strong> or drag and drop a CSV file here.
        </p>
        <p style={styles.hint}>Ensure the file has headers (e.g., Full Name, Email, Phone).</p>
        <button 
          style={styles.browseButton}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </button>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      <div style={styles.optionsArea}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={shouldFlush}
            onChange={(e) => setShouldFlush(e.target.checked)}
            style={styles.checkbox}
          />
          <strong>Flush old users:</strong> Deactivate all users not included in this CSV.
        </label>
        <p style={styles.optionHint}>
          Use this if you are importing the complete master list for the new year.
        </p>
      </div>

      <div style={styles.actions}>
        <button onClick={onCancel} style={styles.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  uploadArea: {
    border: "2px dashed #f3c49a",
    background: "#fffdf8",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
  },
  icon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  instructions: {
    margin: "0 0 8px",
    color: "#2b160c",
    fontSize: "16px",
  },
  hint: {
    margin: "0 0 20px",
    color: "#7e6d62",
    fontSize: "14px",
  },
  browseButton: {
    background: "#f97316",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  optionsArea: {
    background: "#f9fafb",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#374151",
    fontSize: "15px",
    cursor: "pointer",
  },
  checkbox: {
    width: "16px",
    height: "16px",
  },
  optionHint: {
    margin: "4px 0 0 24px",
    color: "#6b7280",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "10px 16px",
    background: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    color: "#374151",
    fontWeight: "600",
    cursor: "pointer",
  },
};
