import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ConversationScript } from '../types/database';
import './ConversationScriptsPage.css';

export default function ConversationScriptsPage() {
  const [scripts, setScripts] = useState<ConversationScript[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<ConversationScript[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState<ConversationScript | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    loadScripts();
  }, []);

  useEffect(() => {
    filterScripts();
  }, [searchQuery, selectedTag, scripts]);

  const loadScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const scriptsData = data || [];
      setScripts(scriptsData);

      const tags = new Set<string>();
      scriptsData.forEach(script => {
        script.tags.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterScripts = () => {
    let filtered = [...scripts];

    if (selectedTag !== 'all') {
      filtered = filtered.filter(script => script.tags.includes(selectedTag));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(script =>
        script.title.toLowerCase().includes(query) ||
        script.scenario.toLowerCase().includes(query) ||
        script.script_content.toLowerCase().includes(query)
      );
    }

    setFilteredScripts(filtered);
  };

  if (loading) {
    return <div className="loading">טוען תסריטי שיחה...</div>;
  }

  return (
    <div className="scripts-page">
      <div className="page-header">
        <h1>תסריטי שיחה</h1>
        <p>דוגמאות שיחה עם לקוחות למצבים שונים</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="חיפוש תסריט..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="tag-filters">
          <button
            className={`tag-btn ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
          >
            הכל
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="results-header">
        <p>נמצאו {filteredScripts.length} תסריטים</p>
      </div>

      <div className="scripts-grid">
        {filteredScripts.map(script => (
          <div key={script.id} className="script-card card" onClick={() => setSelectedScript(script)}>
            <h3>{script.title}</h3>
            <p className="script-scenario">{script.scenario}</p>
            <div className="script-tags">
              {script.tags.map((tag, i) => (
                <span key={i} className="tag badge badge-info">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredScripts.length === 0 && (
        <div className="no-results">
          <p>לא נמצאו תסריטי שיחה</p>
        </div>
      )}

      {selectedScript && (
        <div className="modal-overlay" onClick={() => setSelectedScript(null)}>
          <div className="modal-content script-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedScript(null)}>×</button>
            <h2>{selectedScript.title}</h2>
            <div className="scenario-box">
              <strong>תרחיש:</strong> {selectedScript.scenario}
            </div>
            <div className="script-content">
              {selectedScript.script_content.split('\n').map((line, i) => {
                const isRole = line.startsWith('נציג:') || line.startsWith('לקוח:');
                return (
                  <p key={i} className={isRole ? 'script-line role-line' : 'script-line'}>
                    {line}
                  </p>
                );
              })}
            </div>
            <div className="script-tags">
              {selectedScript.tags.map((tag, i) => (
                <span key={i} className="tag badge badge-info">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
