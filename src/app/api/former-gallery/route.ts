import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { FORMER_GALLERY_PHOTOS, FormerPhoto } from '@/data/formerGallery';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const formerDir = path.join(process.cwd(), 'public', 'former-gallery');

    if (!fs.existsSync(formerDir)) {
      return NextResponse.json({ photos: FORMER_GALLERY_PHOTOS });
    }

    const files = fs.readdirSync(formerDir);
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

    // Read optional custom metadata.json if provided
    let customMeta: Record<string, Partial<FormerPhoto>> = {};
    const metaPath = path.join(formerDir, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      try {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        customMeta = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse metadata.json', e);
      }
    }

    // Filter only valid image files
    const imageFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return imageExtensions.has(ext) && !f.startsWith('.');
    });

    if (imageFiles.length === 0) {
      // If folder is currently empty of user image files, return default preset photos
      return NextResponse.json({ photos: FORMER_GALLERY_PHOTOS });
    }

    // Natural numerical sort: photo-1, photo-2, ..., photo-15, photo-16, photo-17...
    imageFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const categories: FormerPhoto['category'][] = [
      'Match Action',
      'Fellowship & Prayer',
      'Celebration & Trophy',
      'Batch Squads',
    ];

    const photos: FormerPhoto[] = imageFiles.map((filename, index) => {
      const idNum = parseInt(filename.replace(/\D/g, ''), 10) || (index + 1);

      // Check for preset metadata from FORMER_GALLERY_PHOTOS
      const preset = FORMER_GALLERY_PHOTOS.find((p) => p.id === idNum);
      const custom = customMeta[filename] || customMeta[String(idNum)] || {};

      if (preset) {
        return {
          ...preset,
          filename,
          ...custom,
        };
      }

      // Automatically handle photo-16, photo-17, photo-18, etc.
      return {
        id: idNum,
        filename,
        title: custom.title || `Focus Cup Historical Match Moment #${idNum}`,
        tournamentEdition: custom.tournamentEdition || 'Focus Cup Classic Edition',
        category: (custom.category as FormerPhoto['category']) || categories[(idNum - 1) % categories.length],
        caption: custom.caption || `Memorable Focus Cup fellowship match moment #${idNum} preserved in our tournament heritage gallery.`,
        dateOrSemester: custom.dateOrSemester || 'Previous Semester',
      };
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Failed to read former gallery directory', error);
    return NextResponse.json({ photos: FORMER_GALLERY_PHOTOS });
  }
}
