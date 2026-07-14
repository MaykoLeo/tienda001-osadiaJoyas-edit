import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const type = searchParams.get('type'); // 'banner' o 'product' (default)

  if (!filename || !request.body) {
    return new NextResponse('Missing filename or request body', { status: 400 });
  }

  try {
    const imageBuffer = await request.arrayBuffer();

    let optimizedBuffer: Buffer;
    let blobFilename: string;

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    if (type === 'banner') {
      // Banner de categoría: ratio 2:1 (1200×600), crop centrado
      optimizedBuffer = await sharp(Buffer.from(imageBuffer))
        .resize({ width: 1200, height: 600, fit: 'cover', position: 'centre' })
        .webp({ quality: 85 })
        .toBuffer();
      blobFilename = `banners/${new Date().getTime()}-${sanitizedFilename}`;
    } else {
      // Imagen de producto: comportamiento original
      optimizedBuffer = await sharp(Buffer.from(imageBuffer))
        .resize({ width: 1200, height: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      blobFilename = `products/${new Date().getTime()}-${sanitizedFilename}`;
    }

    // Upload the optimized image to Vercel Blob
    const blob = await put(blobFilename, optimizedBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    // Return the public URL
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Error uploading image: ${errorMessage}`, { status: 500 });
  }
}
