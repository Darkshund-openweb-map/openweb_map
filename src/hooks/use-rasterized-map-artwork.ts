'use client';

import { useEffect, useState } from 'react';

export function useRasterizedMapArtwork(svgDataUrl: string): string {
  const [raster, setRaster] = useState<{ source: string; url: string } | null>(null);

  useEffect(() => {
    const image = new Image();
    let cancelled = false;

    image.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0);
        setRaster({ source: svgDataUrl, url: canvas.toDataURL('image/png') });
      } catch {
        // Keep the SVG image if this browser cannot rasterize a data URL.
      }
    };
    image.src = svgDataUrl;

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [svgDataUrl]);

  return raster?.source === svgDataUrl ? raster.url : svgDataUrl;
}
