import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { dosesAPI, medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Select, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value:'taken', label:'Taken' }, { value:'missed', label:'Missed' }, { value:'skipped', label:'Skipped' },
];

const DEFAULT = { medication:'', scheduledTime:'', status:'taken', takenAt:'', notes:'' };

export default function DosesPage() {
  const [doses, setDoses] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, mRes] = await Promise.allSettled([dosesAPI.getAll(), medicationsAPI.getAll()]);
      if (dRes.status==='fulfilled') setDoses(dRes.value.data?.data?.data || dRes.value.data?.data || []);
      if (mRes.status==='fulfilled') setMeds(mRes.value.data?.data?.data || mRes.value.data?.data || []);
    } catch { toast.error('Failed to load doses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const medOptions = meds.map(m => ({ value: m._id||m.id, label: `${m.name} (${m.dosage})` }));
  const filtered = doses.filter(d => {
    const name = d.medication?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const openCreate = () => { setForm(DEFAULT); setEditing(null); setShowModal(true); };
  const openEdit = (d) => {
    setForm({ medication:d.medication?._id||d.medication||'', scheduledTime:d.scheduledTime?d.scheduledTime.slice(0,16):'',
      status:d.status||'taken', takenAt:d.takenAt?d.takenAt.slice(0,16):'', notes:d.notes||'' });
    setEditing(d); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await dosesAPI.update(editing._id||editing.id, form); toast.success('Dose updated'); }
      else { await dosesAPI.log(form); toast.success('Dose logged'); }
      setShowModal(false); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d) => {
    if (!window.confirm('Delete this dose log?')) return;
    try { await dosesAPI.delete(d._id||d.id); toast.success('Dose deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key:'medication', label:'Medication', render:(v) => (
      <div>
        <p style={{fontWeight:600,color:'var(--text-primary)'}}>{v?.name || '—'}</p>
        <p style={{fontSize:'12px',color:'var(--text-muted)'}}>{v?.dosage || ''}</p>
      </div>
    )},
    { key:'scheduledTime', label:'Scheduled', render:(v) => v ? format(new Date(v),'dd MMM yyyy HH:mm') : '—' },
    { key:'takenAt', label:'Taken At', render:(v) => v ? format(new Date(v),'HH:mm') : '—' },
    { key:'status', label:'Status', render:(v) => (
      <Badge variant={v==='taken'?'success':v==='missed'?'danger':'warning'}>{v||'—'}</Badge>
    )},
    { key:'notes', label:'Notes', render:(v) => <span style={{fontSize:'13px',color:'var(--text-muted)'}}>{v||'—'}</span> },
    { key:'actions', label:'', width:'120px', render:(_,d) => (
      <div style={{display:'flex',gap:'6px'}}>
        <Button size="sm" variant="secondary" onClick={(e)=>{e.stopPropagation();openEdit(d);}}>Edit</Button>
        <Button size="sm" variant="danger" onClick={(e)=>{e.stopPropagation();handleDelete(d);}}>Del</Button>
      </div>
    )},
  ];

  return (
    <div className="page-enter">
      <PageHeader title="Dose Log" subtitle="Track your daily medication doses"
        actions={<Button icon={<Plus size={16}/>} onClick={openCreate}>Log Dose</Button>}/>
      <Card style={{marginBottom:'20px',padding:'14px 16px'}}>
        <Input placeholder="Search by medication…" icon={Search} value={search} onChange={e=>setSearch(e.target.value)}/>
      </Card>
      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No dose logs yet"/>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit Dose Log':'Log a Dose'} size="md">
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <Select label="Medication *" options={medOptions} value={form.medication} onChange={set('medication')} required/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            <Input label="Scheduled Time *" type="datetime-local" value={form.scheduledTime} onChange={set('scheduledTime')} required/>
            <Input label="Taken At" type="datetime-local" value={form.takenAt} onChange={set('takenAt')}/>
          </div>
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={set('status')}/>
          <Textarea label="Notes" placeholder="Any notes…" value={form.notes} onChange={set('notes')}/>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'8px',borderTop:'1px solid var(--border-color)'}}>
            <Button type="button" variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing?'Save':'Log Dose'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
