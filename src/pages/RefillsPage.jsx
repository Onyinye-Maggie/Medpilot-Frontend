import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { refillsAPI, medicationsAPI } from '../utils/api';
import { PageHeader, Button, Input, Textarea, Modal, Table, Badge, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './ResponsiveGrid.css';

const DEFAULT_FORM = {
  medication: '',
  pharmacyName: '',
  pharmacyAddress: '',
  pharmacyPhone: '',
  quantity: '',
  notes: '',
};

const STATUS_BADGE = {
  pending:   'warning',
  approved:  'success',
  completed: 'info',
  cancelled: 'danger',
};

export default function RefillsPage() {
  const [refills, setRefills] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.allSettled([
        refillsAPI.getAll(),
        medicationsAPI.getAll(),
      ]);
      if (rRes.status === 'fulfilled') {
        const list = rRes.value.data?.data?.data || rRes.value.data?.data || rRes.value.data || [];
        setRefills(Array.isArray(list) ? list : []);
      }
      if (mRes.status === 'fulfilled') {
        const list = mRes.value.data?.data?.data || mRes.value.data?.data || mRes.value.data || [];
        setMeds(Array.isArray(list) ? list : []);
      }
    } catch {
      toast.error('Failed to load refill requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeMeds = meds.filter(m => m.isActive !== false);
  const medOptions = activeMeds.map(m => ({
    value: m._id || m.id,
    label: `${m.name} — ${m.dosage} (${m.remainingQuantity ?? m.quantity} remaining)`,
  }));

  // Show meds that need refill prominently
  const medsNeedingRefill = activeMeds.filter(m =>
    m.remainingQuantity != null && m.remainingQuantity <= (m.refillThreshold || 7)
  );

  const filtered = refills.filter(r => {
    const q = search.toLowerCase();
    const name = r.medication?.name || '';
    const pharmacy = r.pharmacyName || '';
    return name.toLowerCase().includes(q) || pharmacy.toLowerCase().includes(q);
  });

  const validate = () => {
    const e = {};
    if (!form.medication)           e.medication = 'Please select a medication';
    if (!form.pharmacyName.trim())  e.pharmacyName = 'Pharmacy name is required';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = 'Valid quantity is required';
    return e;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // Payload matches Postman exactly
      const payload = {
        medication: form.medication,
        pharmacyName: form.pharmacyName.trim(),
        quantity: Number(form.quantity),
      };
      if (form.pharmacyAddress.trim()) payload.pharmacyAddress = form.pharmacyAddress.trim();
      if (form.pharmacyPhone.trim())   payload.pharmacyPhone = form.pharmacyPhone.trim();
      if (form.notes.trim())           payload.notes = form.notes.trim();

      await refillsAPI.create(payload);
      toast.success('Refill request submitted');
      setShowModal(false);
      fetchAll();
    } catch (err) {
      const data = err?.response?.data;
      console.log('[Refill Debug] Status:', err?.response?.status);
      console.log('[Refill Debug] Response:', JSON.stringify(data, null, 2));
      setDebugInfo({ status: err?.response?.status, payload, response: data });
      const msg = data?.message ||
        (Array.isArray(data?.errors) ? data.errors.map(e => e.message || e.msg).join(', ') : null) ||
        'Failed to submit refill request';
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (r) => {
    if (!window.confirm(`Cancel refill request for ${r.medication?.name || 'this medication'}?`)) return;
    try {
      await refillsAPI.cancel(r._id || r.id);
      toast.success('Refill request cancelled');
      fetchAll();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to cancel';
      toast.error(msg);
    }
  };

  const openCreate = (prefillMedId = '') => {
    setForm({ ...DEFAULT_FORM, medication: prefillMedId });
    setErrors({});
    setDebugInfo(null);
    setShowModal(true);
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
    { key: 'pharmacyName', label: 'Pharmacy', render: (v) => v || '—' },
    {
      key: 'quantity', label: 'Qty',
      render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v}</span>
    },
    {
      key: 'requestedAt', label: 'Requested',
      render: (v) => v ? format(parseISO(v), 'dd MMM yyyy') : '—'
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={STATUS_BADGE[v] || 'default'}>{v || 'pending'}</Badge>
    },
    {
      key: 'actions', label: '', width: '100px',
      render: (_, r) => r.status === 'pending' ? (
        <Button size="sm" variant="danger"
          onClick={(e) => { e.stopPropagation(); handleCancel(r); }}>
          Cancel
        </Button>
      ) : null
    },
  ];

  return (
    <div className="page-enter">
      <PageHeader
        title="Refill Requests"
        subtitle="Request and track your medication refills"
        actions={
          <Button icon={<Plus size={16} />} onClick={() => openCreate()}
            disabled={activeMeds.length === 0}>
            Request Refill
          </Button>
        }
      />

      {/* Alert for meds needing refill */}
      {!loading && medsNeedingRefill.length > 0 && (
        <Card style={{ marginBottom: '16px', padding: '14px 16px', borderColor: 'rgba(255,165,2,0.4)', background: 'rgba(255,165,2,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ color: 'var(--accent-warning)', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                {medsNeedingRefill.length} medication{medsNeedingRefill.length > 1 ? 's need' : ' needs'} refill
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {medsNeedingRefill.map(m => (
                  <button key={m._id || m.id}
                    onClick={() => openCreate(m._id || m.id)}
                    style={{ background: 'rgba(255,165,2,0.15)', border: '1px solid rgba(255,165,2,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--accent-warning)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    {m.name} ({m.remainingQuantity} left) →
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {!loading && activeMeds.length === 0 && (
        <Card style={{ marginBottom: '16px', padding: '16px', borderColor: 'rgba(255,165,2,0.3)', background: 'rgba(255,165,2,0.05)' }}>
          <p style={{ color: 'var(--accent-warning)', fontSize: '14px' }}>
            ⚠ You need to add medications first before requesting refills.
          </p>
        </Card>
      )}

      <Card style={{ marginBottom: '20px', padding: '14px 16px' }}>
        <Input placeholder="Search by medication or pharmacy…" icon={Search}
          value={search} onChange={e => setSearch(e.target.value)} />
      </Card>

      <Table columns={columns} data={filtered} loading={loading}
        emptyMessage="No refill requests yet." />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title="Request a Refill" size="md">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div className="form-field">
            <label className="form-label">Medication *</label>
            <div className={`input-wrap ${errors.medication ? 'input-wrap--error' : ''}`}>
              <select className="form-input form-select" value={form.medication}
                onChange={(e) => { setForm(p => ({ ...p, medication: e.target.value })); setErrors(p => ({ ...p, medication: '' })); }}>
                <option value="">Select medication…</option>
                {medOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {errors.medication && <span className="form-error">{errors.medication}</span>}
          </div>

          <Input label="Pharmacy Name *" placeholder="e.g. HealthPlus Pharmacy"
            value={form.pharmacyName} onChange={set('pharmacyName')} error={errors.pharmacyName} />

          <Input label="Pharmacy Address (optional)" placeholder="e.g. 123 Lagos Street, Abuja"
            value={form.pharmacyAddress} onChange={set('pharmacyAddress')} />

          <div className="grid-2">
            <Input label="Pharmacy Phone (optional)" placeholder="e.g. +2348012345678"
              value={form.pharmacyPhone} onChange={set('pharmacyPhone')} />
            <Input label="Quantity *" type="number" min="1" placeholder="e.g. 30"
              value={form.quantity} onChange={set('quantity')} error={errors.quantity} />
          </div>

          <Textarea label="Notes (optional)" placeholder="e.g. Running low on medication"
            value={form.notes} onChange={set('notes')} />

          {debugInfo && (
            <div style={{ background:'#0b1f2e', border:'1px solid rgba(255,71,87,0.3)', borderRadius:'8px', padding:'12px', fontSize:'11px', fontFamily:'monospace', color:'#e8f4f0' }}>
              <p style={{color:'#ff4757',fontWeight:700,marginBottom:'8px'}}>⚠ Server Error (status {debugInfo.status}):</p>
              <p style={{color:'#7a9bac',marginBottom:'4px'}}>Payload sent:</p>
              <pre style={{background:'#040d14',padding:'8px',borderRadius:'4px',overflow:'auto',marginBottom:'8px',fontSize:'10px'}}>{JSON.stringify(debugInfo.payload, null, 2)}</pre>
              <p style={{color:'#7a9bac',marginBottom:'4px'}}>Server said:</p>
              <pre style={{background:'#040d14',padding:'8px',borderRadius:'4px',overflow:'auto',fontSize:'10px'}}>{JSON.stringify(debugInfo.response, null, 2)}</pre>
            </div>
          )}
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
