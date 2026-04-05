import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { recordsAPI, patientsAPI } from '../utils/api';
import {
  PageHeader, Button, Input, Select, Textarea,
  Modal, Table, Badge, Card
} from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './ResponsiveGrid.css';

const TYPE_OPTIONS = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
];

const DEFAULT_FORM = {
  patientId: '', type: 'consultation', title: '',
  date: '', diagnosis: '', notes: '', status: 'pending'
};

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
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
      const [rRes, pRes] = await Promise.allSettled([
        recordsAPI.getByPatient('all'),
        patientsAPI.getAll(),
      ]);
      if (rRes.status === 'fulfilled') setRecords(rRes.value.data?.records || rRes.value.data || []);
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data?.patients || pRes.value.data || []);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const patientOptions = patients.map(p => ({
    value: p._id || p.id,
    label: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || 'Unknown'
  }));

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (
      (r.title || r.type || '').toLowerCase().includes(q) ||
      (r.patientName || r.patient?.name || '').toLowerCase().includes(q) ||
      (r.diagnosis || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => { setForm(DEFAULT_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({
      patientId: r.patientId || r.patient?._id || '',
      type: r.type || 'consultation',
      title: r.title || '',
      date: r.date ? r.date.slice(0, 10) : '',
      diagnosis: r.diagnosis || '',
      notes: r.notes || '',
      status: r.status || 'pending',
    });
    setEditing(r);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await recordsAPI.update(editing._id || editing.id, form);
        toast.success('Record updated');
      } else {
        await recordsAPI.create(form);
        toast.success('Record created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (!window.confirm('Delete this medical record?')) return;
    try {
      await recordsAPI.delete(r._id || r.id);
      toast.success('Record deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const columns = [
    {
      key: 'title', label: 'Record',
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(0,153,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
            <FileText size={14} />
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{v || r.type || 'Record'}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.type || ''}</p>
          </div>
        </div>
      )
    },
    { key: 'patient', label: 'Patient', render: (_, r) => r.patientName || r.patient?.name || '—' },
    {
      key: 'diagnosis', label: 'Diagnosis',
      render: (v) => v ? (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.slice(0, 40)}{v.length > 40 ? '…' : ''}</span>
      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>
    },
    {
      key: 'date', label: 'Date',
      render: (v) => v ? (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {format(new Date(v), 'dd MMM yyyy')}
        </span>
      ) : '—'
    },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <Badge variant={v === 'reviewed' ? 'success' : v === 'archived' ? 'default' : 'warning'}>
          {v || 'pending'}
        </Badge>
      )
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(r); }}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Medical Records"
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''} on file`}
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>New Record</Button>}
      />

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input placeholder="Search by title, patient, or diagnosis…" icon={Search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </Card>

      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No medical records found" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Record' : 'New Medical Record'} size="md">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select label="Patient *" options={patientOptions}
            value={form.patientId} onChange={set('patientId')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Select label="Type" options={TYPE_OPTIONS} value={form.type} onChange={set('type')} />
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
          </div>
          <Input label="Title" placeholder="e.g. Annual Check-up" value={form.title} onChange={set('title')} />
          <Input label="Diagnosis" placeholder="e.g. Hypertension Stage 1" value={form.diagnosis} onChange={set('diagnosis')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Textarea label="Notes" placeholder="Detailed notes, observations, treatment plan…"
            value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create Record'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
