import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { dosesAPI, medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './ResponsiveGrid.css';

const STATUS_OPTIONS = [
  { value: 'taken',   label: 'Taken' },
  { value: 'missed',  label: 'Missed' },
  { value: 'skipped', label: 'Skipped' },
];

// datetime-local value "2026-04-06T08:00" → full ISO "2026-04-06T08:00:00.000Z"
const toISO = (dtLocal) => {
  if (!dtLocal || dtLocal.trim() === '') return null;
  const d = new Date(dtLocal);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

// ISO → datetime-local format for input value
const toLocal = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 16); }
  catch { return ''; }
};

// Get current datetime-local string
const nowLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};

const DEFAULT_FORM = {
  medication: '',
  scheduledTime: '',
  status: 'taken',
  takenAt: '',
  notes: '',
};

export default function DosesPage() {
  const [doses, setDoses] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, mRes] = await Promise.allSettled([
        dosesAPI.getAll(),
        medicationsAPI.getAll(),
      ]);
      if (dRes.status === 'fulfilled') {
        const list = dRes.value.data?.data?.data || dRes.value.data?.data || dRes.value.data || [];
        setDoses(Array.isArray(list) ? list : []);
      }
      if (mRes.status === 'fulfilled') {
        const list = mRes.value.data?.data?.data || mRes.value.data?.data || mRes.value.data || [];
        setMeds(Array.isArray(list) ? list : []);
      }
    } catch {
      toast.error('Failed to load dose logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeMeds = meds.filter(m => m.isActive !== false);
  const medOptions = activeMeds.map(m => ({
    value: m._id || m.id,
    label: `${m.name} — ${m.dosage}`,
  }));

  const filtered = doses.filter(d => {
    const name = d.medication?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const openCreate = () => {
    const now = nowLocal();
    setForm({
      medication: medOptions[0]?.value || '',
      scheduledTime: now,
      status: 'taken',
      takenAt: now,
      notes: '',
    });
    setEditing(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (d) => {
    setForm({
      medication: d.medication?._id || d.medication?.id || (typeof d.medication === 'string' ? d.medication : ''),
      scheduledTime: d.scheduledTime ? toLocal(d.scheduledTime) : '',
      status: d.status || 'taken',
      takenAt: d.takenAt ? toLocal(d.takenAt) : '',
      notes: d.notes || '',
    });
    setEditing(d);
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.medication)    e.medication = 'Please select a medication';
    if (!form.scheduledTime) e.scheduledTime = 'Scheduled time is required';
    return e;
  };

  const handleSave = async (evt) => {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    // Build payload OUTSIDE try so it's in scope for error logging
    const scheduledISO = toISO(form.scheduledTime);
    const takenISO     = toISO(form.takenAt) || scheduledISO; // fallback to scheduledTime

    const payload = {
      medication:    form.medication,
      scheduledTime: scheduledISO,
      status:        form.status,
      takenAt:       form.status === 'taken' ? takenISO : scheduledISO,
      notes:         form.notes || '',
    };

    try {
      if (editing) {
        await dosesAPI.update(editing._id || editing.id, payload);
        toast.success('Dose log updated');
      } else {
        await dosesAPI.log(payload);
        toast.success('Dose logged successfully');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      const data = err?.response?.data;
      const serverMsg = data?.message
        || (Array.isArray(data?.errors) ? data.errors.map(e => e.message || e.msg).join(', ') : null)
        || (typeof data === 'string' ? data : null)
        || err?.message
        || 'Failed to save dose log';
      toast.error(serverMsg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    if (!window.confirm('Delete this dose log?')) return;
    try {
      await dosesAPI.delete(d._id || d.id);
      toast.success('Dose log deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const columns = [
    {
      key: 'medication', label: 'Medication',
      render: (v) => (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v?.name || '—'}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v?.dosage || ''}</p>
        </div>
      )
    },
    {
      key: 'scheduledTime', label: 'Scheduled',
      render: (v) => { try { return v ? format(parseISO(v), 'dd MMM yyyy HH:mm') : '—'; } catch { return '—'; } }
    },
    {
      key: 'takenAt', label: 'Taken At',
      render: (v) => { try { return v ? format(parseISO(v), 'HH:mm') : '—'; } catch { return '—'; } }
    },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <Badge variant={v === 'taken' ? 'success' : v === 'missed' ? 'danger' : 'warning'}>
          {v || '—'}
        </Badge>
      )
    },
    {
      key: 'notes', label: 'Notes',
      render: (v) => <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{v || '—'}</span>
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, d) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(d); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(d); }}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Dose Log"
        subtitle="Track when you take your medications"
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate} disabled={activeMeds.length === 0}>
            Log Dose
          </Button>
        }
      />

      {!loading && activeMeds.length === 0 && (
        <Card style={{ marginBottom: '20px', padding: '16px', borderColor: 'rgba(255,165,2,0.3)', background: 'rgba(255,165,2,0.05)' }}>
          <p style={{ color: 'var(--accent-warning)', fontSize: '14px' }}>
            ⚠ Add medications first before logging doses.
          </p>
        </Card>
      )}

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input placeholder="Search by medication name…" icon={Search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </Card>

      <Table columns={columns} data={filtered} loading={loading}
        emptyMessage="No dose logs yet. Log your first dose above." />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Dose Log' : 'Log a Dose'} size="md">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Medication select */}
          <div className="form-field">
            <label className="form-label">Medication *</label>
            <div className={`input-wrap ${errors.medication ? 'input-wrap--error' : ''}`}>
              <select
                className="form-input form-select"
                value={form.medication}
                onChange={(e) => { setForm(p => ({ ...p, medication: e.target.value })); setErrors(p => ({ ...p, medication: '' })); }}
              >
                <option value="">Select a medication…</option>
                {medOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {errors.medication && <span className="form-error">{errors.medication}</span>}
          </div>

          {/* Status */}
          <div className="form-field">
            <label className="form-label">Status *</label>
            <div className="input-wrap">
              <select
                className="form-input form-select"
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date/time fields */}
          <div className="grid-2">
            <Input
              label="Scheduled Time *"
              type="datetime-local"
              value={form.scheduledTime}
              onChange={set('scheduledTime')}
              error={errors.scheduledTime}
            />
            <Input
              label={form.status === 'taken' ? 'Time Taken' : 'Time (optional)'}
              type="datetime-local"
              value={form.takenAt}
              onChange={set('takenAt')}
            />
          </div>

          <Textarea
            label="Notes (optional)"
            placeholder="e.g. Taken after breakfast"
            value={form.notes}
            onChange={set('notes')}
          />

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Log Dose'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
