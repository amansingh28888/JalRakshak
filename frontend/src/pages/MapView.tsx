import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapMarkers } from '../api';
import type { MapMarker } from '../types';
import { getMapColor, getCategoryConfig } from '../utils/display';
import { Map as MapIcon, MapPin, Ban, Info, Loader2 } from 'lucide-react';

export default function MapView() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', do_not_boil: '' });

  const fetchMarkers = () => {
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (filter.category) params.category = filter.category;
    if (filter.do_not_boil === 'true') params.do_not_boil = true;
    getMapMarkers(params)
      .then(d => setMarkers(d.markers))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMarkers(); }, [filter]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapIcon size={28} color="var(--color-primary)" />
          Interactive Water Quality Map
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Color-coded risk markers across India. Click a marker for sample details.
          {' '}<span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', opacity: 0.8 }}>
            (Markers without GPS coordinates use approximate administrative locations.)
          </span>
        </p>
      </div>

      {/* Legend & Filters */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { color: 'var(--color-safe)', label: 'Safe' },
            { color: '#F59E0B', label: 'Physical' },
            { color: 'var(--color-warning)', label: 'Biological' },
            { color: 'var(--color-danger)', label: 'Chemical / Mixed' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-input" style={{ width: 180 }} value={filter.category}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            <option value="POTABLE_SAFE">Safe</option>
            <option value="UNSAFE_BIOLOGICAL_PATHOGEN">Biological</option>
            <option value="CRITICAL_CHEMICAL_TOXIN">Chemical</option>
            <option value="MODERATE_PHYSICAL_PARAM">Physical</option>
            <option value="CRITICAL_MIXED_HAZARD">Mixed</option>
          </select>
          <select className="form-input" style={{ width: 160 }} value={filter.do_not_boil}
            onChange={e => setFilter(f => ({ ...f, do_not_boil: e.target.value }))}>
            <option value="">All Actions</option>
            <option value="true">DO NOT BOIL</option>
          </select>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-secondary)', padding: 20 }}>
          <Loader2 size={16} className="animate-spin" />
          Loading map data...
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', height: 600, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(22, 50, 79, 0.05)' }}>
        <MapContainer
          center={[22.5, 78.9]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: 'var(--color-bg-soft)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map(m => {
            const cat = getCategoryConfig(m.category);
            return (
              <CircleMarker
                key={m.id}
                center={[m.lat, m.lon]}
                radius={m.do_not_boil ? 8 : 6}
                pathOptions={{
                  color: getMapColor(m.category, m.do_not_boil),
                  fillColor: getMapColor(m.category, m.do_not_boil),
                  fillOpacity: 0.85,
                  weight: m.do_not_boil ? 2 : 1,
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="var(--color-primary)" />
                      {m.district}, {m.state_ut}
                    </div>
                    {m.village && <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: 6 }}>{m.village}</div>}
                    <div style={{ fontSize: '0.8rem', marginBottom: 6 }}>
                      <span style={{ color: cat.color, fontWeight: 600 }}>
                        {cat.label}
                      </span>
                    </div>
                    {m.primary_contaminant && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Contaminant: {m.primary_contaminant}
                      </div>
                    )}
                    {m.do_not_boil && (
                      <div style={{ background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.3)', borderRadius: 6, padding: '4px 8px', marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Ban size={12} strokeWidth={2.5} /> DO NOT BOIL
                      </div>
                    )}
                    {m.approximate && (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Info size={12} /> Approximate location
                      </div>
                    )}
                    <a href={`/citizen/sample/${m.id}`} style={{ display: 'block', marginTop: 12, color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
                      View Details &rarr;
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'right', fontWeight: 500 }}>
        {markers.length.toLocaleString()} markers displayed
      </div>
    </div>
  );
}
