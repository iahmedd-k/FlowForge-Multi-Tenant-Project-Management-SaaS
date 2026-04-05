const crypto = require('crypto');

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials are missing on the server');
  }

  return { cloudName, apiKey, apiSecret };
}

function createSignature(params, apiSecret) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
}

async function uploadBase64File({ dataUrl, fileName, folder = 'flowforge/tasks' }) {
  const { cloudName, apiKey, apiSecret } = ensureCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createSignature({ folder, timestamp }, apiSecret);
  const form = new FormData();

  form.append('file', dataUrl);
  form.append('folder', folder);
  form.append('timestamp', String(timestamp));
  form.append('api_key', apiKey);
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed');
  }

  return {
    url: payload.secure_url,
    filename: fileName || payload.original_filename || 'attachment',
    uploadedAt: new Date(),
    bytes: payload.bytes,
    publicId: payload.public_id,
    resourceType: payload.resource_type,
  };
}

module.exports = {
  uploadBase64File,
};
