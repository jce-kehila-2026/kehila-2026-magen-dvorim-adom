import Papa from "papaparse";
import {
  updateUserProfileAdmin,
  getAllUsers,
} from "./userService";
import { registerUser } from "./authService";
import { buildUserProfile, validateUserProfile, USER_ROLES } from "./userSchema";
import * as XLSX from "xlsx";

// Generates a secure, random password for new users
export const generatePassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(crypto.getRandomValues(new Uint32Array(12)))
    .map((x) => chars[x % chars.length])
    .join("");
};

// Parses CSV file to JSON array
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;

      let text;

      // HANDLE EXCEL FILES
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert Excel → CSV
        text = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        // CSV
        text = data;
      }

      const lines = text.split(/\r?\n/);

      let headerRowIndex = 0;

      // Look for a line that contains recognizable headers, stop searching after 10 lines
      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const line = lines[i].toLowerCase();
        if (
          line.includes('שם פרטי') ||
          line.includes('דוא"ל') ||
          line.includes('דוא""ל') ||
          line.includes('email') ||
          line.includes('full name') ||
          line.includes('name')
        ) {
          headerRowIndex = i;
          break;
        }
      }

      const cleanText = lines.slice(headerRowIndex).join("\n");

      Papa.parse(cleanText, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => resolve(results),
        error: (err) => reject(err),
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

// Validates the parsed CSV data against the user schema
export const validateImportData = (parsedData) => {
  const validRows = [];
  const invalidRows = [];

  // Define how we expect the headers, we will map them dynamically
  const getHeaderValue = (row, ...possibleKeys) => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && typeof row[key] === 'string') {
        return row[key].trim();
      } else if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
    }
    return "";
  };

  parsedData.data.forEach((row, index) => {
    const firstName = getHeaderValue(row, "שם פרטי", "First Name", "first_name");
    const lastName = getHeaderValue(row, "שם המשפחה", "שם משפחה", "Last Name", "last_name");

    let fullName = getHeaderValue(row, "Full Name", "full_name", "FullName", "Name", "name", "שם מלא");
    if (!fullName && firstName && lastName) {
      fullName = `${firstName} ${lastName}`;
    } else if (!fullName && firstName) {
      fullName = firstName;
    }

    const heightWorkVal = getHeaderValue(row, "היתר עבודה בגובה", "height_work");
    const hasHeightWork = heightWorkVal === "1" || heightWorkVal === "כן" || heightWorkVal === "true";

    let rawRole = getHeaderValue(row, "Role", "role", "תפקיד");
    let mappedRole = USER_ROLES.VOLUNTEER;
    if (rawRole) {
      const lowerRole = rawRole.toLowerCase();
      if (lowerRole.includes("admin") || lowerRole.includes("אדמין")) mappedRole = USER_ROLES.ADMIN;
      else if (lowerRole.includes("coordinator") || lowerRole.includes("רכז")) mappedRole = USER_ROLES.COORDINATOR;
    }

    const profileData = {
      full_name: fullName,
      email: getHeaderValue(row, "Email", "email", "Mail", "mail", "דוא\"ל", "דוא\"\"ל"),
      phone: getHeaderValue(row, "Phone", "phone", "Phone Number", "phoneNumber", "מספר נייד", "טלפון נייד", "טלפון"),
      city: getHeaderValue(row, "City", "city", "Location", "location", "עיר / יישוב", "יישוב", "עיר"),
      occupation: getHeaderValue(row, "Occupation", "occupation", "Job", "job"),
      role: mappedRole,
      licenses: {
        height_work: hasHeightWork
      }
    };

    const profile = buildUserProfile(profileData);
    const validation = validateUserProfile(profile);

    const warnings = {};
    if (!profile.occupation) {
      warnings.occupation = "Occupation is recommended but missing.";
    }

    if (validation.isValid) {
      validRows.push({ id: index, rawData: row, profile, warnings });
    } else {
      invalidRows.push({ id: index, rawData: row, profile, errors: validation.errors });
    }
  });

  return { validRows, invalidRows };
};

// Flushes users by setting is_active to false. Skips the current admin.
export const flushUsers = async (currentAdminUid) => {
  let allUsers = [];
  let lastDoc = null;
  let hasMore = true;

  // Retry wrapper for API calls
  const withRetry = async (fn, retries = 8, delay = 10000) => {
    try {
      return await fn();
    } catch (err) {
      if (retries === 0) throw err;
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
  };

  // Paginate through all users to flush them
  while (hasMore) {
    const result = await withRetry(() => getAllUsers(100, lastDoc));
    const users = result.users || [];
    allUsers = [...allUsers, ...users];

    if (users.length < 100) {
      hasMore = false;
    } else {
      lastDoc = result.lastDoc;
    }
  }

  // Deactivate all users except the current admin
  const updatePromises = allUsers.map((user) => {
    if (user.uid !== currentAdminUid && user.is_active !== false) {
      return withRetry(() => updateUserProfileAdmin(user.uid, { is_active: false }));
    }
    return Promise.resolve();
  });

  await Promise.all(updatePromises);
};

// Processes the final list of valid rows, upserting them in Firestore/Auth
export const processValidRows = async (validRows, onProgress) => {
  const generatedPasswords = [];
  let successCount = 0;
  let processingError = null;

  // STEP 1: Load ALL users once (huge improvement)
  const allUsersResult = await getAllUsers(1000);
  const usersByEmail = new Map();

  (allUsersResult.users || []).forEach((user) => {
    if (user.email) {
      usersByEmail.set(user.email.toLowerCase(), user);
    }
  });

  // STEP 2: batching
  const BATCH_SIZE = 20;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row, index) => {
        try {
          const email = row.profile.email.toLowerCase();
          const existingUser = usersByEmail.get(email);

          if (existingUser) {
            // update existing
            await updateUserProfileAdmin(existingUser.uid, {
              ...row.profile,
              is_active: true,
              deleted_at: null,
            });
          } else {
            // create new
            const password = generatePassword();

            await registerUser(row.profile.email, password, {
              ...row.profile,
              is_active: true,
            });

            generatedPasswords.push({
              "Full Name": row.profile.full_name,
              Email: row.profile.email,
              Password: password,
            });
          }

          successCount++;

          if (onProgress) {
            onProgress(
              row.profile.email,
              i + index + 1,
              validRows.length
            );
          }
        } catch (err) {
          processingError = `Failed at ${row.profile.email}: ${err.message}`;
        }
      })
    );

    // small delay between batches (important for Firebase)
    await new Promise((res) => setTimeout(res, 200));
  }

  return { successCount, generatedPasswords, processingError };
};


// Converts the passwords array to CSV string
export const generatePasswordCSV = (passwordsArray) => {
  return Papa.unparse(passwordsArray);
};
