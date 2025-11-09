import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Procedure } from '../types/database';
import './ProceduresPage.css';

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  useEffect(() => {
    loadProcedures();
  }, []);

  useEffect(() => {
    filterProcedures();
  }, [searchQuery, procedures]);

  const loadProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcedures(data || []);
    } catch (error) {
      console.error('Error loading procedures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProcedures = () => {
    let filtered = [...procedures];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(proc =>
        proc.title.toLowerCase().includes(query) ||
        proc.description.toLowerCase().includes(query) ||
        proc.content.toLowerCase().includes(query)
      );
    }

    setFilteredProcedures(filtered);
  };

  if (loading) {
    return <div className="loading">טוען נהלים...</div>;
  }

  return (
    <div className="procedures-page">
      <div className="page-header">
        <h1>נהלי עבודה</h1>
        <p>נהלים ותהליכי עבודה במוקד השירות</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש נהל..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="results-header">
        <p>נמצאו {filteredProcedures.length} נהלים</p>
      </div>

      <div className="procedures-grid">
        {filteredProcedures.map(procedure => (
          <div key={procedure.id} className="procedure-card card" onClick={() => setSelectedProcedure(procedure)}>
            <div className="procedure-header">
              <h3>{procedure.title}</h3>
              <span className="version-badge badge badge-info">גרסה {procedure.version}</span>
            </div>
            <p className="procedure-description">{procedure.description}</p>
            <div className="procedure-footer">
              <span className="status-badge badge badge-success">פעיל</span>
              <span className="date-text">עודכן: {new Date(procedure.updated_at).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredProcedures.length === 0 && (
        <div className="no-results">
          <p>לא נמצאו נהלים</p>
        </div>
      )}

      {selectedProcedure && (
        <div className="modal-overlay" onClick={() => setSelectedProcedure(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProcedure(null)}>×</button>
            <div className="procedure-modal-header">
              <h2>{selectedProcedure.title}</h2>
              <span className="version-badge badge badge-info">גרסה {selectedProcedure.version}</span>
            </div>
            <p className="modal-description">{selectedProcedure.description}</p>
            <div className="procedure-content">
              {selectedProcedure.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="procedure-meta">
              <span>עודכן לאחרונה: {new Date(selectedProcedure.updated_at).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
