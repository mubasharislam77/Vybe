import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryConfig } from '@/lib/env';

export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

function configure() {
  const config = getCloudinaryConfig();
  if (!config) throw new Error('Cloudinary is not configured');
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return config;
}

/**
 * Signed upload params for a direct browser -> Cloudinary upload. The file
 * never passes through our server (no size limits to worry about there),
 * but the signature is generated server-side after an admin auth check, so
 * only authenticated admin/staff can obtain a valid signature, and the
 * upload is scoped to our folder + a short-lived timestamp.
 */
export function createSignedUploadParams(folder: string) {
  const config = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.CLOUDINARY_API_SECRET);

  return {
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
}

export async function deleteAsset(publicId: string): Promise<void> {
  configure();
  await cloudinary.uploader.destroy(publicId);
}
