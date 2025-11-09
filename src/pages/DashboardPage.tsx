import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './DashboardPage.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    articles: 0,
    procedures: 0,
    scripts: 0,
    simulations: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [articles, procedures, scripts, simulations] = await Promise.all([
      supabase.from('knowledge_articles').select('id', { count: 'exact', head: true }),
      supabase.from('procedures').select('id', { count: 'exact', head: true }),
      supabase.from('conversation_scripts').select('id', { count: 'exact', head: true }),
      supabase.from('simulations').select('id', { count: 'exact', head: true })
    ]);

    setStats({
      articles: articles.count || 0,
      procedures: procedures.count || 0,
      scripts: scripts.count || 0,
      simulations: simulations.count || 0
    });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [articles, procedures, scripts] = await Promise.all([
        supabase
          .from('knowledge_articles')
          .select('id, title, content, category')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('procedures')
          .select('id, title, description')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('conversation_scripts')
          .select('id, title, scenario')
          .or(`title.ilike.%${query}%,scenario.ilike.%${query}%`)
          .limit(5)
      ]);

      const results = [
        ...(articles.data || []).map(item => ({ ...item, type: 'article', path: '/knowledge' })),
        ...(procedures.data || []).map(item => ({ ...item, type: 'procedure', path: '/procedures' })),
        ...(scripts.data || []).map(item => ({ ...item, type: 'script', path: '/scripts' }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return '📚 מאמר';
      case 'procedure': return '📋 נוהל';
      case 'script': return '💬 תסריט';
      default: return '';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>מערכת מנהלת הידע</h1>
        <p>חפש וגלה מידע בכל המערכת</p>
      </div>

      <div className="search-section">
        <div className="search-box-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="חפש מאמרים, נהלים, תסריטי שיחה..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {isSearching && <div className="search-spinner">🔍</div>}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <Link
                key={`${result.type}-${result.id}-${index}`}
                to={result.path}
                className="search-result-item card"
                onClick={() => setSearchResults([])}
              >
                <div className="result-type">{getTypeLabel(result.type)}</div>
                <h4>{result.title}</h4>
                <p>{result.description || result.scenario || result.content?.substring(0, 100)}</p>
              </Link>
            ))}
          </div>
        )}

        {searchQuery && !isSearching && searchResults.length === 0 && (
          <div className="no-results">לא נמצאו תוצאות עבור "{searchQuery}"</div>
        )}
      </div>

      <div className="stats-grid">
        <Link to="/knowledge" className="stat-card">
          <div className="stat-icon">📚</div>
          <h3>מאגר ידע</h3>
          <div className="stat-number">{stats.articles}</div>
          <p>מאמרים במערכת</p>
        </Link>

        <Link to="/procedures" className="stat-card">
          <div className="stat-icon">📋</div>
          <h3>נהלים</h3>
          <div className="stat-number">{stats.procedures}</div>
          <p>נהלים פעילים</p>
        </Link>

        <Link to="/scripts" className="stat-card">
          <div className="stat-icon">💬</div>
          <h3>תסריטי שיחה</h3>
          <div className="stat-number">{stats.scripts}</div>
          <p>תסריטים זמינים</p>
        </Link>

        <Link to="/simulations" className="stat-card">
          <div className="stat-icon">🎯</div>
          <h3>סימולציות</h3>
          <div className="stat-number">{stats.simulations}</div>
          <p>מבחני הדרכה</p>
        </Link>
      </div>

      <div className="quick-access">
        <h2>גישה מהירה</h2>
        <div className="quick-links">
          <div className="quick-link-card card">
            <h3>מוצרי כתר</h3>
            <p>מידע מפורט על מגוון מוצרי כתר</p>
            <Link to="/knowledge?category=products" className="btn btn-primary">
              צפייה במוצרים
            </Link>
          </div>
          <div className="quick-link-card card">
            <h3>שאלות נפוצות</h3>
            <p>תשובות לשאלות הנפוצות ביותר</p>
            <Link to="/knowledge?category=faq" className="btn btn-primary">
              צפייה בשאלות
            </Link>
          </div>
          <div className="quick-link-card card">
            <h3>הדרכה והסמכה</h3>
            <p>עבור למבחני ההסמכה והדרכה</p>
            <Link to="/simulations" className="btn btn-primary">
              התחל הדרכה
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
