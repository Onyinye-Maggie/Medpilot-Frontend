import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pill } from 'lucide-react';
import { medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Select, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './ResponsiveGrid.css';

const FREQ_OPTIONS = [
  { value: 'once_daily',         label: 'Once daily' },
  { value: 'twice_daily',        label: 'Twice daily' },
  { value: 'three_times_daily',  label: 'Three times daily' },
  { value: 'as_needed',          label: 'As needed' },
];

// Default times per frequency
const DEFAULT_TIMES = {
  once_daily:        '08:00',
  twice_daily:       '08:00, 20:00',
  three_times_daily: '08:00, 14:00, 20:00',
  as_needed:         '08:00',
};

const DEFAULT_FORM = {
  name: '', dosage: '', frequency: 'once_daily',
  timesStr: '08:00',   // user edits this as a comma-separated string
  startDate: '', endDate: '',
  quantity: '', refillThreshold: '7', instructions: '',
};

export default function MedicationsPage() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    try {
      const r = await medicationsAPI.getAll();
      // Response: { data: { total, page, pages, data: [...] } }
      const list = r.data?.data?.data || r.data?.data || r.data || [];
      setMeds(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load medications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);

  const filtered = meds.filter(m =>
    (m.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setEditing(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (m) => {
    setForm({
      name: m.name || '',
      dosage: m.dosage || '',
      frequency: m.frequency || 'once_daily',
      timesStr: Array.isArray(m.times) ? m.times.join(', ') : (m.times || '08:00'),
      startDate: m.startDate ? m.startDate.slice(0, 10) : '',
      endDate: m.endDate ? m.endDate.slice(0, 10) : '',
      quantity: m.quantity != null ? String(m.quantity) : '',
      refillThreshold: m.refillThreshold != null ? String(m.refillThreshold) : '7',
      instructions: m.instructions || '',
    });
    setEditing(m);
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name = 'Medication name is required';
    if (!form.dosage.trim())    e.dosage = 'Dosage is required';
    if (!form.startDate)        e.startDate = 'Start date is required';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = 'Valid quantity is required';
    const times = form.timesStr.split(',').map(t => t.trim()).filter(Boolean);
    if (times.length === 0)     e.timesStr = 'At least one time is required (e.g. 08:00)';
    return e;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // Build payload exactly as Postman shows
      const times = form.timesStr.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        times,                                    // array of "HH:MM" strings
        startDate: form.startDate,                // "YYYY-MM-DD" string
        quantity: Number(form.quantity),          // integer
        instructions: form.instructions.trim(),
      };
      // Only add optional fields if provided
      if (form.endDate)           payload.endDate = form.endDate;
      if (form.refillThreshold)   payload.refillThreshold = Number(form.refillThreshold);

      if (editing) {
        await medicationsAPI.update(editing._id || editing.id, payload);
        toast.success('Medication updated');
      } else {
        await medicationsAPI.create(payload);
        toast.success('Medication added successfully');
      }
      setShowModal(false);
      fetchMeds();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.message ||
        (Array.isArray(data?.errors) ? data.errors.map(e => e.message || e.msg).join(', ') : null) ||
        'Failed to save medication';
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Deactivate ${m.name}?`)) return;
    try {
      await medicationsAPI.delete(m._id || m.id);
      toast.success('Medication deactivated');
      fetchMeds();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  const handleFrequencyChange = (e) => {
    const freq = e.target.value;
    setForm(p => ({
      ...p,
      frequency: freq,
      timesStr: DEFAULT_TIMES[freq] || '08:00',
    }));
  };

  const columns = [
    {
      key: 'name', label: 'Medication',
      render: (v, m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(46,213,115,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)', flexShrink: 0 }}>
            <Pill size={14} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{v}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.dosage}</p>
          </div>
        </div>
      )
    },
    { key: 'frequency', label: 'Frequency', render: (v) => FREQ_OPTIONS.find(o => o.value === v)?.label || v },
    { key: 'times', label: 'Times', render: (v) => (Array.isArray(v) ? v : []).join(', ') || '—' },
    {
      key: 'remainingQuantity', label: 'Remaining',
      render: (v, m) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: (v != null && v <= m.refillThreshold) ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
          {v ?? m.quantity ?? '—'}
        </span>
      )
    },
    {
      key: 'startDate', label: 'Start',
      render: (v) => v ? format(new Date(v), 'dd MMM yyyy') : '—'
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Inactive'}</Badge>
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, m) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(m); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(m); }}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Medications"
        subtitle={`${meds.length} medication${meds.length !== 1 ? 's' : ''} on record`}
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Add Medication</Button>}
      />

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input placeholder="Search medications…" icon={Search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </Card>

      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No medications found. Add your first medication above." />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Medication' : 'Add Medication'} size="md">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div className="grid-2">
            <Input label="Medication Name *" placeholder="e.g. Paracetamol"
              value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Dosage *" placeholder="e.g. 500mg"
              value={form.dosage} onChange={set('dosage')} error={errors.dosage} />
          </div>

          <Select label="Frequency *" options={FREQ_OPTIONS}
            value={form.frequency} onChange={handleFrequencyChange} />

          <Input
            label="Dose Times * (comma-separated, 24h format)"
            placeholder="e.g. 08:00, 20:00"
            value={form.timesStr}
            onChange={set('timesStr')}
            error={errors.timesStr}
          />

          <div className="grid-2">
            <Input label="Start Date *" type="date"
              value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
            <Input label="End Date (optional)" type="date"
              value={form.endDate} onChange={set('endDate')} />
          </div>

          <div className="grid-2">
            <Input label="Quantity *" type="number" placeholder="e.g. 30" min="1"
              value={form.quantity} onChange={set('quantity')} error={errors.quantity} />
            <Input label="Refill Alert When Below" type="number" placeholder="e.g. 7" min="1"
              value={form.refillThreshold} onChange={set('refillThreshold')} />
          </div>

          <Textarea label="Instructions" placeholder="e.g. Take after food with a full glass of water"
            value={form.instructions} onChange={set('instructions')} />

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Add Medication'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
