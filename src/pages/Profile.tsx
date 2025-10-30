import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import uploadImage from '../lib/imageUploader';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Profile = () => {
  const { currentUser, updateProfile, switchRole } = useAuth() as any;
  const [name, setName] = useState(currentUser?.displayName || '');
  const [college, setCollege] = useState(currentUser?.college || currentUser?.university || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await uploadImage(file, `users/${currentUser.uid}`);
      const url = res.url;
      await updateProfile({ photoURL: url });
      toast.success('Profile picture updated');
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateProfile({ displayName: name, college, phone, bio });
      toast.success('Profile saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async () => {
    if (!currentUser) return;
    const newRole = currentUser.role === 'provider' ? 'renter' : 'provider';
    const confirmed = window.confirm(`Switch to ${newRole === 'provider' ? 'Provider (Lender)' : 'Renter'} mode?`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await switchRole(newRole);
      toast.success(`Role switched to ${newRole}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to switch role');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return <div className="p-8">Please login to access profile.</div>;

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center space-x-6">
          <div className="w-28 h-28 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl">{currentUser.displayName?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{currentUser.displayName}</h3>
            <p className="text-sm text-gray-400">{currentUser.email}</p>
            <div className="mt-3">
              <input type="file" ref={fileRef} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="p-3 bg-gray-900/40 border border-white/10 rounded" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input className="p-3 bg-gray-900/40 border border-white/10 rounded" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College / University" />
          <input className="p-3 bg-gray-900/40 border border-white/10 rounded" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
          <input className="p-3 bg-gray-900/40 border border-white/10 rounded" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="space-x-3">
            <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
            <Button variant="ghost" onClick={handleRoleToggle} disabled={loading}>{currentUser.role === 'provider' ? 'Switch to Renter' : 'Switch to Provider'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
