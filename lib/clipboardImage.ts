import { Platform } from 'react-native';

export type ClipboardImageResult = {
  uri: string;
  mimeType: string;
};

export function isLocalImageUri(uri: string): boolean {
  return (
    uri.startsWith('blob:') ||
    uri.startsWith('file:') ||
    uri.startsWith('data:') ||
    (!uri.startsWith('http://') && !uri.startsWith('https://'))
  );
}

export async function readClipboardImage(): Promise<ClipboardImageResult | null> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.clipboard?.read) {
    return null;
  }

  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith('image/'));
      if (!imageType) {
        continue;
      }

      const blob = await item.getType(imageType);
      return {
        uri: URL.createObjectURL(blob),
        mimeType: imageType,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function revokeLocalImageUri(uri?: string | null) {
  if (uri?.startsWith('blob:') && typeof URL !== 'undefined') {
    URL.revokeObjectURL(uri);
  }
}
