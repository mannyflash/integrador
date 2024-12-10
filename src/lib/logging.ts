import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Adjust this import based on your Firebase setup

export const logAction = async (action: string, details: string) => {
  try {
    await addDoc(collection(db, 'logs'), {
      timestamp: serverTimestamp(),
      action,
      details,
      user: 'Sistema' // You might want to pass the user information as a parameter
    });
    console.log(`Action logged: ${action}`);
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

