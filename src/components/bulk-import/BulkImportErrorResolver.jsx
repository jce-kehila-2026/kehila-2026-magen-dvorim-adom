import React, { useState } from "react";
import { buildUserProfile, validateUserProfile, USER_ROLES } from "../../services/userSchema";

export default function BulkImportErrorResolver({
  invalidRows,
  onComplete,
  onCancel,
}) {
  const [rowsToFix, setRowsToFix] = useState(invalidRows);
  const [resolvedRows, setResolvedRows] = useState([]);
  
  // Local state for tracking edits
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  const handleEditClick = (row) => {
    setEditingRowId(row.id);
    setEditFormData({ ...row.profile });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRow = (rowId) => {
    const profile = buildUserProfile(editFormData);
    const validation = validateUserProfile(profile);

    if (validation.isValid) {
      // Move from rowsToFix to resolvedRows
      setRowsToFix((prev) => prev.filter((r) => r.id !== rowId));
      setResolvedRows((prev) => [...prev, { id: rowId, profile }]);
      setEditingRowId(null);
    } else {
      // Update the errors visually
      setRowsToFix((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, errors: validation.errors } : r
        )
      );
      alert("Still invalid: " + Object.values(validation.errors).join(" "));
    }
  };

  const handleDismissRow = (rowId) => {
    setRowsToFix((prev) => prev.filter((r) => r.id !== rowId));
    setEditingRowId(null);
  };

  const handleProceed = () => {
    onComplete(resolvedRows);
  };

  if (rowsToFix.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.successMessage}>
          All errors resolved or dismissed!
        </div>
        <div style={styles.actions}>
          <button onClick={handleProceed} style={styles.proceedButton}>
            Continue to Import
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <p style={styles.description}>
        Found <strong>{rowsToFix.length}</strong> rows with errors. Please fix the missing/invalid data or dismiss the row.
      </p>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tr}>
              <th style={styles.th}>Row #</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Errors</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rowsToFix.map((row) => {
              const isEditing = editingRowId === row.id;

              return (
                <tr key={row.id} style={styles.tr}>
                  <td style={styles.td}>{row.id + 1}</td>
                  
                  <td style={styles.td}>
                    {isEditing ? (
                      <input 
                        name="full_name" 
                        value={editFormData.full_name} 
                        onChange={handleEditChange} 
                        style={styles.input}
                      />
                    ) : (
                      row.profile.full_name || <span style={styles.empty}>Empty</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    {isEditing ? (
                      <input 
                        name="email" 
                        value={editFormData.email} 
                        onChange={handleEditChange} 
                        style={styles.input}
                      />
                    ) : (
                      row.profile.email || <span style={styles.empty}>Empty</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    {isEditing ? (
                      <input 
                        name="phone" 
                        value={editFormData.phone} 
                        onChange={handleEditChange} 
                        style={styles.input}
                      />
                    ) : (
                      row.profile.phone || <span style={styles.empty}>Empty</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    <ul style={styles.errorList}>
                      {Object.values(row.errors || {}).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </td>

                  <td style={styles.tdActions}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveRow(row.id)} style={styles.saveBtn}>Save</button>
                        <button onClick={() => setEditingRowId(null)} style={styles.cancelBtn}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(row)} style={styles.editBtn}>Edit</button>
                        <button onClick={() => handleDismissRow(row.id)} style={styles.dismissBtn}>Dismiss</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.actions}>
        <button onClick={onCancel} style={styles.cancelButton}>
          Cancel Import
        </button>
        <button 
          onClick={handleProceed} 
          disabled={rowsToFix.length > 0}
          style={{
            ...styles.proceedButton,
            opacity: rowsToFix.length > 0 ? 0.5 : 1,
            cursor: rowsToFix.length > 0 ? "not-allowed" : "pointer"
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  description: {
    margin: 0,
    color: "#374151",
    fontSize: "15px",
  },
  successMessage: {
    padding: "20px",
    background: "#dcfce7",
    color: "#166534",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
  },
  tableContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    background: "#f9fafb",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "600",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: "12px",
    fontSize: "14px",
    color: "#374151",
    verticalAlign: "top",
  },
  tdActions: {
    padding: "12px",
    verticalAlign: "top",
    display: "flex",
    gap: "8px",
  },
  empty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  input: {
    width: "90%",
    padding: "6px",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    fontSize: "13px",
  },
  errorList: {
    margin: 0,
    paddingLeft: "16px",
    color: "#dc2626",
    fontSize: "13px",
  },
  editBtn: {
    padding: "6px 12px",
    background: "#e0f2fe",
    color: "#0369a1",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  dismissBtn: {
    padding: "6px 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  saveBtn: {
    padding: "6px 12px",
    background: "#dcfce7",
    color: "#15803d",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  cancelBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    color: "#4b5563",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "16px",
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
  proceedButton: {
    padding: "10px 20px",
    background: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
