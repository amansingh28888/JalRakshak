import { useState, useEffect } from 'react';
import { getStates, getDistricts } from '../../api';
import { FileDown, FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';

export default function Reports() {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  const [filter, setFilter] = useState({
    state_ut: '',
    district: '',
    village: '',
    start_date: '',
    end_date: ''
  });

  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (filter.state_ut) {
      getDistricts(filter.state_ut).then(setDistricts);
    } else {
      setDistricts([]);
      setFilter(f => ({ ...f, district: '' }));
    }
  }, [filter.state_ut]);

  const handleDownload = (format: 'csv' | 'excel' | 'pdf') => {
    setDownloading(format);
    
    // Construct query params
    const params = new URLSearchParams();
    if (filter.state_ut) params.append('state_ut', filter.state_ut);
    if (filter.district) params.append('district', filter.district);
    if (filter.village) params.append('village', filter.village);
    if (filter.start_date) params.append('start_date', filter.start_date);
    if (filter.end_date) params.append('end_date', filter.end_date);
    
    const url = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/reports/export/${format}?${params.toString()}`;
    
    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset loading state after a brief delay
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileDown size={28} color="var(--color-primary)" />
          Report Generator
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Generate and download custom water quality data reports.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 24, flex: 2 }}>
          <h3 style={{ marginBottom: 20 }}>Report Filters</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>State / UT</label>
              <select className="form-input" value={filter.state_ut} onChange={e => setFilter(f => ({ ...f, state_ut: e.target.value }))}>
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>District</label>
              <select className="form-input" value={filter.district} onChange={e => setFilter(f => ({ ...f, district: e.target.value }))} disabled={!filter.state_ut}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Village (Optional)</label>
              <input type="text" className="form-input" placeholder="Enter village name..." value={filter.village} onChange={e => setFilter(f => ({ ...f, village: e.target.value }))} />
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>Start Date</label>
                <input type="date" className="form-input" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>End Date</label>
                <input type="date" className="form-input" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--color-border)', ':hover': { borderColor: 'var(--color-primary)', transform: 'translateY(-2px)' } } as React.CSSProperties} onClick={() => handleDownload('pdf')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {downloading === 'pdf' ? <Loader2 className="animate-spin" /> : <FileText size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>PDF Report</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Print-ready executive summary</p>
              </div>
              <Download color="var(--color-primary)" />
            </div>
          </div>

          <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--color-border)' } as React.CSSProperties} onClick={() => handleDownload('excel')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {downloading === 'excel' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>Excel Spreadsheet</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Detailed data (.xlsx)</p>
              </div>
              <Download color="var(--color-primary)" />
            </div>
          </div>

          <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--color-border)' } as React.CSSProperties} onClick={() => handleDownload('csv')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#F8FAFC', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {downloading === 'csv' ? <Loader2 className="animate-spin" /> : <FileText size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>Raw CSV</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Machine-readable format</p>
              </div>
              <Download color="var(--color-primary)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
