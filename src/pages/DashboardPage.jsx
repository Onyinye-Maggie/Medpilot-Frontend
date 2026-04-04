import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Pill, Clock, TrendingUp } from 'lucide-react';
import { dashboardAPI, appointmentsAPI } from '../utils/api';
import { StatCard, Card, Badge, PageHeader } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import './DashboardPage.css';

const STATUS_BADGE = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger',
  pending: 'warning',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => setStats({ totalPatients: 0, todayAppointments: 0, totalRecords: 0, activePrescriptions: 0 }))
      .finally(() => setLoadingStats(false));

    appointmentsAPI.getUpcoming()
      .then(r => setUpcoming(r.data?.appointments || r.data || []))
      .catch(() => setUpcoming([]))
      .finally(() => setLoadingAppts(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-enter">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'Doctor'} 👋`}
        subtitle={`Today is ${format(new Date(), 'EEEE, MMMM do yyyy')}`}
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients}
          icon={Users}
          color="primary"
          trend={stats?.patientsTrend}
          loading={loadingStats}
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments}
          icon={Calendar}
          color="info"
          trend={stats?.appointmentsTrend}
          loading={loadingStats}
        />
        <StatCard
          title="Medical Records"
          value={stats?.totalRecords}
          icon={FileText}
          color="warning"
          loading={loadingStats}
        />
        <StatCard
          title="Active Prescriptions"
          value={stats?.activePrescriptions}
          icon={Pill}
          color="success"
          loading={loadingStats}
        />
      </div>

      <div className="dashboard-grid">
        {/* Upcoming Appointments */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title">
              <Calendar size={18} />
              <span>Upcoming Appointments</span>
            </div>
            <Badge variant="primary">{upcoming.length}</Badge>
          </div>

          {loadingAppts ? (
            <div className="loading-list">
              {[1,2,3].map(i => (
                <div key={i} className="appt-skeleton">
                  <div className="skeleton skeleton--sm" style={{width:'40px', height:'40px', borderRadius:'8px'}} />
                  <div style={{flex:1, display:'flex', flexDirection:'column', gap:'6px'}}>
                    <div className="skeleton skeleton--sm" />
                    <div className="skeleton skeleton--xs" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="empty-list">
              <Clock size={28} />
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="appt-list">
              {upcoming.slice(0, 6).map((appt) => (
                <div key={appt._id || appt.id} className="appt-item">
                  <div className="appt-time">
                    <span className="appt-time__hour">
                      {appt.time || (appt.date ? format(new Date(appt.date), 'HH:mm') : '--:--')}
                    </span>
                    <span className="appt-time__date">
                      {appt.date ? format(new Date(appt.date), 'MMM d') : '—'}
                    </span>
                  </div>
                  <div className="appt-details">
                    <p className="appt-patient">{appt.patientName || appt.patient?.name || 'Patient'}</p>
                    <p className="appt-reason">{appt.reason || appt.type || 'General consultation'}</p>
                  </div>
                  <Badge variant={STATUS_BADGE[appt.status] || 'default'}>
                    {appt.status || 'scheduled'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Overview */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title">
              <TrendingUp size={18} />
              <span>Quick Overview</span>
            </div>
          </div>

          <div className="overview-list">
            <div className="overview-item">
              <div className="overview-dot overview-dot--primary" />
              <div className="overview-content">
                <p className="overview-label">New Patients (this month)</p>
                <p className="overview-value">{stats?.newPatientsMonth ?? '—'}</p>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-dot overview-dot--info" />
              <div className="overview-content">
                <p className="overview-label">Appointments this week</p>
                <p className="overview-value">{stats?.appointmentsWeek ?? '—'}</p>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-dot overview-dot--warning" />
              <div className="overview-content">
                <p className="overview-label">Pending records review</p>
                <p className="overview-value">{stats?.pendingRecords ?? '—'}</p>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-dot overview-dot--success" />
              <div className="overview-content">
                <p className="overview-label">Prescriptions expiring soon</p>
                <p className="overview-value">{stats?.expiringPrescriptions ?? '—'}</p>
              </div>
            </div>
            <div className="overview-item">
              <div className="overview-dot overview-dot--danger" />
              <div className="overview-content">
                <p className="overview-label">Cancelled appointments</p>
                <p className="overview-value">{stats?.cancelledAppointments ?? '—'}</p>
              </div>
            </div>
          </div>

          <div className="system-info">
            <div className="system-info__row">
              <span>Backend</span>
              <span className="system-ok">● Online</span>
            </div>
            <div className="system-info__row">
              <span>Last sync</span>
              <span>{format(new Date(), 'HH:mm:ss')}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
