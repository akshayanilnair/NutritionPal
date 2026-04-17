import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, getDocs, onSnapshot, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  }
};

export const saveUserProfile = async (userId: string, data: any) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    } else {
      await setDoc(docRef, { ...data, uid: userId, createdAt: Timestamp.now() });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};

export const logFood = async (data: any) => {
  try {
    await addDoc(collection(db, 'foodLogs'), {
      ...data,
      userId: auth.currentUser?.uid,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'foodLogs');
  }
};

export const getFoodLogsByDate = async (userId: string, date: string) => {
  try {
    const q = query(collection(db, 'foodLogs'), where('userId', '==', userId), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'foodLogs');
  }
};

export const deleteFoodLog = async (logId: string) => {
  try {
    await deleteDoc(doc(db, 'foodLogs', logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `foodLogs/${logId}`);
  }
};

export const saveMealPlan = async (userId: string, date: string, plan: string) => {
  try {
    const q = query(collection(db, 'mealPlans'), where('userId', '==', userId), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, 'mealPlans', docId), { plan, updatedAt: Timestamp.now() });
    } else {
      await addDoc(collection(db, 'mealPlans'), {
        userId,
        date,
        plan,
        createdAt: Timestamp.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'mealPlans');
  }
};

export const getMealPlan = async (userId: string, date: string): Promise<{ id: string, plan: string, [key: string]: any } | null> => {
  try {
    const q = query(collection(db, 'mealPlans'), where('userId', '==', userId), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      return { id: querySnapshot.docs[0].id, plan: data.plan, ...data };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'mealPlans');
    return null;
  }
};

export const logWeight = async (userId: string, date: string, weight: number) => {
  try {
    const q = query(collection(db, 'weightLogs'), where('userId', '==', userId), where('date', '==', date));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, 'weightLogs', docId), { weight });
    } else {
      await addDoc(collection(db, 'weightLogs'), {
        userId,
        date,
        weight,
        createdAt: Timestamp.now()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'weightLogs');
  }
};

export const getWeightLogs = async (userId: string) => {
  try {
    const q = query(collection(db, 'weightLogs'), where('userId', '==', userId), orderBy('date', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'weightLogs');
  }
};
