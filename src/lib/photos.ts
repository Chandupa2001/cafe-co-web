import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

/** Finds the uploaded photo for a slot, whatever its file extension. */
export function findPhoto(name: string): ImageMetadata | undefined {
  const key = Object.keys(files).find((path) => {
    const base = path.split('/').pop() ?? '';
    return base.replace(/\.[^.]+$/, '').toLowerCase() === name;
  });
  return key ? files[key].default : undefined;
}
