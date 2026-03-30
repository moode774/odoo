import { useState, useEffect } from 'react';
import { saveConfig, ODOO_CONFIG, updateLiveConfig } from '../config/odoo';
import { testAdminConnection } from '../services/odooApi';
import { Settings, CheckCircle2, AlertCircle, Database, ShieldAlert, KeyRound, Server, Link as LinkIcon, Copy, Building2, UserCircle2, Loader2 } from 'lucide-react';

export default function AdminSetup() {
  const [mode, setMode] = useState('setup'); // 'setup' | 'dashboard'
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [copid, setCopied] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const [form, setForm] = useState({
    baseUrl:      ODOO_CONFIG.baseUrl || '/odoo', // default for proxy, or full URL
    db:           ODOO_CONFIG.db || '',
    serviceEmail: ODOO_CONFIG.serviceEmail || '',
    apiKey:       ODOO_CONFIG.apiKey || '',
  });

  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleConnect = async () => {
    if (!form.baseUrl || !form.db || !form.serviceEmail || !form.apiKey) {
      setError('يرجى تعبئة جميع الحقول بشكل صحيح');
      return;
    }
    setError('');
    setLoading(true);
    
    // 1. Clean input
    const cleanConfig = {
      baseUrl:      form.baseUrl.replace(/\/+$/, ''), // remove trailing slash
      db:           form.db.trim(),
      serviceEmail: form.serviceEmail.trim(),
      apiKey:       form.apiKey.trim(),
    };

    // 2. Temporarily apply settings live to test connection
    saveConfig(cleanConfig);
    updateLiveConfig();

    // 3. Test Odoo Connection via RPC
    try {
      const res = await testAdminConnection();
      setCompanyName(res.company);
      
      // 4. Generate Magic Link
      // We encode the config safely to base64
      const token = btoa(JSON.stringify(cleanConfig));
      const url = new URL(window.location.href);
      url.searchParams.set('token', token);
      setMagicLink(url.toString());
      
      setMode('dashboard');

    } catch (err) {
      setError(err.message || 'فشل الاتصال بـ Odoo. تأكد من البيانات.');
      // remove config on fail to avoid getting stuck
      localStorage.removeItem('odoo_tenant_config');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (mode === 'dashboard') {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ maxWidth: '600px', padding: '40px 32px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', background: '#d1fae5', padding: '16px', borderRadius: '50%', color: '#059669', marginBottom: '16px' }}>
              <CheckCircle2 size={40} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>متصل بنجاح!</h1>
            <p style={{ color: '#059669', fontSize: '0.9rem', marginTop: '6px', fontWeight: 'bold' }}>
              لقد تم ربط التطبيق مع Odoo بنجاح.
            </p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Building2 size={20} color="#64748b" />
              <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 600 }}>الشركة: {companyName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserCircle2 size={20} color="#64748b" />
              <span style={{ fontSize: '0.95rem', color: '#64748b' }}>حساب الخدمة: {form.serviceEmail}</span>
            </div>
          </div>

          <div className="field-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1e293b', fontWeight: 'bold' }}>
              <LinkIcon size={18} /> الرابط الذكي للموظفين (Magic Link)
            </label>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
              انسخ هذا الرابط وأرسله للموظفين. بمجرد ضغطهم عليه سيتم ضبط إعدادات شركاتكم في هواتفهم تلقائياً وسيدخلون لشاشة تسجيل الحضور الدخول مباشرة.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="text-input"
                type="text"
                readOnly
                value={magicLink}
                dir="ltr"
                style={{ flex: 1, color: '#0f172a', background: '#e2e8f0' }}
              />
              <button 
                onClick={copyToClipboard}
                style={{
                  background: copid ? '#10b981' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold',
                  transition: 'background 0.3s'
                }}
              >
                {copid ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                {copid ? 'تم النسخ!' : 'نسخ'}
              </button>
            </div>
          </div>

          <button 
            className="submit-btn" 
            style={{ '--btn-color': '#0f172a' }} 
            onClick={() => window.location.reload()}
          >
            إطلاق بوابة الموظفين وتجربتها
          </button>
        </div>
      </div>
    );
  }

  // ── SETTINGS MODE ──
  return (
    <div className="login-bg">
      <div className="login-card" style={{ maxWidth: '500px', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div className="logo-icon" style={{ background: '#0f172a', margin: '0 auto 16px' }}>
            <Settings size={32} strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>إعدادات النظام للآدمن</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '6px' }}>
            قم بربط التطبيق مع مساحة أودو (Odoo) الخاصة بشركتك.
          </p>
        </div>

        <div className="field-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Server size={14} /> رابط Odoo</label>
          <input className="text-input" type="text" placeholder="/odoo أو https://company.odoo.com" value={form.baseUrl} onChange={e => set('baseUrl', e.target.value)} dir="ltr" />
        </div>

        <div className="field-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14} /> الخادم (Database Name)</label>
          <input className="text-input" type="text" placeholder="my-company-test-123" value={form.db} onChange={e => set('db', e.target.value)} dir="ltr" />
        </div>

        <div className="field-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14} /> حساب الربط (Service Email)</label>
          <input className="text-input" type="email" placeholder="hr-service@company.com" value={form.serviceEmail} onChange={e => set('serviceEmail', e.target.value)} dir="ltr" />
        </div>

        <div className="field-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><KeyRound size={14} /> Password / API Key</label>
          <input className="text-input" type="password" placeholder="••••••••••••••••" value={form.apiKey} onChange={e => set('apiKey', e.target.value)} dir="ltr" />
        </div>

        {error && <div className="error-msg"><AlertCircle size={18} />{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
          <button className="submit-btn" style={{ '--btn-color': '#0f172a' }} onClick={handleConnect} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={24} /> : 'فحص الاتصال والربط'}
          </button>
          
          <button 
            style={{
              background: 'transparent', border: '1px dashed #9ca3af', color: '#6b7280',
              padding: '12px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600'
            }}
            onClick={() => {
              set('baseUrl', '/odoo');
              set('db', 'forestedge-staging-28935052');
              set('serviceEmail', 'mohammed.abdulsalam@af.sa');
              set('apiKey', '@sIIOTwrkAfr8ZjG');
            }}
          >
            تعبئة بيانات ForestEdge التجريبية للمُعاينة
          </button>
        </div>
      </div>
    </div>
  );
}
