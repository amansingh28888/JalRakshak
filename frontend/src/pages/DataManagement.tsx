import { useState, useRef } from 'react';
import { importCsv, importSyntheticData, getHealth } from '../api';
import { Database, UploadCloud, TestTube2, BarChart3, RefreshCw, CheckCircle2, AlertTriangle, FileUp, XCircle, Info } from 'lucide-react';

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
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={28} color="var(--color-primary)" />
          Dataset Management
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Upload CSV datasets, preview import results, and manage the water quality database.
        </p>
      </div>

      {/* DB Status */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: 12, background: 'var(--color-primary-very-light)', borderRadius: 8, color: 'var(--color-primary)' }}>
          <Database size={24} />
        </div>
        <div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '1.1rem' }}>
            {dbInfo ? `${dbInfo.database_samples.toLocaleString()} samples in database` : 'Loading...'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>SQLite — water_quality.db</div>
        </div>
        <button className="btn-secondary" onClick={loadDbInfo} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* CSV Upload */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UploadCloud size={20} color="var(--color-primary)" />
            Upload CSV Dataset
          </h3>

          <div
            style={{
              border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 12,
              padding: '40px 24px',
              textAlign: 'center',
              background: dragOver ? 'var(--color-primary-very-light)' : 'var(--color-bg-soft)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: 20,
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
            <FileUp size={48} color={dragOver ? 'var(--color-primary)' : '#94A3B8'} style={{ margin: '0 auto 12px' }} />
            <div style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 500 }}>
              Drop CSV here or click to select
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: 8 }}>
              Expected format: India_Water_Quality_Dataset.csv
            </div>
            <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {selectedFile && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#E6F6EF', border: '1px solid rgba(22,138,91,0.2)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--color-safe)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} /> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.2)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleImport} disabled={!selectedFile || importing}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem' }}>
            {importing ? (
              <><RefreshCw size={18} className="animate-spin" /> Importing...</>
            ) : (
              <><FileUp size={18} /> Import CSV</>
            )}
          </button>

          <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            Existing data will NOT be replaced. Import appends to database.
          </div>
        </div>

        {/* Synthetic Demo Data */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TestTube2 size={20} color="var(--color-primary)" />
            Synthetic Demo Data
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>
            Load 5,000 synthetic water quality samples with realistic geographic distribution across India.
            Approximate target distribution: 37.4% safe, 21.8% biological, 19.4% chemical, 16.6% physical, 4.8% mixed.
          </p>
          <div style={{ padding: '16px', background: '#FDF3E1', border: '1px solid rgba(201,130,0,0.2)', borderRadius: 8, marginBottom: 24, fontSize: '0.85rem', color: '#9C6500', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            Synthetic data will REPLACE the existing database. Used for demonstrations only.
            Clearly labeled as synthetic throughout the application.
          </div>
          <button className="btn-secondary" onClick={handleSynthetic} disabled={importing}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.95rem' }}>
            {importing ? (
              <><RefreshCw size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><TestTube2 size={18} /> Load 5,000 Synthetic Samples</>
            )}
          </button>
        </div>
      </div>

      {/* Import Report */}
      {report && (
        <div className="card" style={{ padding: 32, marginTop: 24 }}>
          <h3 style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={20} color="var(--color-primary)" />
            Import Report — Batch {report.batch_id}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Received', val: report.rows_received, color: 'var(--color-text-secondary)' },
              { label: 'Accepted', val: report.rows_accepted, color: 'var(--color-safe)' },
              { label: 'Rejected', val: report.rows_rejected, color: 'var(--color-danger)' },
              { label: 'Duplicates', val: report.rows_duplicate, color: '#F59E0B' },
              { label: 'Transformed', val: report.rows_transformed, color: 'var(--color-primary)' },
              { label: 'Safe', val: report.safe_rows, color: 'var(--color-safe)' },
              { label: 'Biological', val: report.biological_alerts, color: 'var(--color-warning)' },
              { label: 'Chemical', val: report.chemical_alerts, color: 'var(--color-danger)' },
              { label: 'Mixed', val: report.mixed_hazards, color: '#B91C1C' },
              { label: 'Physical', val: report.physical_concerns, color: '#F59E0B' },
              { label: 'DO NOT BOIL', val: report.do_not_boil_rows, color: 'var(--color-danger)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>
                  {item.val.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 6, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {report.rejection_reasons_sample.length > 0 && (
            <div style={{ background: '#FCE8E8', border: '1px solid rgba(214,69,69,0.2)', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={14} /> REJECTION REASONS (SAMPLE)
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--color-danger)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {report.rejection_reasons_sample.slice(0, 5).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
