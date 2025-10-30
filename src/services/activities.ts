import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../lib/firebase';
import { Activity, ActivityType } from '../types';

export interface RecordActivityInput {
  userId: string;
  title: string;
  description: string;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}

type ActivityDoc = QueryDocumentSnapshot<DocumentData>;

const normalizeActivity = (docSnapshot: ActivityDoc): Activity => {
  const data = docSnapshot.data();
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();

  return {
    id: docSnapshot.id,
    userId: data.userId,
    title: data.title,
    description: data.description,
    type: data.type || 'system',
    createdAt,
    metadata: data.metadata,
  } as Activity;
};

export const recordActivity = async ({ userId, title, description, type, metadata }: RecordActivityInput) => {
  await addDoc(collection(db, 'activities'), {
    userId,
    title,
    description,
    type,
    metadata: metadata ?? null,
    createdAt: Timestamp.now(),
  });
};

export const listenToActivities = (
  userId: string,
  callback: (activities: Activity[]) => void,
  limitCount = 20,
) => {
  if (!userId) {
    callback([]);
    return () => undefined;
  }

  const activitiesQuery = query(
    collection(db, 'activities'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );

  return onSnapshot(
    activitiesQuery,
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => normalizeActivity(docSnapshot)));
    },
    (error) => {
      console.error('Activities listener error:', error);
      callback([]);
    },
  );
};
