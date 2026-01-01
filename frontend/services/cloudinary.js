/**
 * Cloudinary Image Upload Service
 * Handles image uploads to Cloudinary for profile pictures and other media
 */
import Constants from 'expo-constants';

/**
 * Upload an image to Cloudinary
 * @param {string} imageUri - Local image URI from ImagePicker
 * @param {string} folder - Cloudinary folder name (e.g., 'profile-pictures')
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImageToCloudinary = async (imageUri, folder = 'profile-pictures') => {
  try {
    // Get Cloudinary configuration from environment variables
    const cloudName = Constants.expoConfig?.extra?.cloudinaryCloudName;
    const uploadPreset = Constants.expoConfig?.extra?.cloudinaryUploadPreset;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check your .env file.');
    }

    // Create form data
    const formData = new FormData();
    
    // Get file extension from URI
    const fileExtension = imageUri.split('.').pop();
    const fileName = `upload_${Date.now()}.${fileExtension}`;

    // Append image file
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileExtension}`,
      name: fileName,
    });

    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok && data.secure_url) {
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
      };
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
};

/**
 * Upload a document (image or PDF) to Cloudinary
 * @param {string} fileUri - Local file URI from DocumentPicker or ImagePicker
 * @param {string} folder - Cloudinary folder name (e.g., 'certifications', 'projects')
 * @param {string} resourceType - 'image', 'raw' (for PDFs), or 'auto'
 * @returns {Promise<{success: boolean, url?: string, fileType?: string, error?: string}>}
 */
export const uploadDocument = async (fileUri, folder = 'documents', resourceType = 'auto') => {
  try {
    // Get Cloudinary configuration from environment variables
    const cloudName = Constants.expoConfig?.extra?.cloudinaryCloudName;
    const uploadPreset = Constants.expoConfig?.extra?.cloudinaryUploadPreset;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check your .env file.');
    }

    // Determine file type
    const fileExtension = fileUri.split('.').pop().toLowerCase();
    const isPdf = fileExtension === 'pdf';
    const fileName = `upload_${Date.now()}.${fileExtension}`;

    // Determine MIME type
    let mimeType;
    if (isPdf) {
      mimeType = 'application/pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    } else {
      mimeType = 'application/octet-stream';
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    });

    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Use appropriate endpoint based on resource type
    const endpoint = isPdf || resourceType === 'raw' ? 'raw' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (response.ok && data.secure_url) {
      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
        fileType: isPdf ? 'pdf' : 'image',
      };
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary document upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload document',
    };
  }
};

/**
 * Delete an image from Cloudinary
 * Note: This requires server-side implementation as deletion requires API secret
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImageFromCloudinary = async (publicId) => {
  // This should be implemented on your backend server
  // as it requires the Cloudinary API secret which should never be exposed in client code
  console.warn('Delete operation should be handled by backend server');
  return {
    success: false,
    error: 'Delete operation requires backend implementation',
  };
};

/**
 * Get optimized image URL with transformations
 * @param {string} imageUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  const {
    width = 400,
    height = 400,
    quality = 'auto',
    format = 'auto',
  } = options;

  if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }

  // Insert transformations into Cloudinary URL
  const transformation = `w_${width},h_${height},c_fill,q_${quality},f_${format}`;
  const optimizedUrl = imageUrl.replace('/upload/', `/upload/${transformation}/`);

  return optimizedUrl;
};
