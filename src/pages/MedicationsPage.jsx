import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pill } from 'lucide-react';
import { medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Select, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './ResponsiveGrid.css';

const FREQ_OPTIONS = [
  { value:'once_daily', label:'Once daily' },
  { value:'twice_daily', label:'Twice daily' },
  { value:'three_times_daily', label:'Three times daily' },
  { value:'as_needed', label:'As needed' },
];

const DEFAULT = { name:'', dosage:'', frequency:'once_daily', times:['08:00'], startDate:'', endDate:'', quantity:'', refillThreshold:'7', instructions:'' };

export default function MedicationsPage() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await medicationsAPI.getAll();
      setMeds(r.data?.data?.data || r.data?.data || r.data || []);
    } catch { toast.error('Failed to load medications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = meds.filter(m => (m.name||'').toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setForm(DEFAULT); setEditing(null); setShowModal(true); };
  const openEdit = (m) => {
    setForm({ name:m.name||'', dosage:m.dosage||'', frequency:m.frequency||'once_daily',
      times:m.times||['08:00'], startDate:m.startDate?m.startDate.slice(0,10):'',
      endDate:m.endDate?m.endDate.slice(0,10):'', quantity:m.quantity||'',
      refillThreshold:m.refillThreshold||'7', instructions:m.instructions||'' });
    setEditing(m); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), refillThreshold: Number(form.refillThreshold) };
      if (editing) { await medicationsAPI.update(editing._id||editing.id, payload); toast.success('Medication updated'); }
      else { await medicationsAPI.create(payload); toast.success('Medication added'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Deactivate ${m.name}?`)) return;
    try { await medicationsAPI.delete(m._id||m.id); toast.success('Medication deactivated'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key:'name', label:'Medication', render:(v,m) => (
      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <div style={{width:'32px',height:'32px',borderRadius:'6px',background:'rgba(46,213,115,0.12)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent-success)'}}>
          <Pill size={14}/>
        </div>
        <div>
          <p style={{fontWeight:600,color:'var(--text-primary)',fontSize:'14px'}}>{v}</p>
          <p style={{fontSize:'12px',color:'var(--text-muted)'}}>{m.dosage}</p>
        </div>
      </div>
    )},
    { key:'frequency', label:'Frequency', render:(v) => FREQ_OPTIONS.find(o=>o.value===v)?.label || v },
    { key:'times', label:'Times', render:(v) => (v||[]).join(', ') },
    { key:'remainingQuantity', label:'Remaining', render:(v,m) => (
      <span style={{fontFamily:'var(--font-mono)',fontWeight:600,color:v<=m.refillThreshold?'var(--accent-danger)':'var(--text-primary)'}}>
        {v ?? '—'}
      </span>
    )},
    { key:'isActive', label:'Status', render:(v) => <Badge variant={v?'success':'default'}>{v?'Active':'Inactive'}</Badge> },
    { key:'actions', label:'', width:'120px', render:(_,m) => (
      <div style={{display:'flex',gap:'6px'}}>
        <Button size="sm" variant="secondary" onClick={(e)=>{e.stopPropagation();openEdit(m);}}>Edit</Button>
        <Button size="sm" variant="danger" onClick={(e)=>{e.stopPropagation();handleDelete(m);}}>Del</Button>
      </div>
    )},
  ];

  return (
    <div className="page-enter">
      <PageHeader title="Medications" subtitle={`${meds.length} medication${meds.length!==1?'s':''}`}
        actions={<Button icon={<Plus size={16}/>} onClick={openCreate}>Add Medication</Button>} />
      <Card style={{marginBottom:'20px',padding:'14px 16px'}}>
        <Input placeholder="Search medications…" icon={Search} value={search} onChange={e=>setSearch(e.target.value)}/>
      </Card>
      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No medications found"/>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editing?'Edit Medication':'Add Medication'} size="md">
        <form onSubmit={handleSave} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div className="grid-2">
            <Input label="Medication Name *" placeholder="e.g. Paracetamol" value={form.name} onChange={set('name')} required/>
            <Input label="Dosage *" placeholder="e.g. 500mg" value={form.dosage} onChange={set('dosage')} required/>
          </div>
          <Select label="Frequency" options={FREQ_OPTIONS} value={form.frequency} onChange={set('frequency')}/>
          <Input label="Times (comma-separated)" placeholder="e.g. 08:00, 20:00"
            value={Array.isArray(form.times)?form.times.join(', '):form.times}
            onChange={e=>setForm(p=>({...p,times:e.target.value.split(',').map(t=>t.trim())}))}/>
          <div className="grid-2">
            <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')}/>
            <Input label="End Date" type="date" value={form.endDate} onChange={set('endDate')}/>
          </div>
          <div className="grid-2">
            <Input label="Quantity" type="number" placeholder="e.g. 30" value={form.quantity} onChange={set('quantity')}/>
            <Input label="Refill Threshold" type="number" placeholder="e.g. 7" value={form.refillThreshold} onChange={set('refillThreshold')}/>
          </div>
          <Textarea label="Instructions" placeholder="e.g. Take after food" value={form.instructions} onChange={set('instructions')}/>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing?'Save Changes':'Add Medication'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
