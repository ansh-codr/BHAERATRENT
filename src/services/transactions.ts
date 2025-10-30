import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  Timestamp,
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, PaymentMethod } from '../types';

export const TRANSACTIONS_COLLECTION = 'transactions';

export function generateReferenceId(prefix = 'BHRTRNT'): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}_${random}`;
}

export const mapTransaction = (
  doc: QueryDocumentSnapshot<DocumentData>
): Transaction => {
  const data = doc.data();
  return {
    id: doc.id,
    bookingId: data.bookingId,
    amount: data.amount,
    renterId: data.renterId,
    providerId: data.providerId,
    method: data.method as PaymentMethod,
    status: data.status,
    referenceId: data.referenceId,
    createdAt: (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt) || new Date(),
  };
};

export const createTransaction = async (
  payload: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

type TransactionsListener = (transactions: Transaction[]) => void;

const listenToTransactions = (
  constraints: QueryConstraint[],
  callback: TransactionsListener
) => {
  const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
  const q = query(transactionsRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs
      .map((docSnapshot) => mapTransaction(docSnapshot))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(transactions);
  });
};

export const listenToTransactionsByRenter = (
  renterId: string,
  callback: TransactionsListener
) => listenToTransactions([where('renterId', '==', renterId)], callback);

export const listenToTransactionsByProvider = (
  providerId: string,
  callback: TransactionsListener
) => listenToTransactions([where('providerId', '==', providerId)], callback);
