import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Only images are allowed.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Max size is 5 MB.');
  }
}

// Returns { url, thumb? } where thumb is a transformed URL (Cloudinary) if available
export async function uploadImage(file: File, pathPrefix = 'uploads'): Promise<{ url: string; thumb?: string }> {
  validateImageFile(file);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (cloudName && uploadPreset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);

      const res = await fetch(url, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        throw new Error('Cloudinary upload failed: ' + res.statusText);
      }

      const data = await res.json();
      // data.secure_url and data.public_id and data.format are available
      const urlRes: string = data.secure_url;
      // Construct a thumbnail URL (transformations in URL path)
      const publicId = data.public_id;
      const format = data.format || '';
      const thumb = `https://res.cloudinary.com/${cloudName}/image/upload/w_600,c_fill/${publicId}.${format}`;
      return { url: urlRes, thumb };
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to Firebase Storage:', err);
      // fall through to Firebase Storage
    }
  }

  // Firebase Storage fallback
  try {
    const storageRef = ref(storage, `${pathPrefix}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url };
  } catch (err) {
    console.error('Firebase Storage upload failed:', err);
    throw err;
  }
}

export default uploadImage;
