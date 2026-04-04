import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Droplets, AlertTriangle, FileText, Pill, Calendar } from 'lucide-react';
import { patientsAPI, recordsAPI, prescriptionsAPI, appointmentsAPI } from '../utils/api';
import { Button, Card, Badge, Spinner, EmptyState } from '../components/UI';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './PatientDetailPage.css';

const TABS = ['Overview', 'Records', 'Prescriptions', 'Appointments'];

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, rRes, prRes, aRes] = await Promise.allSettled([
          patientsAPI.getById(id),
          recordsAPI.getByPatient(id),
          prescriptionsAPI.getByPatient(id),
          appointmentsAPI.getAll({ patient: id }),
        ]);
        if (pRes.status === 'fulfilled') setPatient(pRes.value.data?.patient || pRes.value.data);
        if (rRes.status === 'fulfilled') setRecords(rRes.value.data?.records || rRes.value.data || []);
        if (prRes.status === 'fulfilled') setPrescriptions(prRes.value.data?.prescriptions || prRes.value.data || []);
        if (aRes.status === 'fulfilled') setAppointments(aRes.value.data?.appointments || aRes.value.data || []);
      } catch {
        toast.error('Failed to load patient');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'50vh'}}>
      <Spinner size={40} />
    </div>
  );

  if (!patient) return (
    <EmptyState icon={User} title="Patient not found"
      description="This patient record does not exist or was removed."
      action={<Button onClick={() => navigate('/patients')}>Back to Patients</Button>}
    />
  );

  const fullName = patient.firstName && patient.lastName
    ? `${patient.firstName} ${patient.lastName}` : patient.name || 'Unknown';

  return (
    <div className="page-enter">
      <div className="detail-header">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/patients')}>
          Back
        </Button>
      </div>

      {/* Patient Hero */}
      <Card className="patient-hero">
        <div className="hero-left">
          <div className="hero-avatar">{fullName[0].toUpperCase()}</div>
          <div>
            <h1 className="hero-name">{fullName}</h1>
            <p className="hero-id">Patient ID: {(patient._id || patient.id || '').slice(-8).toUpperCase()}</p>
            <div style={{display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap'}}>
              {patient.gender && <Badge variant="info">{patient.gender}</Badge>}
              {patient.bloodGroup && <Badge variant="danger">Blood: {patient.bloodGroup}</Badge>}
              {patient.dateOfBirth && (
                <Badge variant="default">
                  {Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))} yrs
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="hero-right">
          {patient.email && (
            <div className="hero-contact">
              <Mail size={14} /> <span>{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="hero-contact">
              <Phone size={14} /> <span>{patient.phone}</span>
            </div>
          )}
          {patient.address && (
            <div className="hero-contact">
              <MapPin size={14} /> <span>{patient.address}</span>
            </div>
          )}
          {patient.allergies && (
            <div className="hero-contact hero-contact--warn">
              <AlertTriangle size={14} /> <span>Allergies: {patient.allergies}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="detail-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`detail-tab ${activeTab === tab ? 'detail-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Records' && <span className="tab-count">{records.length}</span>}
            {tab === 'Prescriptions' && <span className="tab-count">{prescriptions.length}</span>}
            {tab === 'Appointments' && <span className="tab-count">{appointments.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="overview-grid">
          <Card>
            <h3 className="section-title"><User size={16}/> Personal Info</h3>
            <div className="info-list">
              <InfoRow label="Full Name" value={fullName} />
              <InfoRow label="Date of Birth" value={patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd MMMM yyyy') : '—'} />
              <InfoRow label="Gender" value={patient.gender || '—'} />
              <InfoRow label="Blood Group" value={patient.bloodGroup || '—'} />
              <InfoRow label="Emergency Contact" value={patient.emergencyContact || '—'} />
            </div>
          </Card>
          <Card>
            <h3 className="section-title"><AlertTriangle size={16}/> Medical Alerts</h3>
            <div className="info-list">
              <InfoRow label="Allergies" value={patient.allergies || 'None reported'} />
              <InfoRow label="Total Records" value={records.length} />
              <InfoRow label="Active Prescriptions" value={prescriptions.filter(p=>p.status==='active').length} />
              <InfoRow label="Appointments" value={appointments.length} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Records' && (
        records.length === 0
          ? <EmptyState icon={FileText} title="No medical records" description="No records have been created for this patient yet." />
          : <div className="records-list">
            {records.map(r => (
              <Card key={r._id || r.id} className="record-card">
                <div className="record-header">
                  <div>
                    <p className="record-type">{r.type || r.title || 'Medical Record'}</p>
                    <p className="record-date">{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—'}</p>
                  </div>
                  <Badge variant={r.status === 'reviewed' ? 'success' : 'warning'}>{r.status || 'pending'}</Badge>
                </div>
                {r.notes && <p className="record-notes">{r.notes}</p>}
                {r.diagnosis && <p className="record-diagnosis"><b>Diagnosis:</b> {r.diagnosis}</p>}
              </Card>
            ))}
          </div>
      )}

      {activeTab === 'Prescriptions' && (
        prescriptions.length === 0
          ? <EmptyState icon={Pill} title="No prescriptions" description="No prescriptions have been issued for this patient." />
          : <div className="records-list">
            {prescriptions.map(p => (
              <Card key={p._id || p.id} className="record-card">
                <div className="record-header">
                  <div>
                    <p className="record-type">{p.medication || p.name || 'Prescription'}</p>
                    <p className="record-date">
                      {p.startDate ? format(new Date(p.startDate), 'dd MMM yyyy') : '—'}
                      {p.endDate ? ` → ${format(new Date(p.endDate), 'dd MMM yyyy')}` : ''}
                    </p>
                  </div>
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status || 'unknown'}</Badge>
                </div>
                {p.dosage && <p className="record-notes">Dosage: {p.dosage}</p>}
                {p.instructions && <p className="record-notes">{p.instructions}</p>}
              </Card>
            ))}
          </div>
      )}

      {activeTab === 'Appointments' && (
        appointments.length === 0
          ? <EmptyState icon={Calendar} title="No appointments" description="No appointments scheduled for this patient." />
          : <div className="records-list">
            {appointments.map(a => (
              <Card key={a._id || a.id} className="record-card">
                <div className="record-header">
                  <div>
                    <p className="record-type">{a.reason || a.type || 'Appointment'}</p>
                    <p className="record-date">{a.date ? format(new Date(a.date), 'dd MMM yyyy HH:mm') : '—'}</p>
                  </div>
                  <Badge variant={a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'info'}>
                    {a.status || 'scheduled'}
                  </Badge>
                </div>
                {a.notes && <p className="record-notes">{a.notes}</p>}
              </Card>
            ))}
          </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
);
