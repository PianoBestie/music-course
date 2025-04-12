export const uploadToCloudinary = async (file, folder = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    if (folder) formData.append('folder', folder);
  
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };
  
  export const deleteFromCloudinary = async (url) => {
    if (!url) return;
    
    try {
      // Extract public_id from URL
      const parts = url.split('/');
      const publicId = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      const fullPublicId = `${folder}/${publicId}`;
  
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureString = `public_id=${fullPublicId}&timestamp=${timestamp}${import.meta.env.VITE_CLOUDINARY_API_SECRET}`;
      const signature = await hashString(signatureString);
  
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_id: fullPublicId,
            api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
            timestamp,
            signature
          })
        }
      );
  
      if (!response.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };
  
  const hashString = async (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };