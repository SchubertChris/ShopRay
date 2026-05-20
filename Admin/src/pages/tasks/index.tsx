import { useState, useEffect } from 'react';
import {
  CheckSquare, Plus, Trash2, Clock, AlertCircle,
  ChevronDown, Loader2, User,
} from 'lucide-react';
import { useAuthStore }   from '@stores/authStore';
import {
  getTasks, createTask, updateTaskStatus, deleteTask,
  type AdminTask, type TaskStatus, type TaskPriority, type CreateTaskPayload,
} from '../../api/adminApi';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Niedrig', normal: 'Normal', high: 'Hoch', urgent: 'Dringend',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Offen', in_progress: 'In Bearbeitung', done: 'Erledigt',
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(task: AdminTask): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

export default function TasksPage() {
  const role                      = useAuthStore(s => s.role);
  const [tasks,    setTasks]      = useState<AdminTask[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [filter,   setFilter]     = useState<TaskStatus | 'all'>('all');

  const [form, setForm] = useState<{
    title: string; description: string; priority: TaskPriority; due_date: string;
  }>({ title: '', description: '', priority: 'normal', due_date: '' });

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => setError('Aufgaben konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload: CreateTaskPayload = {
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        priority:    form.priority,
        due_date:    form.due_date || null,
      };
      const task = await createTask(payload);
      setTasks(prev => [task, ...prev]);
      setForm({ title: '', description: '', priority: 'normal', due_date: '' });
      setShowForm(false);
    } catch { setError('Aufgabe konnte nicht erstellt werden.'); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    try {
      const updated = await updateTaskStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch { setError('Status konnte nicht geändert werden.'); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { setError('Aufgabe konnte nicht gelöscht werden.'); }
    finally { setDeleting(null); }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const counts   = {
    all:         tasks.length,
    open:        tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="tasks-page">
      <div className="tasks-page__header">
        <div>
          <h1 className="tasks-page__title">
            <CheckSquare size={20} strokeWidth={1.75} />
            Aufgaben
          </h1>
          <p className="tasks-page__sub">Aufgaben verwalten und Status verfolgen</p>
        </div>
        {role === 'owner' && (
          <button className="btn btn--primary btn--sm" onClick={() => setShowForm(v => !v)}>
            <Plus size={15} strokeWidth={2} />
            Neue Aufgabe
          </button>
        )}
      </div>

      {error && (
        <div className="tasks-page__error">
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      {showForm && role === 'owner' && (
        <form className="task-form" onSubmit={(e) => { void handleCreate(e); }}>
          <h3 className="task-form__title">Neue Aufgabe erstellen</h3>
          <div className="task-form__row">
            <input
              className="form-input"
              placeholder="Titel *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="task-form__row">
            <textarea
              className="form-input task-form__textarea"
              placeholder="Beschreibung (optional)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="task-form__row task-form__row--cols">
            <div className="form-group">
              <label className="form-label">Priorität</label>
              <div className="form-select-wrap">
                <select
                  className="form-input"
                  value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                >
                  {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map(p => (
                    <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fälligkeitsdatum</label>
              <input
                type="date"
                className="form-input"
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="task-form__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}>Abbrechen</button>
            <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
              Erstellen
            </button>
          </div>
        </form>
      )}

      <div className="tasks-page__filters">
        {(['all', 'open', 'in_progress', 'done'] as const).map(f => (
          <button
            key={f}
            className={`tasks-filter-btn${filter === f ? ' is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Alle' : STATUS_LABEL[f]}
            <span className="tasks-filter-btn__count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="tasks-page__loading">
          <Loader2 size={18} className="spin" />
          <span>Lade Aufgaben…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tasks-page__empty">
          <CheckSquare size={28} strokeWidth={1.25} />
          <span>Keine Aufgaben vorhanden</span>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(task => (
            <div key={task.id} className={`task-card task-card--${task.status}${isOverdue(task) ? ' task-card--overdue' : ''}`}>
              <div className="task-card__head">
                <span className={`task-card__priority task-card__priority--${task.priority}`}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                <div className="task-card__actions">
                  <div className="form-select-wrap form-select-wrap--sm">
                    <select
                      className="form-input form-input--sm"
                      value={task.status}
                      onChange={e => { void handleStatusChange(task.id, e.target.value as TaskStatus); }}
                    >
                      {(Object.keys(STATUS_LABEL) as TaskStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} />
                  </div>
                  {role === 'owner' && (
                    <button
                      className="task-card__delete"
                      onClick={() => { void handleDelete(task.id); }}
                      disabled={deleting === task.id}
                      title="Aufgabe löschen"
                    >
                      {deleting === task.id
                        ? <Loader2 size={13} className="spin" />
                        : <Trash2 size={13} strokeWidth={1.75} />
                      }
                    </button>
                  )}
                </div>
              </div>
              <p className="task-card__title">{task.title}</p>
              {task.description && <p className="task-card__desc">{task.description}</p>}
              <div className="task-card__meta">
                {task.assigned_to && (
                  <span className="task-card__meta-item">
                    <User size={11} strokeWidth={2} />
                    Zugewiesen
                  </span>
                )}
                {task.due_date && (
                  <span className={`task-card__meta-item${isOverdue(task) ? ' task-card__meta-item--overdue' : ''}`}>
                    <Clock size={11} strokeWidth={2} />
                    {formatDate(task.due_date)}
                    {isOverdue(task) && ' — Überfällig'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
