import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface AuthUser {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: "owner";
}

export interface VerifyAuthResult {
  authorized: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Access is restricted STRICTLY to Owners and Partners.
 * Checks `/users` and `/employees` in Firestore.
 * Grants access ONLY if:
 * role.toLowerCase() === 'owner' or
 * assignedRole.toLowerCase() === 'owner' or
 * designation.toLowerCase().includes('owner') or
 * designation.toLowerCase().includes('partner')
 * Regular employees or non-owners are blocked with:
 * "Access Denied: Owner clearance required."
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
      console.warn("Notice: Error querying users collection:", err);
    }

    // 2. Fallback check on `employees` collection if not found in `users`
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
      } catch (err) {
        console.warn("Notice: Error querying employees collection:", err);
      }
    }

    if (!matchedDoc) {
      return {
        authorized: false,
        error: "Access Denied: Owner clearance required.",
      };
    }

    // 3. Strict clearance verification: MUST be Owner or Partner
    const role = String(matchedDoc.role || "").trim().toLowerCase();
    const assignedRole = String(matchedDoc.assignedRole || "").trim().toLowerCase();
    const designation = String(matchedDoc.designation || "").trim().toLowerCase();

    const isOwner =
      role === "owner" ||
      assignedRole === "owner" ||
      designation.includes("owner") ||
      designation.includes("partner");

    if (isOwner) {
      return {
        authorized: true,
        user: {
          id: matchedDoc.id,
          uid: matchedDoc.id,
          email: matchedDoc.email || cleanEmail,
          name: matchedDoc.name || cleanEmail.split("@")[0],
          role: "owner",
        },
      };
    }

    return {
      authorized: false,
      error: "Access Denied: Owner clearance required.",
    };
  } catch (err: any) {
    console.error("Error verifying access in Firestore:", err);
    return {
      authorized: false,
      error: "Access Denied: Owner clearance required.",
    };
  }
}
