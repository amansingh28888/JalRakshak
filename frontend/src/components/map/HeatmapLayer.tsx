import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  options?: any;
}

export default function HeatmapLayer({ points, options }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Type assertion to any since leaflet.heat extends L but types might not be perfectly aligned
    const heatLayer = (L as any).heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      ...options,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
}
