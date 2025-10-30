import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Store, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';

export const Onboarding = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [university, setUniversity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, updateUserRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.university) {
      setUniversity(currentUser.university);
    } else if (currentUser?.college) {
      setUniversity(currentUser.college);
    }

    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    if (!currentUser) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updateUserRole(selectedRole, university);
  navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to BharatRent</h2>
          <p className="text-gray-400 mb-8">Tell us about yourself to get started</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-4">
                I want to...
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('renter')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'renter'
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'border-white/20 bg-gray-800/50 hover:border-white/40'
                  }`}
                >
                  <User className={`w-12 h-12 mb-4 ${selectedRole === 'renter' ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-bold text-white mb-2">Rent Items</h3>
                  <p className="text-gray-400 text-sm">
                    Browse and rent items from fellow students
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole('provider')}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedRole === 'provider'
                      ? 'border-purple-400 bg-purple-400/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'border-white/20 bg-gray-800/50 hover:border-white/40'
                  }`}
                >
                  <Store className={`w-12 h-12 mb-4 ${selectedRole === 'provider' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-bold text-white mb-2">Lend Items</h3>
                  <p className="text-gray-400 text-sm">
                    List your items and earn money
                  </p>
                </motion.div>
              </div>
            </div>

            <Input
              type="text"
              label="University Name"
              placeholder="e.g., MIT, Stanford University"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" disabled={loading || !selectedRole}>
              {loading ? 'Setting up...' : 'Continue'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
