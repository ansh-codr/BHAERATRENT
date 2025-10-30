import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Mail, Phone, MapPin, ShieldCheck, User as UserIcon, Loader2 } from 'lucide-react';

import { db } from '../../lib/firebase';
import { User } from '../../types';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  heading?: string;
  onClose: () => void;
}

interface ProfileState extends Partial<User> {
  createdAt?: Date;
}

const mapTimestamp = (value: unknown): Date | undefined => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
};

const UserProfileModal = ({ userId, isOpen, heading, onClose }: UserProfileModalProps) => {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await getDoc(doc(db, 'users', userId));
        if (!snapshot.exists()) {
          if (!cancelled) {
            setProfile(null);
            setError('Profile not found.');
          }
          return;
        }

        if (cancelled) return;

        const data = snapshot.data();
        setProfile({
          uid: userId,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          phone: data.phone,
          university: data.university || data.college,
          college: data.college || data.university,
          bio: data.bio,
          collegeIdUrl: data.collegeIdUrl,
          createdAt: mapTimestamp(data.createdAt),
        });
      } catch (err) {
        console.error('Failed to load profile details:', err);
        if (!cancelled) {
          setError('Failed to load user details. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-[0_30px_120px_rgba(15,23,42,0.6)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Profile</p>
                <h3 className="text-2xl font-black text-white">{heading || 'User details'}</h3>
                {profile?.role ? (
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-wide text-cyan-200">
                    {profile.role}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 text-2xl font-bold text-white">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.displayName || 'Avatar'}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <UserIcon className="h-7 w-7 text-cyan-200" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{profile?.displayName || 'Student'}</p>
                  <p className="text-xs text-gray-400">Joined {profile?.createdAt ? profile.createdAt.toLocaleDateString() : 'recently'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm text-gray-200">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching profile details…
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-rose-100">
                  {error}
                </div>
              ) : (
                <>
                  {profile?.email ? (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-cyan-300" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                        <p className="font-semibold text-white">{profile.email}</p>
                      </div>
                    </div>
                  ) : null}

                  {profile?.phone ? (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-cyan-300" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                        <p className="font-semibold text-white">{profile.phone}</p>
                      </div>
                    </div>
                  ) : null}

                  {profile?.university ? (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-cyan-300" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">University</p>
                        <p className="font-semibold text-white">{profile.university}</p>
                      </div>
                    </div>
                  ) : null}

                  {profile?.bio ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Bio</p>
                      <p className="mt-1 text-sm text-white/90 whitespace-pre-line">{profile.bio}</p>
                    </div>
                  ) : null}

                  {profile?.collegeIdUrl ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">College ID card</p>
                      <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <img
                          src={profile.collegeIdUrl}
                          alt="College ID card"
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-100">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-sm">College ID not uploaded yet.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default UserProfileModal;
