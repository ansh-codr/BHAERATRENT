import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification, NotificationType } from '../types';

const COLLECTION = 'notifications';

const mapNotification = (snapshot: QueryDocumentSnapshot<DocumentData>): Notification => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    title: data.title,
    body: data.body,
    type: (data.type as NotificationType) || 'system',
    read: Boolean(data.read),
    createdAt: (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt) || new Date(),
    metadata: data.metadata,
  };
};

export const createNotification = async (payload: {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}) => {
  await addDoc(collection(db, COLLECTION), {
    ...payload,
    type: payload.type || 'system',
    read: false,
    createdAt: serverTimestamp(),
  });
};

type NotificationListener = (notifications: Notification[]) => void;

const listenToNotifications = (constraints: QueryConstraint[], callback: NotificationListener) => {
  const notificationsRef = collection(db, COLLECTION);
  const q = query(notificationsRef, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map((docSnapshot) => mapNotification(docSnapshot))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(notifications);
  });
};

export const listenToNotificationsByUser = (userId: string, callback: NotificationListener) =>
  listenToNotifications([where('userId', '==', userId)], callback);

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, COLLECTION, notificationId), {
    read: true,
  });
};
