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
export interface UploadOptions {
  pathPrefix?: string;
  onProgress?: (progress: number) => void;
}

export async function uploadImage(
  file: File,
  pathPrefixOrOptions: string | UploadOptions = 'uploads'
): Promise<{ url: string; thumb?: string }> {
  validateImageFile(file);

  let onProgress: UploadOptions['onProgress'];

  if (typeof pathPrefixOrOptions !== 'string') {
    onProgress = pathPrefixOrOptions.onProgress;
  }

  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || '64ddc0080a0798b4cf4e54283d0a1430';
  if (!apiKey) {
    throw new Error('Missing IMGBB API key.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  const base64 = btoa(binary);

  // notify caller that conversion is done
  onProgress?.(20);

  const formData = new FormData();
  formData.append('image', base64);
  formData.append('name', file.name.replace(/\s+/g, '_'));

  const uploadUrl = new URL('https://api.imgbb.com/1/upload');
  uploadUrl.searchParams.set('key', apiKey);

  const response = await fetch(uploadUrl.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error('Image upload failed: unexpected response');
  }

  onProgress?.(100);

  return {
    url: data.data?.url,
    thumb: data.data?.thumb?.url || data.data?.display_url,
  };
}

export default uploadImage;
