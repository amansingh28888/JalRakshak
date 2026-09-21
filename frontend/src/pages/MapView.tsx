import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapMarkers } from '../api';
import type { MapMarker } from '../types';
import { getMapColor, getCategoryConfig } from '../utils/display';

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
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          🗺️ Interactive Water Quality Map
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Color-coded risk markers across India. Click a marker for sample details.
          {' '}<span style={{ color: '#475569', fontSize: '0.8rem' }}>
            Note: Markers without GPS coordinates use approximate district/state locations.
          </span>
        </p>
      </div>

      {/* Legend & Filters */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#10b981', label: 'Safe' },
            { color: '#eab308', label: 'Physical' },
            { color: '#f97316', label: 'Biological' },
            { color: '#ef4444', label: 'Chemical / Mixed' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
          <select className="form-input" style={{ width: 180 }} value={filter.category}
            onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            <option value="POTABLE_SAFE">✅ Safe</option>
            <option value="UNSAFE_BIOLOGICAL_PATHOGEN">🦠 Biological</option>
            <option value="CRITICAL_CHEMICAL_TOXIN">⚗️ Chemical</option>
            <option value="MODERATE_PHYSICAL_PARAM">🌊 Physical</option>
            <option value="CRITICAL_MIXED_HAZARD">☣️ Mixed</option>
          </select>
          <select className="form-input" style={{ width: 160 }} value={filter.do_not_boil}
            onChange={e => setFilter(f => ({ ...f, do_not_boil: e.target.value }))}>
            <option value="">All Actions</option>
            <option value="true">🚫 DO NOT BOIL</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Loading map data...</div>}

      {/* Map */}
      <div style={{ borderRadius: 12, overflow: 'hidden', height: 580, border: '1px solid rgba(59,130,246,0.15)' }}>
        <MapContainer
          center={[22.5, 78.9]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map(m => (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lon]}
              radius={m.do_not_boil ? 8 : 5}
              pathOptions={{
                color: getMapColor(m.category, m.do_not_boil),
                fillColor: getMapColor(m.category, m.do_not_boil),
                fillOpacity: 0.7,
                weight: m.do_not_boil ? 2 : 1,
              }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>
                    {getCategoryConfig(m.category).icon} {m.district}, {m.state_ut}
                  </div>
                  {m.village && <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>🏘️ {m.village}</div>}
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ color: getCategoryConfig(m.category).color }}>
                      {getCategoryConfig(m.category).label}
                    </span>
                  </div>
                  {m.primary_contaminant && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Contaminant: {m.primary_contaminant}
                    </div>
                  )}
                  {m.do_not_boil && (
                    <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '4px 8px', marginTop: 6, fontSize: '0.8rem', fontWeight: 700, color: '#f87171', textAlign: 'center' }}>
                      🚫 DO NOT BOIL
                    </div>
                  )}
                  {m.approximate && (
                    <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: 6 }}>
                      ℹ️ Approximate administrative location
                    </div>
                  )}
                  <a href={`/sample/${m.id}`} style={{ display: 'block', marginTop: 8, color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none' }}>
                    View Details →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#475569', textAlign: 'right' }}>
        {markers.length.toLocaleString()} markers displayed
      </div>
    </div>
  );
}
