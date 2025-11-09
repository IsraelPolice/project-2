import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { KnowledgeArticle } from '../types/database';
import './KnowledgeBasePage.css';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<KnowledgeArticle>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [
    { value: 'all', label: 'הכל' },
    { value: 'products', label: 'מוצרים' },
    { value: 'faq', label: 'שאלות נפוצות' },
    { value: 'support', label: 'תמיכה' },
    { value: 'procedures', label: 'נהלים' },
    { value: 'general', label: 'כללי' }
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleAddArticle = () => {
    setEditForm({
      title: '',
      content: '',
      category: 'general',
      keywords: [],
      status: 'published'
    });
    setShowAddModal(true);
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setEditForm(article);
    setIsEditing(true);
    setSelectedArticle(null);
  };

  const handleSaveArticle = async () => {
    if (!editForm.title || !editForm.content) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setSaving(true);
    try {
      if (editForm.id) {
        const { error } = await supabase
          .from('knowledge_articles')
          .update({
            title: editForm.title,
            content: editForm.content,
            category: editForm.category,
            keywords: editForm.keywords,
            status: editForm.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editForm.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_articles')
          .insert({
            title: editForm.title!,
            content: editForm.content!,
            category: editForm.category!,
            keywords: editForm.keywords || [],
            status: editForm.status || 'published'
          });

        if (error) throw error;
      }

      await loadArticles();
      setIsEditing(false);
      setShowAddModal(false);
      setEditForm({});
    } catch (error) {
      console.error('Error saving article:', error);
      alert('שגיאה בשמירת המאמר');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מאמר זה?')) return;

    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadArticles();
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('שגיאה במחיקת המאמר');
    }
  };

  if (loading) {
    return <div className="loading">טוען מאגר ידע...</div>;
  }

  return (
    <div className="knowledge-base">
      <div className="page-header">
        <h1>מאגר ידע כתר</h1>
        <p>כל המידע שאתה צריך במקום אחד</p>
        <button className="btn btn-primary" onClick={handleAddArticle}>
          + הוסף מאמר חדש
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש במאגר הידע..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="results-header">
        <p>נמצאו {filteredArticles.length} תוצאות</p>
      </div>

      <div className="articles-grid">
        {filteredArticles.map(article => (
          <div key={article.id} className="article-card card" onClick={() => setSelectedArticle(article)}>
            <div className="article-category badge badge-info">{categories.find(c => c.value === article.category)?.label}</div>
            <h3>{article.title}</h3>
            <p className="article-preview">{article.content.substring(0, 150)}...</p>
            <div className="article-keywords">
              {article.keywords.slice(0, 3).map((keyword, i) => (
                <span key={i} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="no-results">
          <p>לא נמצאו תוצאות לחיפוש שלך</p>
        </div>
      )}

      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedArticle(null)}>×</button>
            <div className="article-category badge badge-info">
              {categories.find(c => c.value === selectedArticle.category)?.label}
            </div>
            <h2>{selectedArticle.title}</h2>
            <div className="article-content">
              {selectedArticle.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="article-keywords">
              {selectedArticle.keywords.map((keyword, i) => (
                <span key={i} className="keyword-tag">{keyword}</span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => handleEditArticle(selectedArticle)}>
                ערוך מאמר
              </button>
              <button className="btn btn-secondary" onClick={() => handleDeleteArticle(selectedArticle.id)}>
                מחק מאמר
              </button>
            </div>
          </div>
        </div>
      )}

      {(isEditing || showAddModal) && (
        <div className="modal-overlay" onClick={() => { setIsEditing(false); setShowAddModal(false); }}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setIsEditing(false); setShowAddModal(false); }}>×</button>
            <h2>{isEditing ? 'ערוך מאמר' : 'מאמר חדש'}</h2>
            <div className="form-group">
              <label>כותרת</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="הכנס כותרת למאמר"
              />
            </div>
            <div className="form-group">
              <label>קטגוריה</label>
              <select
                value={editForm.category || 'general'}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
              >
                {categories.filter(c => c.value !== 'all').map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>תוכן</label>
              <textarea
                value={editForm.content || ''}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="הכנס את תוכן המאמר"
                rows={10}
              />
            </div>
            <div className="form-group">
              <label>מילות מפתח (מופרדות בפסיק)</label>
              <input
                type="text"
                value={editForm.keywords?.join(', ') || ''}
                onChange={(e) => setEditForm({
                  ...editForm,
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                placeholder="מילת מפתח 1, מילת מפתח 2, מילת מפתח 3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSaveArticle} disabled={saving}>
                {saving ? 'שומר...' : 'שמור מאמר'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setShowAddModal(false); }}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
