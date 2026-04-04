import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { appointmentsAPI, patientsAPI } from '../utils/api';
import {
  PageHeader, Button, Input, Select, Textarea,
  Modal, Table, Badge, Card
} from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending', label: 'Pending' },
];

const STATUS_BADGE = { scheduled: 'info', completed: 'success', cancelled: 'danger', pending: 'warning' };

const DEFAULT_FORM = {
  patientId: '', date: '', time: '', reason: '', status: 'scheduled', notes: ''
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.allSettled([
        appointmentsAPI.getAll(),
        patientsAPI.getAll(),
      ]);
      if (aRes.status === 'fulfilled') setAppointments(aRes.value.data?.appointments || aRes.value.data || []);
      if (pRes.status === 'fulfilled') setPatients(pRes.value.data?.patients || pRes.value.data || []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const patientOptions = patients.map(p => ({
    value: p._id || p.id,
    label: p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name || 'Unknown'
  }));

  const filtered = appointments.filter(a => {
    const name = (a.patientName || a.patient?.name || '').toLowerCase();
    const reason = (a.reason || '').toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = name.includes(q) || reason.includes(q);
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setForm(DEFAULT_FORM); setEditing(null); setShowModal(true); };
  const openEdit = (a) => {
    setForm({
      patientId: a.patientId || a.patient?._id || a.patient?.id || '',
      date: a.date ? a.date.slice(0, 10) : '',
      time: a.time || '',
      reason: a.reason || '',
      status: a.status || 'scheduled',
      notes: a.notes || '',
    });
    setEditing(a);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, date: form.date && form.time ? `${form.date}T${form.time}` : form.date };
      if (editing) {
        await appointmentsAPI.update(editing._id || editing.id, payload);
        toast.success('Appointment updated');
      } else {
        await appointmentsAPI.create(payload);
        toast.success('Appointment booked');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (a) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await appointmentsAPI.delete(a._id || a.id);
      toast.success('Appointment deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  };

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const columns = [
    {
      key: 'patient', label: 'Patient',
      render: (_, a) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {a.patientName || a.patient?.name || '—'}
        </span>
      )
    },
    {
      key: 'date', label: 'Date & Time',
      render: (_, a) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          {a.date ? format(new Date(a.date), 'dd MMM yyyy') : '—'}
          {a.time ? ` · ${a.time}` : ''}
        </span>
      )
    },
    { key: 'reason', label: 'Reason', render: (v) => v || <span style={{color:'var(--text-muted)'}}>—</span> },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={STATUS_BADGE[v] || 'default'}>{v || 'scheduled'}</Badge>
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, a) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(a); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(a); }}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} total appointment${appointments.length !== 1 ? 's' : ''}`}
        actions={<Button icon={<Plus size={16} />} onClick={openCreate}>Book Appointment</Button>}
      />

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input placeholder="Search by patient or reason…" icon={Search}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ minWidth: '160px' }}>
            <Select
              options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No appointments found" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Appointment' : 'Book Appointment'} size="md">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select label="Patient *" options={patientOptions}
            value={form.patientId} onChange={set('patientId')} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Input label="Date *" type="date" value={form.date} onChange={set('date')} required />
            <Input label="Time" type="time" value={form.time} onChange={set('time')} />
          </div>
          <Input label="Reason" placeholder="e.g. Follow-up consultation" value={form.reason} onChange={set('reason')} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')} />
          <Textarea label="Notes" placeholder="Additional notes…" value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Book'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
