import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Calendar, Package, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TutorialCards } from '../components/TutorialCards';
import { Booking } from '../types';
import { format } from 'date-fns';

export const RenterDashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('renterId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Booking));

      setBookings(fetchedBookings);
      setLoading(false);
    }, (err) => {
      console.error('Realtime bookings error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-lime-400/20 border-lime-400 text-lime-400';
      case 'active':
        return 'bg-cyan-400/20 border-cyan-400 text-cyan-400';
      case 'completed':
        return 'bg-purple-400/20 border-purple-400 text-purple-400';
      case 'cancelled':
        return 'bg-red-400/20 border-red-400 text-red-400';
      default:
        return 'bg-gray-400/20 border-gray-400 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <TutorialCards />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2">Renter Dashboard</h1>
          <p className="text-gray-400">Track your rentals and bookings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-black text-white">{bookings.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-cyan-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active</p>
                <p className="text-3xl font-black text-white">
                  {bookings.filter(b => b.status === 'active').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-lime-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Completed</p>
                <p className="text-3xl font-black text-white">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-400" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-black text-white">
                  ₹{bookings.reduce((sum, b) => sum + b.totalPrice, 0)}
                </p>
              </div>
              <Package className="w-12 h-12 text-pink-400" />
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">My Bookings</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32 animate-pulse"><div className="h-full" /></Card>
              ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-bold text-white text-lg">Booking #{booking.id.slice(0, 8)}</h4>
                        <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Start Date</p>
                          <p className="text-white font-semibold">
                            {format(booking.startDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">End Date</p>
                          <p className="text-white font-semibold">
                            {format(booking.endDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Total Price</p>
                          <p className="text-cyan-400 font-bold text-lg">₹{booking.totalPrice}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
            <p className="text-gray-500">Start exploring items to rent!</p>
          </Card>
        )}
      </div>
    </div>
  );
};
