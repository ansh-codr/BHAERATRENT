import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types';

const COLLECTION = 'messages';

const mapMessage = (snapshot: QueryDocumentSnapshot<DocumentData>): Message => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    bookingId: data.bookingId,
    senderId: data.senderId,
    receiverId: data.receiverId,
    content: data.content,
    read: Boolean(data.read),
    createdAt: (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt) || new Date(),
  };
};

export const listenToMessages = (bookingId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, COLLECTION);
  const q = query(messagesRef, where('bookingId', '==', bookingId), orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnapshot) => mapMessage(docSnapshot));
    callback(messages);
  });
};

export const sendMessage = async (payload: {
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
}) => {
  await addDoc(collection(db, COLLECTION), {
    ...payload,
    read: false,
    createdAt: serverTimestamp(),
  });
};
