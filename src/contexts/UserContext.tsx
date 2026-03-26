import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface UserContextType {
  user: FirebaseUser | null;
  userData: any | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u?.uid || "No user");
      setUser(u);
      if (!u) {
        console.log("User is logged out");
        setUserData(null);
        setLoading(false);
      } else {
        console.log("User is logged in, fetching data for:", u.uid);
        // If we have a user, we should be in a loading state until userData is fetched
        setLoading(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log("Attaching onSnapshot for user data:", user.uid);
    const unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        console.log("User data loaded:", doc.data().firstName);
        setUserData(doc.data());
      } else {
        console.warn("User document does not exist for:", user.uid);
        setUserData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeDoc();
  }, [user]);

  return (
    <UserContext.Provider value={{ user, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
