import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "owner";
}

export interface VerifyAuthResult {
  authorized: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Validates whether an entered email belongs to a user or employee with strictly
 * "admin" or "owner" role in Firestore.
 */
export async function verifyFlowAccess(inputEmail: string): Promise<VerifyAuthResult> {
  const cleanEmail = (inputEmail || "").trim().toLowerCase();
  if (!cleanEmail) {
    return {
      authorized: false,
      error: "Please enter your email address.",
    };
  }

  try {
    let matchedDoc: any = null;

    // 1. Query `users` collection
    try {
      const usersCol = collection(db, "users");
      const usersSnap = await getDocs(usersCol);
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const docEmail = (data.email || "").trim().toLowerCase();
        if (docEmail === cleanEmail) {
          matchedDoc = { id: docSnap.id, ...data };
        }
      });
    } catch (err) {
      console.warn("Error querying users collection:", err);
    }

    // 2. Fallback check on `employees` collection if not matched yet
    if (!matchedDoc) {
      try {
        const empCol = collection(db, "employees");
        const empSnap = await getDocs(empCol);
        empSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const docEmail = (data.email || "").trim().toLowerCase();
          if (docEmail === cleanEmail) {
            matchedDoc = { id: docSnap.id, ...data };
          }
        });
      } catch {
        // collection might not exist yet
      }
    }

    if (!matchedDoc) {
      return {
        authorized: false,
        error: "Access Denied: Admin or Owner clearance required.",
      };
    }

    // 3. Strict clearance verification: must be "admin" or "owner"
    const rawRole = matchedDoc.role || matchedDoc.assignedRole || "";
    const normalizedRole = String(rawRole).trim().toLowerCase();

    if (normalizedRole === "admin" || normalizedRole === "owner") {
      return {
        authorized: true,
        user: {
          id: matchedDoc.id,
          email: matchedDoc.email || cleanEmail,
          name: matchedDoc.name || cleanEmail.split("@")[0],
          role: normalizedRole as "admin" | "owner",
        },
      };
    }

    return {
      authorized: false,
      error: "Access Denied: Admin or Owner clearance required.",
    };
  } catch (err: any) {
    console.error("Error verifying access in Firestore:", err);
    return {
      authorized: false,
      error: "Access Denied: Admin or Owner clearance required.",
    };
  }
}
