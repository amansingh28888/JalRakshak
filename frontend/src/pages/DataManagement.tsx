import { useState, useRef } from 'react';
import { importCsv, importSyntheticData, getHealth } from '../api';

interface ImportReport {
  batch_id: string;
  rows_received: number;
  rows_accepted: number;
  rows_rejected: number;
  rows_duplicate: number;
  rows_missing_critical: number;
  rows_transformed: number;
  chemical_alerts: number;
  biological_alerts: number;
  mixed_hazards: number;
  physical_concerns: number;
  safe_rows: number;
  do_not_boil_rows: number;
  rejection_reasons_sample: string[];
  warnings: string[];
}

export default function DataManagement() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<{ database_samples: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDbInfo = () => {
    getHealth().then(h => setDbInfo({ database_samples: h.database_samples }));
  };
  useState(() => { loadDbInfo(); });

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      return;
    }
    setSelectedFile(file);
    setError(null);
    setReport(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    try {
      const result = await importCsv(selectedFile, false);
      setReport(result.report);
      loadDbInfo();
    } catch (e: unknown) {
      setError(e instanceof Error ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail || e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleSynthetic = async () => {
    setImporting(true);
    setError(null);
    setReport(null);
    try {
      const result = await importSyntheticData(5000);
      setReport(result.report);
      loadDbInfo();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Synthetic import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', marginBottom: 6 }}>
          📁 Dataset Management
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          Upload CSV datasets, preview import results, and manage the water quality database.
        </p>
      </div>

      {/* DB Status */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: '1.5rem' }}>🗃️</span>
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
            {dbInfo ? `${dbInfo.database_samples.toLocaleString()} samples in database` : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>SQLite — water_quality.db</div>
        </div>
        <button className="btn-secondary" onClick={loadDbInfo} style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* CSV Upload */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>📤 Upload CSV Dataset</h3>

          <div
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(59,130,246,0.3)'}`,
              borderRadius: 12,
              padding: '40px 24px',
              textAlign: 'center',
              background: dragOver ? 'rgba(59,130,246,0.05)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 16,
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📄</div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Drop CSV here or click to select
            </div>
            <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: 4 }}>
              India_Water_Quality_Dataset_50000.csv
            </div>
            <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {selectedFile && (
            <div style={{ marginBottom: 12, padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontSize: '0.85rem', color: '#34d399' }}>
              ✅ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 12, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, fontSize: '0.85rem', color: '#f87171' }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleImport} disabled={!selectedFile || importing}
            style={{ width: '100%', justifyContent: 'center' }}>
            {importing ? '⏳ Importing...' : '📥 Import CSV'}
          </button>

          <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#475569' }}>
            ⚠️ Existing data will NOT be replaced. Import appends to database.
          </div>
        </div>

        {/* Synthetic Demo Data */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>🔬 Synthetic Demo Data</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
            Load 5,000 synthetic water quality samples with realistic geographic distribution across India.
            Approximate target distribution: 37.4% safe, 21.8% biological, 19.4% chemical, 16.6% physical, 4.8% mixed.
          </p>
          <div style={{ padding: 12, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, marginBottom: 16, fontSize: '0.8rem', color: '#fbbf24' }}>
            ⚠️ Synthetic data will REPLACE existing database. Used for demonstrations only.
            Clearly labeled as synthetic throughout the application.
          </div>
          <button className="btn-secondary" onClick={handleSynthetic} disabled={importing}
            style={{ width: '100%', justifyContent: 'center' }}>
            {importing ? '⏳ Generating...' : '🔬 Load 5,000 Synthetic Samples'}
          </button>
        </div>
      </div>

      {/* Import Report */}
      {report && (
        <div className="glass-card" style={{ padding: 24, marginTop: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
            📊 Import Report — Batch {report.batch_id}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Received', val: report.rows_received, color: '#94a3b8' },
              { label: 'Accepted', val: report.rows_accepted, color: '#10b981' },
              { label: 'Rejected', val: report.rows_rejected, color: '#ef4444' },
              { label: 'Duplicates', val: report.rows_duplicate, color: '#eab308' },
              { label: 'Transformed', val: report.rows_transformed, color: '#60a5fa' },
              { label: '✅ Safe', val: report.safe_rows, color: '#10b981' },
              { label: '🦠 Biological', val: report.biological_alerts, color: '#f97316' },
              { label: '⚗️ Chemical', val: report.chemical_alerts, color: '#ef4444' },
              { label: '☣️ Mixed', val: report.mixed_hazards, color: '#dc2626' },
              { label: '🌊 Physical', val: report.physical_concerns, color: '#eab308' },
              { label: '🚫 DO NOT BOIL', val: report.do_not_boil_rows, color: '#f87171' },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color, fontFamily: 'Outfit' }}>
                  {item.val.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {report.rejection_reasons_sample.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>REJECTION REASONS (sample):</div>
              {report.rejection_reasons_sample.slice(0, 5).map((r, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: '#f87171', marginBottom: 4 }}>• {r}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
