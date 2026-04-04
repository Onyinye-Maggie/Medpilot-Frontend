import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Phone, Mail, User } from 'lucide-react';
import { patientsAPI } from '../utils/api';
import {
  PageHeader, Button, Input, Card, Badge, Modal,
  Select, Textarea, EmptyState, Table, Spinner
} from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import './PatientsPage.css';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BLOOD_OPTIONS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => ({ value: b, label: b }));

const DEFAULT_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: '', bloodGroup: '',
  address: '', allergies: '', emergencyContact: ''
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientsAPI.getAll();
      setPatients(res.data?.patients || res.data || []);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const name = `${p.firstName || ''} ${p.lastName || ''} ${p.name || ''}`.toLowerCase();
    return name.includes(q) || (p.email || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
  });

  const openCreate = () => { setForm(DEFAULT_FORM); setEditPatient(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({
      firstName: p.firstName || p.name?.split(' ')[0] || '',
      lastName: p.lastName || p.name?.split(' ')[1] || '',
      email: p.email || '', phone: p.phone || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0,10) : '',
      gender: p.gender || '', bloodGroup: p.bloodGroup || '',
      address: p.address || '', allergies: p.allergies || '',
      emergencyContact: p.emergencyContact || ''
    });
    setEditPatient(p);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editPatient) {
        await patientsAPI.update(editPatient._id || editPatient.id, form);
        toast.success('Patient updated');
      } else {
        await patientsAPI.create(form);
        toast.success('Patient added');
      }
      setShowModal(false);
      fetchPatients();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save patient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete ${p.firstName || p.name}? This cannot be undone.`)) return;
    try {
      await patientsAPI.delete(p._id || p.id);
      toast.success('Patient deleted');
      fetchPatients();
    } catch {
      toast.error('Failed to delete patient');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Patient',
      render: (_, p) => (
        <div className="patient-cell">
          <div className="patient-avatar">{(p.firstName?.[0] || p.name?.[0] || 'P').toUpperCase()}</div>
          <div>
            <p className="patient-name">{p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name}</p>
            <p className="patient-id">ID: {(p._id || p.id || '').slice(-6).toUpperCase()}</p>
          </div>
        </div>
      )
    },
    { key: 'email', label: 'Email', render: (v) => <span style={{color:'var(--text-secondary)'}}>{v || '—'}</span> },
    { key: 'phone', label: 'Phone', render: (v) => v || '—' },
    { key: 'gender', label: 'Gender', render: (v) => v ? <Badge variant="info">{v}</Badge> : '—' },
    { key: 'bloodGroup', label: 'Blood', render: (v) => v ? <Badge variant="danger">{v}</Badge> : '—' },
    {
      key: 'dateOfBirth', label: 'DOB',
      render: (v) => v ? format(new Date(v), 'dd MMM yyyy') : '—'
    },
    {
      key: 'actions', label: '', width: '120px',
      render: (_, p) => (
        <div style={{display:'flex', gap:'6px'}}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(p); }}>Del</Button>
        </div>
      )
    },
  ];

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="page-enter">
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} patient${patients.length !== 1 ? 's' : ''} registered`}
        actions={
          <Button icon={<Plus size={16} />} onClick={openCreate}>Add Patient</Button>
        }
      />

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input
          placeholder="Search by name, email or phone…"
          icon={Search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Card>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={(p) => navigate(`/patients/${p._id || p.id}`)}
        emptyMessage="No patients found"
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editPatient ? 'Edit Patient' : 'New Patient'}
        size="lg"
      >
        <form onSubmit={handleSave} className="patient-form">
          <div className="form-grid-2">
            <Input label="First Name *" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Last Name *" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <div className="form-grid-2">
            <Input label="Email" type="email" icon={Mail} value={form.email} onChange={set('email')} />
            <Input label="Phone" type="tel" icon={Phone} value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-grid-3">
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            <Select label="Gender" options={GENDER_OPTIONS} value={form.gender} onChange={set('gender')} />
            <Select label="Blood Group" options={BLOOD_OPTIONS} value={form.bloodGroup} onChange={set('bloodGroup')} />
          </div>
          <Input label="Address" value={form.address} onChange={set('address')} />
          <div className="form-grid-2">
            <Input label="Emergency Contact" icon={Phone} value={form.emergencyContact} onChange={set('emergencyContact')} />
            <Input label="Allergies (comma-separated)" value={form.allergies} onChange={set('allergies')} />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editPatient ? 'Save Changes' : 'Add Patient'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
