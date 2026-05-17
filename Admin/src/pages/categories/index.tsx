import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, RefreshCw, Loader2, AlertCircle, Tag } from 'lucide-react';
import {
  getCategories, createCategory, deleteCategory,
  type Category,
} from '../../api/adminApi';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [newName,    setNewName]    = useState('');
  const [newOrder,   setNewOrder]   = useState('0');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createCategory(name, parseInt(newOrder, 10) || 0);
      setCategories(prev => [...prev, created].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      setNewName('');
      setNewOrder('0');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Kategorie "${name}" wirklich löschen? Produkte bleiben erhalten.`)) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__left">
          <span className="page-header__eyebrow">Shop</span>
          <h1 className="page-header__title">Kategorien</h1>
          <p className="page-header__sub">{categories.length} {categories.length === 1 ? 'Kategorie' : 'Kategorien'} vorhanden</p>
        </div>
        <div className="page-header__actions">
          <button className="btn-secondary" onClick={fetchCategories} disabled={loading} title="Aktualisieren">
            <RefreshCw size={15} strokeWidth={2} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Neue Kategorie */}
      <div className="cat-create">
        <h2 className="cat-create__title">Neue Kategorie</h2>
        <form className="cat-create__form" onSubmit={handleCreate}>
          <div className="cat-create__row">
            <div className="form-group cat-create__name-field">
              <label className="form-label" htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                className="form-input"
                type="text"
                placeholder="z. B. Protein"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="form-group cat-create__order-field">
              <label className="form-label" htmlFor="cat-order">Reihenfolge</label>
              <input
                id="cat-order"
                className="form-input"
                type="number"
                min="0"
                value={newOrder}
                onChange={e => setNewOrder(e.target.value)}
              />
            </div>
            <div className="cat-create__btn-wrap">
              <button className="cat-create__btn" type="submit" disabled={saving || !newName.trim()}>
                <Plus size={15} strokeWidth={2.5} />
                {saving ? 'Erstellen…' : 'Kategorie erstellen'}
              </button>
            </div>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
        </form>
      </div>

      {/* Liste */}
      {loading && (
        <div className="inq-state">
          <div className="inq-state__icon"><Loader2 size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Kategorien werden geladen…</p>
        </div>
      )}

      {!loading && error && (
        <div className="inq-state">
          <div className="inq-state__icon"><AlertCircle size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">{error}</p>
          <button className="inq-state__retry" onClick={fetchCategories}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="inq-state">
          <div className="inq-state__icon"><Tag size={32} strokeWidth={1.5} /></div>
          <p className="inq-state__text">Noch keine Kategorien vorhanden. Erstelle die erste oben.</p>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="cat-list">
          {categories.map(cat => (
            <div key={cat.id} className="cat-item">
              <div className="cat-item__info">
                <span className="cat-item__order">#{cat.order}</span>
                <span className="cat-item__name">{cat.name}</span>
              </div>
              <button
                className="btn-icon btn-icon--danger"
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={deletingId === cat.id}
                title={`"${cat.name}" löschen`}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
