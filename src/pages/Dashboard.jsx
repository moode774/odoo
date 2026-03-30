import { useState, useEffect, useCallback } from 'react';
import { getEmployeeLeaves, getEmployeeTasks } from '../services/odooApi';
import LeaveRequest    from './LeaveRequest';
import AbsenceRequest  from './AbsenceRequest';
import TravelRequest   from './TravelRequest';
import MessageRequest  from './MessageRequest';
import { 
  Sun, Sunrise, Moon, CheckCircle2, AlertTriangle, Inbox, CalendarDays, Edit3, 
  Building2, Briefcase, Factory, MapPin, UserCheck, GraduationCap, Clock, Globe2, Ruler, 
  Mail, Phone, Smartphone, Cake, User, Heart, Users, School, Contact,
  FileText, Plane, Compass, CalendarCheck, FileStack, Lock, ShieldAlert,
  LogOut, RefreshCw, Palmtree, Timer, MessageSquare, ListTodo, Home, LayoutDashboard
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────── */
const stateLabel = {
  draft: 'مسودة', confirm: 'بانتظار الموافقة',
  validate1: 'موافقة جزئية', validate: 'مقبولة', refuse: 'مرفوضة',
};
const stateColor = {
  draft: 'muted', confirm: 'warn', validate1: 'info',
  validate: 'success', refuse: 'danger',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'صباح الخير', icon: <Sunrise size={16} /> };
  if (h < 17) return { text: 'مساء الخير', icon: <Sun size={16} /> };
  return { text: 'مساء النور', icon: <Moon size={16} /> };
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' });
}

/* ── skeleton ───────────────────────────────────────────── */
function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton-wrap">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk-block sk-long" />
          <div className="sk-block sk-short" />
          <div className="sk-block sk-badge" />
        </div>
      ))}
    </div>
  );
}

/* ── toast ─────────────────────────────────────────────── */
function Toast({ msg, type = 'success', onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
      {msg}
    </div>
  );
}

/* ── stat card ─────────────────────────────────────────── */
function StatCard({ value, label, color }) {
  return (
    <div className="stat-card" style={{ '--sc': color }}>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VIEWS
══════════════════════════════════════════════════════════ */
const VIEWS = { HOME:'home', LEAVE:'leave', ABSENCE:'absence', TRAVEL:'travel', MESSAGE:'message' };
const TABS  = { HOME:'home', HISTORY:'history', PROFILE:'profile' };

/* ── History tab ─────────────────────────────────────────── */
function HistoryTab({ leaves, loading, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const filters = [
    { id:'all',      label:'الكل' },
    { id:'confirm',  label:'معلقة' },
    { id:'validate', label:'مقبولة' },
    { id:'refuse',   label:'مرفوضة' },
  ];
  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.state === filter);

  return (
    <div className="tab-content">
      <div className="filter-pills">
        {filters.map(f => (
          <button key={f.id} className={`fpill ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}>{f.label}
            {f.id !== 'all' && <span className="fpill-count">
              {leaves.filter(l => l.state === f.id).length}
            </span>}
          </button>
        ))}
      </div>

      {/* <button className="refresh-btn" onClick={onRefresh}><RefreshCw size={14}/> تحديث</button> */}

      {loading ? <Skeleton lines={4} /> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Inbox size={48} strokeWidth={1.5} /></div>
          <div className="empty-text">لا توجد طلبات في هذه الفئة</div>
        </div>
      ) : (
        <div className="history-list">
          {filtered.map(l => (
            <div key={l.id} className={`history-item border-${stateColor[l.state] || 'muted'}`}>
              <div className="hi-top">
                <span className="hi-type">{l.holiday_status_id?.[1] || 'إجازة'}</span>
                <span className={`badge badge-${stateColor[l.state] || 'muted'}`}>
                  {stateLabel[l.state] || l.state}
                </span>
              </div>
              <div className="hi-dates">
                <CalendarDays size={14} /> {formatDate(l.date_from)} — {formatDate(l.date_to)}
              </div>
              {l.name && <div className="hi-note"><Edit3 size={14} /> {l.name}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Profile tab ─────────────────────────────────────────── */
function InfoRow({ icon, label, value }) {
  if (!value || value === false || value === '—') return null;
  return (
    <div className="info-row">
      <div className="info-icon">{icon}</div>
      <div className="info-content">
        <div className="info-label">{label}</div>
        <div className="info-val">{value}</div>
      </div>
    </div>
  );
}

function InfoSection({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="info-section">
      <button className={`info-section-hdr ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="hdr-title"><span className="hdr-icon">{icon}</span> {title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      {open && <div className="info-section-body">{children}</div>}
    </div>
  );
}

const genderMap  = { male:'ذكر', female:'أنثى', other:'آخر' };
const maritalMap = { single:'أعزب', married:'متزوج', widower:'أرمل', divorced:'مطلق' };

function ProfileTab({ employee, onLogout }) {
  const e = employee;
  const val = (v) => {
    if (!v || v === false) return null;
    if (Array.isArray(v)) return v[1] || null;
    return String(v);
  };

  return (
    <div className="tab-content profile-tab">

      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar">
          {e.image_128
            ? <img src={`data:image/png;base64,${e.image_128}`} alt="" />
            : <span>{e.name?.[0] || '؟'}</span>}
        </div>
        <div className="profile-name">{e.name}</div>
        <div className="profile-title">{val(e.job_title) || val(e.department_id) || 'موظف'}</div>
        {e.barcode && <div className="profile-badge"><Contact size={14}/> #{e.barcode}</div>}
      </div>

      {/* Work Info */}
      <InfoSection title="بيانات وظيفية" icon={<Briefcase size={18} />}>
        <InfoRow icon={<Building2 size={16}/>} label="القسم"           value={val(e.department_id)} />
        <InfoRow icon={<Briefcase size={16}/>} label="المسمى الوظيفي"  value={val(e.job_title)} />
        <InfoRow icon={<Factory size={16}/>} label="الشركة"          value={val(e.company_id)} />
        <InfoRow icon={<MapPin size={16}/>} label="مكان العمل"      value={val(e.work_location_id)} />
        <InfoRow icon={<UserCheck size={16}/>} label="المدير"          value={val(e.parent_id)} />
        <InfoRow icon={<GraduationCap size={16}/>} label="المدرب"          value={val(e.coach_id)} />
        <InfoRow icon={<Clock size={16}/>} label="ساعات العمل"    value={val(e.resource_calendar_id)} />
        <InfoRow icon={<Globe2 size={16}/>} label="المنطقة الزمنية" value={val(e.tz)} />
        <InfoRow icon={<Ruler size={16}/>} label="مسافة المنزل-العمل" value={e.km_home_work ? `${e.km_home_work} كم` : null} />
      </InfoSection>

      {/* Contact */}
      <InfoSection title="بيانات التواصل" icon={<Phone size={18} />}>
        <InfoRow icon={<Mail size={16}/>} label="البريد الإلكتروني" value={val(e.work_email)} />
        <InfoRow icon={<Phone size={16}/>} label="هاتف العمل"        value={val(e.work_phone)} />
        <InfoRow icon={<Smartphone size={16}/>} label="الجوال"            value={val(e.mobile_phone)} />
      </InfoSection>

      {/* Personal */}
      <InfoSection title="بيانات شخصية" icon={<User size={18} />}>
        <InfoRow icon={<Cake size={16}/>} label="تاريخ الميلاد"   value={val(e.birthday)} />
        <InfoRow icon={<User size={16}/>}  label="الجنس"           value={genderMap[e.gender] || val(e.gender)} />
        <InfoRow icon={<Heart size={16}/>} label="الحالة الاجتماعية" value={maritalMap[e.marital] || val(e.marital)} />
        <InfoRow icon={<Users size={16}/>} label="عدد الأبناء"   value={e.children > 0 ? String(e.children) : null} />
        <InfoRow icon={<GraduationCap size={16}/>} label="مجال الدراسة"    value={val(e.study_field)} />
        <InfoRow icon={<School size={16}/>} label="المدرسة/الجامعة" value={val(e.study_school)} />
      </InfoSection>

      {/* Documents */}
      <InfoSection title="الوثائق والهوية" icon={<FileText size={18} />}>
        <InfoRow icon={<Contact size={16}/>} label="رقم الهوية"          value={val(e.identification_id)} />
        <InfoRow icon={<Compass size={16}/>} label="رقم جواز السفر"      value={val(e.passport_id)} />
        <InfoRow icon={<FileStack size={16}/>} label="رقم الإقامة/التأشيرة" value={val(e.visa_no)} />
        <InfoRow icon={<CalendarCheck size={16}/>} label="انتهاء التأشيرة"     value={val(e.visa_expire)} />
        <InfoRow icon={<FileText size={16}/>} label="تصريح العمل"         value={val(e.permit_no)} />
        <InfoRow icon={<CalendarDays size={16}/>} label="انتهاء تصريح العمل"  value={val(e.work_permit_expiration_date)} />
        <InfoRow icon={<Lock size={16}/>} label="رقم الضمان الاجتماعي" value={val(e.ssnid)} />
      </InfoSection>

      {/* Emergency */}
      <InfoSection title="جهة اتصال طوارئ" icon={<ShieldAlert size={18} />}>
        <InfoRow icon={<User size={16}/>} label="الاسم"   value={val(e.emergency_contact)} />
        <InfoRow icon={<Phone size={16}/>} label="الهاتف"  value={val(e.emergency_phone)} />
      </InfoSection>

      {/* Logout */}
      <button className="logout-full-btn" onClick={onLogout}>
        <LogOut size={18} /> تسجيل الخروج
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function Dashboard({ employee, onLogout }) {
  const [view,   setView]   = useState(VIEWS.HOME);
  const [tab,    setTab]    = useState(TABS.HOME);
  const [leaves, setLeaves] = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,  setToast]  = useState(null);  // { msg, type }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, t] = await Promise.allSettled([
        getEmployeeLeaves(employee.id),
        getEmployeeTasks(employee.id),
      ]);
      if (l.status === 'fulfilled') setLeaves(l.value || []);
      if (t.status === 'fulfilled') setTasks(t.value  || []);
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSuccess = (msg) => {
    setView(VIEWS.HOME);
    loadData();
    setToast({ msg, type: 'success' });
  };
  const goBack = () => setView(VIEWS.HOME);

  /* ── Sub-pages ── */
  if (view === VIEWS.LEAVE)   return <LeaveRequest   employee={employee} onSuccess={handleSuccess} onBack={goBack}/>;
  if (view === VIEWS.ABSENCE) return <AbsenceRequest employee={employee} onSuccess={handleSuccess} onBack={goBack}/>;
  if (view === VIEWS.TRAVEL)  return <TravelRequest  employee={employee} onSuccess={handleSuccess} onBack={goBack}/>;
  if (view === VIEWS.MESSAGE) return <MessageRequest employee={employee} onSuccess={handleSuccess} onBack={goBack}/>;

  /* ── Stats ── */
  const pending  = leaves.filter(l => l.state === 'confirm').length;
  const approved = leaves.filter(l => l.state === 'validate').length;
  const total    = leaves.length;

  const actions = [
    { id:VIEWS.LEAVE,   icon:<Palmtree size={28} strokeWidth={1.5} />, label:'إجازة سنوية',    color:'#10b981', pending: leaves.filter(l=>l.state==='confirm' && l.holiday_status_id?.[1]?.includes('سنوي')).length },
    { id:VIEWS.ABSENCE, icon:<Timer size={28} strokeWidth={1.5} />, label:'غياب / تأخر',    color:'#f59e0b', pending:0 },
    { id:VIEWS.TRAVEL,  icon:<Plane size={28} strokeWidth={1.5} />, label:'سفر / مأمورية',  color:'#2563eb', pending:0 },
    { id:VIEWS.MESSAGE, icon:<MessageSquare size={28} strokeWidth={1.5} />, label:'رسالة للإدارة',  color:'#8b5cf6', pending:0 },
  ];

  const greet = greeting();

  return (
    <div className="dash-wrap">

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <header className="dash-header">
        <div className="dash-user">
          <div className="avatar">
            {employee.image_128
              ? <img src={`data:image/png;base64,${employee.image_128}`} alt="" />
              : <span>{employee.name?.[0] || '؟'}</span>}
          </div>
          <div>
            <div className="dash-greeting">{greet.text} {greet.icon}</div>
            <div className="dash-name">{employee.name}</div>
          </div>
        </div>
        <button className="icon-btn" onClick={loadData} title="تحديث">
          <RefreshCw size={20} className={loading ? "spinner dark" : ""} />
        </button>
      </header>

      {/* ── HOME TAB ── */}
      {tab === TABS.HOME && (
        <>
          {/* Stats */}
          <div className="stats-row">
            <StatCard value={total}    label="إجمالي الطلبات"   color="#6b7280" />
            <StatCard value={pending}  label="بانتظار الموافقة" color="#f59e0b" />
            <StatCard value={approved} label="مقبولة"           color="#10b981" />
          </div>

          {/* Actions */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">الطلبات الرئيسية</h2>
            </div>
            <div className="actions-grid">
              {actions.map(a => (
                <button key={a.id} className="action-card" style={{'--card-color':a.color}}
                  onClick={() => setView(a.id)}>
                  <span className="action-icon">{a.icon}</span>
                  <span className="action-label">{a.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">آخر الطلبات</h2>
              {leaves.length > 3 && (
                <button className="see-all" onClick={() => setTab(TABS.HISTORY)}>
                  عرض الكل
                </button>
              )}
            </div>
            {loading ? <Skeleton lines={3} /> : leaves.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ListTodo size={40} strokeWidth={1.5} /></div>
                <div className="empty-text">لا توجد طلبات بعد</div>
                <div className="empty-sub">اضغط على أحد الطلبات أعلاه للبدء</div>
              </div>
            ) : (
              <div className="table-wrap">
                {leaves.slice(0, 4).map(l => (
                  <div key={l.id} className="table-row" onClick={() => setTab(TABS.HISTORY)}>
                    <span className="row-name">{l.holiday_status_id?.[1] || 'إجازة'}</span>
                    <span className="row-date">{formatDate(l.date_from)}</span>
                    <span className={`badge badge-${stateColor[l.state] || 'muted'}`}>
                      {stateLabel[l.state] || l.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          {tasks.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">بعض المهام</h2>
                <span className="count-badge">{tasks.length}</span>
              </div>
              <div className="table-wrap">
                {tasks.slice(0, 4).map(t => (
                  <div key={t.id} className="table-row">
                    <span className="row-name">{t.name}</span>
                    <span className="row-date">{formatDate(t.date_deadline)}</span>
                    <span className="badge badge-info">{t.stage_id?.[1] || '—'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === TABS.HISTORY && (
        <HistoryTab leaves={leaves} loading={loading} onRefresh={loadData} />
      )}

      {/* ── PROFILE TAB ── */}
      {tab === TABS.PROFILE && (
        <ProfileTab employee={employee} onLogout={onLogout} />
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {[
          { id:TABS.HOME,    icon:<LayoutDashboard size={22}/>, label:'الرئيسية' },
          { id:TABS.HISTORY, icon:<ListTodo size={22}/>, label:'طلباتي',  badge: pending },
          { id:TABS.PROFILE, icon:<User size={22}/>, label:'ملفي' },
        ].map(n => (
          <button key={n.id} className={`nav-item ${tab===n.id?'active':''}`}
            onClick={() => setTab(n.id)}>
            <span className="nav-icon">
              {n.icon}
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
