import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const TutorialCards = () => {
  const { currentUser, markTutorialCompleted } = useAuth() as any;
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const emit = useCallback((eventName: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName));
    }
  }, []);

  const steps = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'provider') {
      return [
        {
          title: 'Add your first listing',
          desc: 'Click "Add New Item" to create a listing, upload photos, and set daily pricing.',
          ctaLabel: 'Add New Item',
          onAction: () => {
            navigate('/provider');
            emit('provider:add-item');
          },
        },
        {
          title: 'Track bookings',
          desc: 'View incoming bookings and flip availability right from your dashboard.',
          ctaLabel: 'View Bookings',
          onAction: () => {
            navigate('/provider');
            emit('provider:show-bookings');
          },
        },
        {
          title: 'Polish your profile',
          desc: 'Add a profile picture and set your college so renters can discover you.',
          ctaLabel: 'Update Profile',
          onAction: () => navigate('/profile'),
        },
      ];
    }

    return [
      {
        title: 'Discover campus rentals',
        desc: 'Browse the marketplace for trending gear from trusted peers.',
        ctaLabel: 'Explore Marketplace',
        onAction: () => navigate('/marketplace'),
      },
      {
        title: 'Manage your bookings',
        desc: 'Track upcoming rentals and status updates from your dashboard.',
        ctaLabel: 'Go to Dashboard',
        onAction: () => navigate('/renter'),
      },
      {
        title: 'Complete your profile',
        desc: 'Add a profile picture and verify your college to boost trust.',
        ctaLabel: 'Update Profile',
        onAction: () => navigate('/profile'),
      },
    ];
  }, [currentUser, navigate, emit]);

  useEffect(() => {
    setIndex(0);
  }, [currentUser?.role]);

  if (!currentUser || currentUser.tutorialCompleted || steps.length === 0) return null;

  const next = () => {
    if (index >= steps.length - 1) {
      markTutorialCompleted();
    } else {
      setIndex(index + 1);
    }
  };

  const skip = () => {
    markTutorialCompleted();
  };

  const step = steps[index];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed right-6 bottom-6 z-50 w-80"
    >
      <div className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-lg">
        <h4 className="text-white font-bold mb-2">{step.title}</h4>
        <p className="text-gray-300 text-sm mb-4">{step.desc}</p>
        {step.ctaLabel && (
          <button
            onClick={step.onAction}
            className="mb-3 w-full rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-black shadow-lg hover:bg-amber-300 transition"
          >
            {step.ctaLabel}
          </button>
        )}
        <div className="flex justify-between">
          <button onClick={skip} className="text-sm text-gray-300 underline">Skip</button>
          <button onClick={next} className="bg-amber-400 text-black px-3 py-1 rounded font-semibold">{index === steps.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialCards;
