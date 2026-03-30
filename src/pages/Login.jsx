import { useState } from 'react';
import { loginEmployee } from '../services/odooApi';
import { Trees, Delete, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function Login({ onLogin }) {
  const [empCode, setEmpCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinPress = (digit) => {
    if (pin.length < 4) setPin(p => p + digit);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleLogin = async () => {
    if (!empCode.trim()) { setError('أدخل رقم الموظف'); return; }
    if (pin.length < 4) { setError('أدخل PIN مكون من 4 أرقام'); return; }
    setError('');
    setLoading(true);
    try {
      const emp = await loginEmployee(empCode.trim(), pin);
      onLogin(emp);
    } catch (e) {
      setError(e.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <Trees size={32} strokeWidth={2.5} />
          </div>
          <h1>ForestEdge</h1>
          <p>بوابة الموظفين</p>
        </div>

        {/* Employee Code */}
        <div className="emp-input-wrap">
          <label>رقم الموظف</label>
          <input
            className="emp-id-input"
            type="text"
            inputMode="numeric"
            placeholder="0000"
            value={empCode}
            onChange={e => setEmpCode(e.target.value)}
            dir="ltr"
          />
        </div>

        {/* PIN display */}
        <div className="pin-section">
          <div className="pin-label">رمز PIN</div>
          <div className="pin-dots">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div className="numpad">
          {[1,2,3,4,5,6,7,8,9,'','0','del'].map((d, i) => (
            <button
              key={i}
              className={`num-btn ${d === '' ? 'empty' : ''}`}
              onClick={() => {
                if (d === 'del') handleDelete();
                else if (d !== '') handlePinPress(String(d));
              }}
              disabled={loading || d === ''}
            >
              {d === 'del' ? <Delete size={24} strokeWidth={2} /> : d}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-msg">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={24} className="spinner" />
          ) : (
            <>
              تسجيل الدخول
              <ArrowLeft size={20} strokeWidth={2.5} />
            </>
          )}
        </button>

        {/* Small reset button to revert to Admin Setup if needed */}
        <button
          style={{
            background: 'none', border: 'none', color: '#9ca3af',
            fontSize: '0.8rem', cursor: 'pointer', marginTop: '16px',
            textDecoration: 'underline'
          }}
          onClick={() => {
            localStorage.removeItem('odoo_tenant_config');
            window.location.reload();
          }}
        >
           إعادة ضبط إعدادات الشركة 
        </button>
      </div>
    </div>
  );
}
