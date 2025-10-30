import { useCallback, useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, PaymentMethod, Transaction } from '../types';
import { createTransaction, generateReferenceId } from '../services/transactions';

export type PaymentStatusState = 'idle' | 'processing' | 'success' | 'failed';

export interface PaymentPayload {
  booking: Booking;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResult {
  status: PaymentStatusState;
  referenceId?: string;
  error?: string | null;
}

const sleep = (min = 1500, max = 2000) =>
  new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const pruneUndefined = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;

export const usePaymentSimulator = () => {
  const [status, setStatus] = useState<PaymentStatusState>('idle');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setReferenceId(null);
    setError(null);
  }, []);

  const processPayment = useCallback(
    async ({ booking, amount, method }: PaymentPayload): Promise<PaymentResult> => {
      setStatus('processing');
      setError(null);
      setReferenceId(null);

      await sleep();

  const success = Math.random() > 0.1;
  const reference = generateReferenceId();
  const transactionStatus: Transaction['status'] = success ? 'success' : 'failed';

      try {
        const transactionPayload: Omit<Transaction, 'id' | 'createdAt'> = {
          bookingId: booking.id,
          amount,
          renterId: booking.renterId,
          providerId: booking.providerId,
          method,
          status: transactionStatus,
          referenceId: reference,
          itemTitle: booking.itemTitle,
          renterName: booking.renterName,
          providerName: booking.providerName,
        };

        if (success) {
          const transactionId = await createTransaction(pruneUndefined(transactionPayload));

          await updateDoc(doc(db, 'bookings', booking.id), {
            paymentStatus: 'success',
            status: 'confirmed',
            paymentMethod: method,
            transactionId,
            updatedAt: Timestamp.now(),
          });

          setStatus('success');
          setReferenceId(reference);

          return { status: 'success', referenceId: reference };
        }

  await createTransaction(pruneUndefined(transactionPayload));
        await updateDoc(doc(db, 'bookings', booking.id), {
          paymentStatus: 'failed',
          paymentMethod: method,
          status: 'pending',
          updatedAt: Timestamp.now(),
        });

        setStatus('failed');
        setReferenceId(reference);
        setError('Payment failed. Please try again.');
        return { status: 'failed', referenceId: reference, error: 'Payment failed. Please try again.' };
      } catch (err) {
        console.error('Payment simulation error:', err);
        setStatus('failed');
        setError('Something went wrong. Please retry.');
        return { status: 'failed', referenceId: reference, error: 'Something went wrong. Please retry.' };
      }
    },
    []
  );

  return {
    status,
    referenceId,
    error,
    processPayment,
    reset,
  };
};

export default usePaymentSimulator;
