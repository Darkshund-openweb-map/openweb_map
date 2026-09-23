'use client';

import { useEffect, useRef, useState } from 'react';
import { select, zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3';

export function useMapZoom() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.65, 2.8])
      .extent([
        [0, 0],
        [846, 614],
      ])
      .translateExtent([
        [-550, -450],
        [1396, 1064],
      ])
      .clickDistance(5)
      .on('zoom', (event) => setTransform(event.transform));
    svg.call(behavior);
    zoomRef.current = behavior;
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  const zoomBy = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, factor);
  };

  const resetView = () => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(240).call(zoomRef.current.transform, zoomIdentity);
  };

  return { svgRef, transform, zoomBy, resetView };
}
