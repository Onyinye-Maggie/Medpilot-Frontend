import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { refillsAPI, medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Select, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './ResponsiveGrid.css';

const DEFAULT = { medication:'', pharmacyName:'', pharmacyAddress:'', pharmacyPhone:'', quantity:'', notes:'', isUrgent:false };

export default function RefillsPage() {
  const [refills, setRefills] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.allSettled([refillsAPI.getAll(), medicationsAPI.getAll()]);
      if (rRes.status==='fulfilled') setRefills(rRes.value.data?.data?.data || rRes.value.data?.data || []);
      if (mRes.status==='fulfilled') setMeds(mRes.value.data?.data?.data || mRes.value.data?.data || []);
    } catch { toast.error('Failed to load refills'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const medOptions = meds.map(m => ({ value: m._id||m.id, label: `${m.name} (${m.dosage}) — ${m.remainingQuantity} left` }));

  const filtered = refills.filter(r => {
    const name = r.medication?.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) || (r.pharmacyName||'').toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await refillsAPI.create({ ...form, quantity: Number(form.quantity) });
      toast.success('Refill request submitted');
      setShowModal(false); fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to submit'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (r) => {
    if (!window.confirm('Cancel this refill request?')) return;
    try { await refillsAPI.cancel(r._id||r.id); toast.success('Refill cancelled'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const BADGE = { pending:'warning', approved:'success', completed:'info', cancelled:'danger' };

  const columns = [
    { key:'medication', label:'Medication', render:(v) => (
      <div>
        <p style={{fontWeight:600,color:'var(--text-primary)'}}>{v?.name||'—'}</p>
        <p style={{fontSize:'12px',color:'var(--text-muted)'}}>{v?.dosage||''} · {v?.remainingQuantity} remaining</p>
      </div>
    )},
    { key:'pharmacyName', label:'Pharmacy', render:(v) => v||'—' },
    { key:'quantity', label:'Qty', render:(v) => <span style={{fontFamily:'var(--font-mono)'}}>{v}</span> },
    { key:'requestedAt', label:'Requested', render:(v) => v ? format(new Date(v),'dd MMM yyyy') : '—' },
    { key:'status', label:'Status', render:(v) => <Badge variant={BADGE[v]||'default'}>{v||'pending'}</Badge> },
    { key:'isUrgent', label:'', render:(v) => v ? <Badge variant="danger">Urgent</Badge> : null },
    { key:'actions', label:'', width:'100px', render:(_,r) => r.status==='pending' ? (
      <Button size="sm" variant="danger" onClick={(e)=>{e.stopPropagation();handleCancel(r);}}>Cancel</Button>
    ) : null },
  ];

  return (
    <div className="page-enter">
      <PageHeader title="Refill Requests" subtitle="Request and track your medication refills"
        actions={<Button icon={<Plus size={16}/>} onClick={()=>{setForm(DEFAULT);setShowModal(true);}}>Request Refill</Button>}/>
      <Card style={{marginBottom:'20px',padding:'14px 16px'}}>
        <Input placeholder="Search by medication or pharmacy…" icon={Search} value={search} onChange={e=>setSearch(e.target.value)}/>
      </Card>
      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No refill requests"/>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Request a Refill" size="md">
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <Select label="Medication *" options={medOptions} value={form.medication} onChange={set('medication')} required/>
          <Input label="Pharmacy Name *" placeholder="e.g. HealthPlus Pharmacy" value={form.pharmacyName} onChange={set('pharmacyName')} required/>
          <Input label="Pharmacy Address" placeholder="e.g. 123 Lagos Street, Abuja" value={form.pharmacyAddress} onChange={set('pharmacyAddress')}/>
          <Input label="Pharmacy Phone" placeholder="e.g. +2348012345678" value={form.pharmacyPhone} onChange={set('pharmacyPhone')}/>
          <Input label="Quantity *" type="number" placeholder="e.g. 30" value={form.quantity} onChange={set('quantity')} required/>
          <Textarea label="Notes" placeholder="Any special notes…" value={form.notes} onChange={set('notes')}/>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'8px',borderTop:'1px solid var(--border-color)'}}>
            <Button type="button" variant="secondary" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
