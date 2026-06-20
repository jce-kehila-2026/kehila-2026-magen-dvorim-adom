import { useState } from "react";
import BulkImportFileSelector from "./BulkImportFileSelector";
import BulkImportErrorResolver from "./BulkImportErrorResolver";
import BulkImportProgress from "./BulkImportProgress";
import BulkImportSuccess from "./BulkImportSuccess";
import {
  parseCSV,
  validateImportData,
  flushUsers,
  processValidRows,
  generatePasswordCSV,
} from "../../services/bulkImportService";
import { useAuth } from "../../contexts/AuthContext";

export default function BulkImportModal({ isOpen, onClose, onComplete }) {
  const { userProfile } = useAuth();
  const [step, setStep] = useState("SELECT_FILE"); // SELECT_FILE, RESOLVE_ERRORS, PROCESSING, SUCCESS
  const [shouldFlush, setShouldFlush] = useState(false);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [generatedPasswordsCsv, setGeneratedPasswordsCsv] = useState(null);
  const [error, setError] = useState("");
  const [processingError, setProcessingError] = useState(null);
  const [progress, setProgress] = useState({ currentEmail: "", currentCount: 0, totalCount: 0 });

  if (!isOpen) return null;

  const handleFileSelect = async (file) => {
    setError("");
    try {
      const parsedData = await parseCSV(file);
      const { validRows, invalidRows } = validateImportData(parsedData);
      
      setValidRows(validRows);
      setInvalidRows(invalidRows);

      if (invalidRows.length > 0) {
        setStep("RESOLVE_ERRORS");
      } else {
        startProcessing(validRows, shouldFlush);
      }
    } catch (err) {
      setError(err.message || "Failed to parse CSV file.");
    }
  };

  const startProcessing = async (finalValidRows, flush) => {
    setStep("PROCESSING");
    setError("");
    setProcessingError(null);
    setProgress({ currentEmail: "", currentCount: 0, totalCount: finalValidRows.length });

    try {
      if (flush) {
        await flushUsers(userProfile.uid);
      }

      const handleProgress = (email, count, total) => {
        setProgress({ currentEmail: email, currentCount: count, totalCount: total });
      };

      const { successCount, generatedPasswords, processingError: pError } = await processValidRows(
        finalValidRows,
        handleProgress
      );
      
      setSuccessCount(successCount);
      setProcessingError(pError);
      
      if (generatedPasswords.length > 0) {
        setGeneratedPasswordsCsv(generatePasswordCSV(generatedPasswords));
      } else {
        setGeneratedPasswordsCsv(null);
      }

      setStep("SUCCESS");
    } catch (err) {
      setError(err.message || "An error occurred during processing.");
      setStep("SELECT_FILE"); // go back or show error state
    }
  };

  const handleResolveErrorsComplete = (resolvedRows) => {
    const finalValidRows = [...validRows, ...resolvedRows];
    startProcessing(finalValidRows, shouldFlush);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Bulk Import Users</h2>
            <p style={styles.modalSubtitle}>
              {step === "SELECT_FILE" && "Upload a CSV file to add or update users."}
              {step === "RESOLVE_ERRORS" && "Resolve data issues before importing."}
              {step === "PROCESSING" && "Please wait, processing data..."}
              {step === "SUCCESS" && "Import completed successfully."}
            </p>
          </div>
          {step !== "PROCESSING" && (step !== "SUCCESS" || !generatedPasswordsCsv) && (
            <button onClick={onClose} style={styles.closeButton}>
              ×
            </button>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.modalContent}>
          {step === "SELECT_FILE" && (
            <BulkImportFileSelector
              onFileSelect={handleFileSelect}
              shouldFlush={shouldFlush}
              setShouldFlush={setShouldFlush}
              onCancel={onClose}
            />
          )}

          {step === "RESOLVE_ERRORS" && (
            <BulkImportErrorResolver
              invalidRows={invalidRows}
              onComplete={handleResolveErrorsComplete}
              onCancel={onClose}
            />
          )}

          {step === "PROCESSING" && (
            <BulkImportProgress 
              currentEmail={progress.currentEmail}
              currentCount={progress.currentCount}
              totalCount={progress.totalCount}
            />
          )}

          {step === "SUCCESS" && (
            <BulkImportSuccess
              successCount={successCount}
              generatedPasswordsCsv={generatedPasswordsCsv}
              processingError={processingError}
              onClose={() => {
                if (onComplete) onComplete();
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "800px",
    maxWidth: "95%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #f0e5d8",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalTitle: {
    margin: 0,
    color: "#2b160c",
    fontSize: "20px",
    fontWeight: "800",
  },
  modalSubtitle: {
    margin: "4px 0 0",
    color: "#7e6d62",
    fontSize: "14px",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#7e6d62",
  },
  modalContent: {
    padding: "24px",
    overflowY: "auto",
  },
  errorBox: {
    margin: "20px 24px 0",
    padding: "12px 16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    fontSize: "14px",
  },
};
