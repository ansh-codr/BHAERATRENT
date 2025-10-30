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
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types';
import { createNotification } from './notifications';

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

export interface SendMessagePayload {
  bookingId: string;
  senderId: string;
  receiverId: string;
  content: string;
  bookingTitle?: string;
  senderName?: string;
}

export const sendMessage = async (payload: SendMessagePayload) => {
  const docRef = await addDoc(collection(db, COLLECTION), {
    bookingId: payload.bookingId,
    senderId: payload.senderId,
    receiverId: payload.receiverId,
    content: payload.content,
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await updateDoc(doc(db, 'bookings', payload.bookingId), {
      lastMessagePreview: payload.content.slice(0, 160),
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: payload.senderId,
    });
  } catch (error) {
    console.error('Failed to update booking with last message metadata:', error);
  }

  try {
    await createNotification({
      userId: payload.receiverId,
      title: 'New chat message',
      body:
        payload.senderName && payload.bookingTitle
          ? `${payload.senderName} sent a message about ${payload.bookingTitle}.`
          : 'You have a new message about your booking.',
      type: 'chat',
      metadata: {
        bookingId: payload.bookingId,
        senderId: payload.senderId,
      },
    });
  } catch (error) {
    console.error('Failed to create chat notification:', error);
  }

  return docRef.id;
};
