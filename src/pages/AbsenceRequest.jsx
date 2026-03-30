import { useState } from 'react';
import { submitAbsenceRequest } from '../services/odooApi';
import FormPage from '../components/FormPage';
import { Timer, AlertCircle, Loader2 } from 'lucide-react';

const TYPES = ['غياب', 'تأخر', 'انصراف مبكر'];

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

export default function AbsenceRequest({ employee, onSuccess, onBack }) {
  const [form, setForm] = useState({ type: TYPES[0], date: today, reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.date) { setError('يرجى تحديد التاريخ'); return; }
    if (!form.reason.trim()) { setError('يرجى كتابة السبب'); return; }
    setError('');
    setLoading(true);
    try {
      await submitAbsenceRequest({
        employeeId: employee.id,
        date: form.date,
        type: form.type,
        reason: form.reason,
      });
      onSuccess(`تم إرسال طلب ${form.type} بنجاح`);
    } catch (e) {
      setError(e.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage title="إشعار غياب / تأخر" icon={<Timer size={24} strokeWidth={2} />} color="#f59e0b" onBack={onBack}>
      <div className="field-group">
        <label>النوع *</label>
        <div className="type-pills">
          {TYPES.map(t => (
            <button
              key={t}
              className={`pill ${form.type === t ? 'active' : ''}`}
              style={{ '--pill-color': '#f59e0b' }}
              onClick={() => set('type', t)}
            >{t}</button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label>التاريخ *</label>
        <input className="text-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
      </div>

      <div className="field-group">
        <label>السبب *</label>
        <textarea className="text-input" rows="4" placeholder="اكتب السبب بوضوح…" value={form.reason} onChange={e => set('reason', e.target.value)} />
      </div>

      {error && (
        <div className="error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button className="submit-btn" style={{ '--btn-color': '#f59e0b' }} onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 size={24} className="spinner" /> : 'إرسال الإشعار'}
      </button>
    </FormPage>
  );
}
