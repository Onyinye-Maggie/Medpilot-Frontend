import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pill } from 'lucide-react';
import { prescriptionsAPI, patientsAPI } from '../utils/api';
import {
  PageHeader, Button, Input, Select, Textarea,
  Modal, Table, Badge, Card, EmptyState
} from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'discontinued', label: 'Discontinued' },
];

const DEFAULT_FORM = {
  patientId: '', medication: '', dosage: '', frequency: '',
  startDate: '', endDate: '', instructions: '', status: 'active'
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prRes, pRes] = await Promise.allSettled([
        prescriptionsAPI.getByPatient('all'),
        patientsAPI.getAll(),
      ]);
      // fallback: some APIs expose /prescriptions directly
      if (prRes.status === 'fulfilled') {
        setPrescriptions(prRes.value.data?.prescriptions || prRes.value.data || []);
      }
      if (pRes.status === 'fulfilled') {
        setPatients(pRes.value.data?.patients || pRes.value.data || []);
      }
    } catch { toast.error('Failed to load prescriptions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const patientOptions = patients.map(p => ({
    value: p._id || p.id,
    label: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || 'Unknown'
  }));

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.medication || '').toLowerCase().includes(q) ||
      (p.patientName || p.patient?.name || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => { setForm(DEFAULT_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({
      patientId: p.patientId || p.patient?._id || '',
      medication: p.medication || '',
      dosage: p.dosage || '',
      frequency: p.frequency || '',
      startDate: p.startDate ? p.startDate.slice(0, 10) : '',
      endDate: p.endDate ? p.endDate.slice(0, 10) : '',
      instructions: p.instructions || '',
      status: p.status || 'active',
    });
    setEditing(p);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await prescriptionsAPI.update(editing._id || editing.id, form);
        toast.success('Prescription updated');
      } else {
        await prescriptionsAPI.create(form);
        toast.success('Prescription created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete prescription for ${p.medication}?`)) return;
    try {
      await prescriptionsAPI.delete(p._id || p.id);
      toast.success('Prescription deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const columns = [
    {
      key: 'medication', label: 'Medication',
      render: (v, p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(46,213,115,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-success)' }}>
            <Pill size={14} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{v || '—'}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.dosage || ''}</p>
          </div>
        </div>
      )
    },
    {
      key: 'patient', label: 'Patient',
      render: (_, p) => p.patientName || p.patient?.name || '—'
    },
    { key: 'frequency', label: 'Frequency', render: (v) => v || '—' },
    {
      key: 'startDate', label: 'Duration',
      render: (_, p) => (
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {p.startDate ? format(new Date(p.startDate), 'dd MMM yy') : '—'}
          {p.endDate ? ` → ${format(new Date(p.endDate), 'dd MMM yy')}` : ''}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <Badge variant={v === 'active' ? 'success' : v === 'discontinued' ? 'danger' : 'default'}>
          {v || 'active'}
        </Badge>
      )
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, p) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(p); }}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Prescriptions"
        subtitle={`${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''}`}
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>New Prescription</Button>}
      />

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input placeholder="Search by medication or patient…" icon={Search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </Card>

      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No prescriptions found" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Prescription' : 'New Prescription'} size="md">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select label="Patient *" options={patientOptions}
            value={form.patientId} onChange={set('patientId')} required />
          <Input label="Medication *" placeholder="e.g. Amoxicillin 500mg"
            value={form.medication} onChange={set('medication')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Dosage" placeholder="e.g. 500mg" value={form.dosage} onChange={set('dosage')} />
            <Input label="Frequency" placeholder="e.g. Twice daily" value={form.frequency} onChange={set('frequency')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
            <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')} />
          </div>
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Textarea label="Instructions" placeholder="Special instructions for the patient…"
            value={form.instructions} onChange={set('instructions')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
