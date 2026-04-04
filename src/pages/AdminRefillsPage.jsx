import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { refillsAPI } from '../utils/api';
import { PageHeader, Input, Table, Badge, Card, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value:'approved', label:'Approve' },
  { value:'completed', label:'Mark Completed' },
  { value:'cancelled', label:'Cancel' },
];

export default function AdminRefillsPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [refills, setRefills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { if (!isAdmin) { toast.error('Admin access required'); navigate('/dashboard'); } }, [isAdmin, navigate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await refillsAPI.getAll();
      setRefills(r.data?.data?.data || r.data?.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = refills.filter(r => {
    const q = search.toLowerCase();
    return (r.medication?.name||'').toLowerCase().includes(q) || (r.pharmacyName||'').toLowerCase().includes(q);
  });

  const handleStatus = async (r, status) => {
    try {
      await refillsAPI.updateStatus(r._id||r.id, { status });
      toast.success(`Refill ${status}`);
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  const BADGE = { pending:'warning', approved:'success', completed:'info', cancelled:'danger' };

  const columns = [
    { key:'medication', label:'Medication', render:(v) => (
      <div>
        <p style={{fontWeight:600,color:'var(--text-primary)'}}>{v?.name||'—'}</p>
        <p style={{fontSize:'12px',color:'var(--text-muted)'}}>{v?.dosage||''}</p>
      </div>
    )},
    { key:'pharmacyName', label:'Pharmacy' },
    { key:'quantity', label:'Qty', render:(v)=><span style={{fontFamily:'var(--font-mono)'}}>{v}</span> },
    { key:'requestedAt', label:'Requested', render:(v)=>v?format(new Date(v),'dd MMM yyyy'):'—' },
    { key:'status', label:'Status', render:(v)=><Badge variant={BADGE[v]||'default'}>{v}</Badge> },
    { key:'isUrgent', label:'', render:(v)=>v?<Badge variant="danger">Urgent</Badge>:null },
    { key:'actions', label:'Action', width:'160px', render:(_,r) => r.status==='pending' ? (
      <div style={{display:'flex',gap:'4px'}}>
        <Button size="sm" variant="primary" onClick={()=>handleStatus(r,'approved')}>Approve</Button>
        <Button size="sm" variant="danger" onClick={()=>handleStatus(r,'cancelled')}>Reject</Button>
      </div>
    ) : r.status==='approved' ? (
      <Button size="sm" variant="secondary" onClick={()=>handleStatus(r,'completed')}>Complete</Button>
    ) : null },
  ];

  return (
    <div className="page-enter">
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
        <ShieldCheck size={20} style={{color:'var(--accent-warning)'}}/>
        <span style={{fontSize:'12px',color:'var(--accent-warning)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Admin View</span>
      </div>
      <PageHeader title="Manage Refill Requests" subtitle="Approve, reject or complete patient refill requests"/>
      <Card style={{marginBottom:'20px',padding:'14px 16px'}}>
        <Input placeholder="Search by medication or pharmacy…" icon={Search} value={search} onChange={e=>setSearch(e.target.value)}/>
      </Card>
      <Table columns={columns} data={filtered} loading={loading} emptyMessage="No refill requests"/>
    </div>
  );
}
