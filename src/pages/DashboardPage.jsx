import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle, AlertTriangle, TrendingUp, Clock, RefreshCw, BarChart2 } from 'lucide-react';
import { dashboardAPI } from '../utils/api';
import { StatCard, Card, Badge, PageHeader } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import './DashboardPage.css';

const FREQ_LABEL = { once_daily:'Once daily', twice_daily:'Twice daily', three_times_daily:'3× daily', as_needed:'As needed' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [dash, setDash] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dRes, hRes] = await Promise.allSettled([
          dashboardAPI.get(),
          dashboardAPI.adherenceHistory(),
        ]);
        if (dRes.status === 'fulfilled') {
        // Response: { success, message, data: { overview, today, adherence, refills } }
        setDash(dRes.value.data?.data || dRes.value.data);
      }
        if (hRes.status === 'fulfilled') {
        // Response: { success, message, data: [...] }
        const hist = hRes.value.data?.data || [];
        setHistory(Array.isArray(hist) ? hist : []);
      }
      } catch {/* silent */}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = dash?.today;
  const adherence = dash?.adherence;
  const overview = dash?.overview;
  const todayDoses = today?.doses || [];
  const adherenceRate = adherence?.rate ?? 0;

  return (
    <div className="page-enter">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'} 👋`}
        subtitle={`Today is ${format(new Date(), 'EEEE, MMMM do yyyy')}`}
      />

      {/* ── Stats ── */}
      <div className="stats-grid">
        <StatCard title="Active Medications" value={loading ? null : (overview?.activeMedications ?? '—')}
          icon={Pill} color="primary" loading={loading} />
        <StatCard title="Today's Doses" value={loading ? null : (today?.total ?? '—')}
          icon={Clock} color="info" loading={loading} />
        <StatCard title="30-Day Adherence" value={loading ? null : `${adherenceRate}%`}
          icon={TrendingUp} color={adherenceRate >= 70 ? 'success' : 'warning'} loading={loading} />
        <StatCard title="Needs Refill" value={loading ? null : (overview?.medicationsNeedingRefill ?? '—')}
          icon={AlertTriangle} color="warning" loading={loading} />
      </div>

      <div className="dashboard-grid">
        {/* ── Today's Doses ── */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title"><Clock size={18}/>Today's Doses Overview</div>
            {today && <Badge variant={today.taken === today.total && today.total > 0 ? 'success' : 'info'}>
              {today.taken}/{today.total} taken
            </Badge>}
          </div>

          {loading ? (
            <div className="loading-list">{[1,2,3].map(i=>(
              <div key={i} className="appt-skeleton">
                <div className="skeleton skeleton--sm" style={{width:'40px',height:'40px',borderRadius:'8px'}}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                  <div className="skeleton skeleton--sm"/><div className="skeleton skeleton--xs"/>
                </div>
              </div>
            ))}</div>
          ) : todayDoses.length === 0 ? (
            <div className="empty-list"><Pill size={28}/><p>No doses scheduled for today</p></div>
          ) : (
            <div className="appt-list">
              {todayDoses.map((dose, i) => (
                <div key={i} className="appt-item">
                  <div className="appt-time">
                    <span className="appt-time__hour">{dose.scheduledTime ? format(new Date(dose.scheduledTime),'HH:mm') : '—'}</span>
                    <span className="appt-time__date">{dose.medication?.name?.slice(0,6) || 'Dose'}</span>
                  </div>
                  <div className="appt-details">
                    <p className="appt-patient">{dose.medication?.name || 'Medication'}</p>
                    <p className="appt-reason">{dose.medication?.dosage || ''}</p>
                  </div>
                  <Badge variant={dose.status==='taken' ? 'success' : dose.status==='missed' ? 'danger' : 'warning'}>
                    {dose.status || 'pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Today progress bar */}
          {today && today.total > 0 && (
            <div style={{marginTop:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--text-muted)',marginBottom:'6px'}}>
                <span>Progress</span><span>{today.taken} of {today.total} doses taken</span>
              </div>
              <div style={{height:'6px',background:'var(--bg-secondary)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',background:'var(--accent-primary)',borderRadius:'3px',width:`${today.total ? (today.taken/today.total*100) : 0}%`,transition:'width 0.5s ease'}}/>
              </div>
            </div>
          )}
        </Card>

        {/* ── 30-Day Adherence ── */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title"><TrendingUp size={18}/>30-Day Adherence Rate</div>
          </div>

          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="skeleton skeleton--lg"/><div className="skeleton skeleton--sm"/>
            </div>
          ) : (
            <>
              {/* Big rate circle */}
              <div className="adherence-circle">
                <svg viewBox="0 0 100 100" className="adherence-svg">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-secondary)" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={adherenceRate >= 70 ? 'var(--accent-success)' : adherenceRate >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2.64 * adherenceRate} 264`}
                    transform="rotate(-90 50 50)"/>
                </svg>
                <div className="adherence-value">{adherenceRate}%</div>
              </div>

              {/* Last 30 days breakdown */}
              {adherence?.last30Days && (
                <div className="adherence-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-dot" style={{background:'var(--accent-success)'}}/>
                    <span>Taken</span>
                    <span className="breakdown-val">{adherence.last30Days.taken || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-dot" style={{background:'var(--accent-danger)'}}/>
                    <span>Missed</span>
                    <span className="breakdown-val">{adherence.last30Days.missed || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-dot" style={{background:'var(--accent-warning)'}}/>
                    <span>Skipped</span>
                    <span className="breakdown-val">{adherence.last30Days.skipped || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-dot" style={{background:'var(--text-muted)'}}/>
                    <span>Total logged</span>
                    <span className="breakdown-val">{adherence.last30Days.total || 0}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ── Refill Alerts ── */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title"><RefreshCw size={18}/>Medications Needing Refill</div>
            {dash?.refills && <Badge variant="warning">{dash.refills.pendingRequests || 0} pending</Badge>}
          </div>

          {loading ? (
            <div className="loading-list">{[1,2].map(i=>(
              <div key={i} style={{display:'flex',gap:'12px',alignItems:'center'}}>
                <div className="skeleton skeleton--sm" style={{width:'40px',height:'40px',borderRadius:'8px'}}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                  <div className="skeleton skeleton--sm"/><div className="skeleton skeleton--xs"/>
                </div>
              </div>
            ))}</div>
          ) : !dash?.refills?.medicationsLow?.length ? (
            <div className="empty-list" style={{padding:'24px 0'}}>
              <CheckCircle size={28} style={{color:'var(--accent-success)'}}/>
              <p style={{color:'var(--text-secondary)'}}>All medications have sufficient stock</p>
            </div>
          ) : (
            <div className="appt-list">
              {dash.refills.medicationsLow.map((med, i) => (
                <div key={i} className="appt-item">
                  <div className="appt-time">
                    <span className="appt-time__hour" style={{fontSize:'11px'}}>{med.remainingQuantity}</span>
                    <span className="appt-time__date">left</span>
                  </div>
                  <div className="appt-details">
                    <p className="appt-patient">{med.name}</p>
                    <p className="appt-reason">Threshold: {med.refillThreshold}</p>
                  </div>
                  {med.needsRefill && <Badge variant="danger">Urgent</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Day-by-day Adherence History ── */}
        <Card className="dashboard-card">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title"><BarChart2 size={18}/>Day-by-Day Adherence History</div>
          </div>

          {loading ? (
            <div style={{display:'flex',gap:'4px',alignItems:'flex-end',height:'80px'}}>
              {[1,2,3,4,5].map(i=>(
                <div key={i} className="skeleton" style={{flex:1,height:`${30+i*10}px`}}/>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="empty-list" style={{padding:'24px 0'}}>
              <BarChart2 size={28}/><p>No adherence history yet</p>
            </div>
          ) : (
            <div className="history-chart">
              {history.slice(-14).map((day, i) => {
                const total = (day.taken || 0) + (day.missed || 0) + (day.skipped || 0);
                const pct = total > 0 ? Math.round((day.taken / total) * 100) : 0;
                return (
                  <div key={i} className="history-bar-wrap" title={`${day._id}: ${pct}% adherence`}>
                    <div className="history-bar">
                      <div className="history-bar__fill" style={{
                        height: `${pct}%`,
                        background: pct >= 70 ? 'var(--accent-success)' : pct >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                      }}/>
                    </div>
                    <span className="history-bar__label">{day._id ? format(new Date(day._id), 'dd') : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
