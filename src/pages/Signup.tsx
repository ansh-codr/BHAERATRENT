import { useState, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ShoppingBag, ImageUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import uploadImage, { validateImageFile } from '../lib/imageUploader';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [collegeIdUrl, setCollegeIdUrl] = useState('');
  const [collegeIdPreview, setCollegeIdPreview] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!collegeIdUrl) {
      setError('Please upload a clear photo of your college ID card to continue.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName, collegeIdUrl);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('Google sign-in is temporarily disabled while we manually verify college ID cards. Please sign up with your university email above.');
  };

  const handleCollegeIdUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      validateImageFile(file);
      setUploadingId(true);
      setUploadProgress(0);

      const { url, thumb } = await uploadImage(file, {
        onProgress: (progress) => setUploadProgress(progress),
      });

      setCollegeIdUrl(url);
      setCollegeIdPreview(thumb || url);
    } catch (err: any) {
      console.error('College ID upload failed:', err);
      setError(err.message || 'Failed to upload college ID card. Please try again.');
      setCollegeIdUrl('');
      setCollegeIdPreview(null);
    } finally {
      setUploadingId(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4"
          >
            <ShoppingBag className="w-10 h-10 text-black" />
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-2">BharatRent</h1>
          <p className="text-gray-400">Join your campus community</p>
        </div>

        <Card className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border-2 border-red-500 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              type="email"
              label="University Email"
              placeholder="your.email@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">College ID Card</label>
              <div className="rounded-2xl border-2 border-dashed border-white/20 bg-gray-900/40 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-200">
                    <ImageUp className="h-6 w-6" />
                  </div>
                  <div className="flex-1 text-sm text-gray-300 space-y-2">
                    <p className="font-semibold text-white">Upload your campus ID</p>
                    <p className="text-gray-400 text-xs">
                      To keep BharatRent trusted we verify each student manually. Share a clear photo of your official college ID card. Only verified partners you rent with can view it.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-sm"
                        onClick={() => document.getElementById('college-id-upload')?.click()}
                        disabled={uploadingId}
                      >
                        {uploadingId ? 'Uploading…' : collegeIdUrl ? 'Replace ID' : 'Upload ID'}
                      </Button>
                      <input
                        id="college-id-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCollegeIdUpload}
                        disabled={uploadingId}
                      />
                      {collegeIdUrl ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                          <ShieldCheck className="h-3 w-3" />
                          ID ready for review
                        </span>
                      ) : null}
                    </div>
                    {uploadingId && uploadProgress > 0 ? (
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
                {collegeIdPreview ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <img src={collegeIdPreview} alt="Uploaded college ID" className="h-48 w-full object-cover" />
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                We store this securely and only surface it to confirmed lenders or renters you interact with.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || uploadingId}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/80 text-gray-400">OR</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading || uploadingId}
          >
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};
