import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { System } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import './SystemsPage.css';

export default function SystemsPage() {
  const { userProfile } = useAuth();
  const [systems, setSystems] = useState<System[]>([]);
  const [filteredSystems, setFilteredSystems] = useState<System[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<System>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const canEdit = userProfile?.role === 'admin' || userProfile?.role === 'editor';

  useEffect(() => {
    loadSystems();
  }, []);

  useEffect(() => {
    filterSystems();
  }, [searchQuery, systems]);

  const loadSystems = async () => {
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSystems(data || []);
    } catch (error) {
      console.error('Error loading systems:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSystems = () => {
    let filtered = [...systems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(system =>
        system.name.toLowerCase().includes(query) ||
        system.description.toLowerCase().includes(query) ||
        system.instructions.toLowerCase().includes(query) ||
        system.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredSystems(filtered);
  };

  const handleAddSystem = () => {
    setEditForm({
      name: '',
      description: '',
      url: '',
      category: 'general',
      instructions: '',
      keywords: []
    });
    setShowAddModal(true);
  };

  const handleEditSystem = (system: System) => {
    setEditForm(system);
    setIsEditing(true);
    setSelectedSystem(null);
  };

  const handleSaveSystem = async () => {
    if (!editForm.name || !editForm.description) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (editForm.id) {
        const { error } = await supabase
          .from('systems')
          .update({
            name: editForm.name,
            description: editForm.description,
            url: editForm.url || '',
            category: editForm.category || 'general',
            instructions: editForm.instructions || '',
            keywords: editForm.keywords || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', editForm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('systems')
          .insert({
            name: editForm.name,
            description: editForm.description,
            url: editForm.url || '',
            category: editForm.category || 'general',
            instructions: editForm.instructions || '',
            keywords: editForm.keywords || [],
            created_by: user.id
          });

        if (error) throw error;
      }

      await loadSystems();
      setShowAddModal(false);
      setIsEditing(false);
      setEditForm({});
      alert(editForm.id ? 'המערכת עודכנה בהצלחה' : 'המערכת נוספה בהצלחה');
    } catch (error) {
      console.error('Error saving system:', error);
      alert('שגיאה בשמירת המערכת');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSystem = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מערכת זו?')) return;

    try {
      const { error } = await supabase
        .from('systems')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadSystems();
      setSelectedSystem(null);
      alert('המערכת נמחקה בהצלחה');
    } catch (error) {
      console.error('Error deleting system:', error);
      alert('שגיאה במחיקת המערכת');
    }
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    setEditForm({ ...editForm, keywords });
  };

  if (loading) {
    return <div className="loading">טוען...</div>;
  }

  return (
    <div className="systems-page">
      <div className="page-header">
        <h1>מערכות</h1>
        {canEdit && (
          <button className="btn-primary" onClick={handleAddSystem}>
            + הוסף מערכת
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="חיפוש מערכות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="systems-grid">
        {filteredSystems.map((system) => (
          <div
            key={system.id}
            className="system-card"
            onClick={() => setSelectedSystem(system)}
          >
            <h3>{system.name}</h3>
            <p className="system-description">{system.description}</p>
            {system.url && (
              <a
                href={system.url}
                target="_blank"
                rel="noopener noreferrer"
                className="system-link"
                onClick={(e) => e.stopPropagation()}
              >
                פתח מערכת
              </a>
            )}
            <div className="system-keywords">
              {system.keywords.slice(0, 3).map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSystems.length === 0 && (
        <div className="no-results">
          <p>לא נמצאו מערכות</p>
        </div>
      )}

      {selectedSystem && !isEditing && (
        <div className="modal-overlay" onClick={() => setSelectedSystem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSystem.name}</h2>
              <button className="close-btn" onClick={() => setSelectedSystem(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="system-detail-section">
                <h3>תיאור</h3>
                <p>{selectedSystem.description}</p>
              </div>

              {selectedSystem.url && (
                <div className="system-detail-section">
                  <h3>קישור</h3>
                  <a
                    href={selectedSystem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="system-url"
                  >
                    {selectedSystem.url}
                  </a>
                </div>
              )}

              {selectedSystem.instructions && (
                <div className="system-detail-section">
                  <h3>הוראות שימוש</h3>
                  <div className="system-instructions">
                    {selectedSystem.instructions}
                  </div>
                </div>
              )}

              {selectedSystem.keywords.length > 0 && (
                <div className="system-detail-section">
                  <h3>מילות מפתח</h3>
                  <div className="keywords-list">
                    {selectedSystem.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {canEdit && (
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => handleEditSystem(selectedSystem)}
                >
                  ערוך
                </button>
                {userProfile?.role === 'admin' && (
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteSystem(selectedSystem.id)}
                  >
                    מחק
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(showAddModal || isEditing) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setIsEditing(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editForm.id ? 'ערוך מערכת' : 'הוסף מערכת חדשה'}</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setIsEditing(false); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>שם המערכת *</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="לדוגמה: SalesForce"
                />
              </div>

              <div className="form-group">
                <label>תיאור *</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="תיאור קצר של המערכת"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>קישור למערכת</label>
                <input
                  type="url"
                  value={editForm.url || ''}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>קטגוריה</label>
                <select
                  value={editForm.category || 'general'}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="general">כללי</option>
                  <option value="crm">CRM</option>
                  <option value="communication">תקשורת</option>
                  <option value="management">ניהול</option>
                  <option value="support">תמיכה</option>
                </select>
              </div>

              <div className="form-group">
                <label>הוראות שימוש</label>
                <textarea
                  value={editForm.instructions || ''}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  placeholder="הוראות שימוש במערכת"
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label>מילות מפתח</label>
                <input
                  type="text"
                  value={editForm.keywords?.join(', ') || ''}
                  onChange={(e) => handleKeywordsChange(e.target.value)}
                  placeholder="מילות מפתח מופרדות בפסיקים"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => { setShowAddModal(false); setIsEditing(false); }}
                disabled={saving}
              >
                ביטול
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSystem}
                disabled={saving}
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
