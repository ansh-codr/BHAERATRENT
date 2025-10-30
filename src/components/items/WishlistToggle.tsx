import { useState, type MouseEvent } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';

interface WishlistToggleProps {
  itemId: string;
  itemTitle?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const WishlistToggle = ({ itemId, itemTitle, className = '', size = 'md' }: WishlistToggleProps) => {
  const { currentUser, toggleWishlist } = useAuth();
  const [pending, setPending] = useState(false);

  const isSaved = currentUser?.wishlist?.includes(itemId) ?? false;

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUser) {
      toast.error('Sign in to save favorites.');
      return;
    }

    setPending(true);
    const nextState = !isSaved;

    try {
      await toggleWishlist(itemId);
      if (itemTitle) {
        toast.success(nextState ? `Saved “${itemTitle}”` : `Removed “${itemTitle}”`);
      } else {
        toast.success(nextState ? 'Added to favorites.' : 'Removed from favorites.');
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      toast.error('Could not update favorites. Try again.');
    } finally {
      setPending(false);
    }
  };

  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      disabled={pending}
      className={`flex items-center justify-center rounded-full border border-white/15 bg-black/60 text-gray-300 backdrop-blur-sm transition hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${dimension} ${pending ? 'cursor-wait opacity-70' : ''} ${isSaved ? 'border-cyan-400/60 text-cyan-200' : ''} ${className}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 transition-colors ${isSaved ? 'text-cyan-200' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
      )}
      <span className="sr-only">{isSaved ? 'Remove from favorites' : 'Save to favorites'}</span>
    </button>
  );
};

export default WishlistToggle;
