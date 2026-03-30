import { useState, useEffect } from 'react';
import { submitLeaveRequest, getLeaveTypes } from '../services/odooApi';
import FormPage from '../components/FormPage';
import { Palmtree, AlertCircle, Loader2 } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

export default function LeaveRequest({ employee, onSuccess, onBack }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [form, setForm] = useState({
    leaveTypeId: '',
    dateFrom: today,
    dateTo: today,
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaveTypes().then(types => {
      setLeaveTypes(types || []);
      if (types?.length > 0) setForm(f => ({ ...f, leaveTypeId: String(types[0].id) }));
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.leaveTypeId || !form.dateFrom || !form.dateTo) {
      setError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if (form.dateTo < form.dateFrom) {
      setError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitLeaveRequest({
        employeeId: employee.id,
        leaveTypeId: parseInt(form.leaveTypeId),
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        reason: form.reason,
      });
      onSuccess('تم إرسال طلب الإجازة بنجاح');
    } catch (e) {
      setError(e.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage title="طلب إجازة سنوية" icon={<Palmtree size={24} strokeWidth={2} />} color="#10b981" onBack={onBack}>
      <div className="field-group">
        <label>نوع الإجازة *</label>
        <select className="text-input" value={form.leaveTypeId} onChange={e => set('leaveTypeId', e.target.value)}>
          {leaveTypes.length === 0 && <option value="">جاري التحميل…</option>}
          {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>من تاريخ *</label>
          <input className="text-input" type="date" value={form.dateFrom} onChange={e => set('dateFrom', e.target.value)} />
        </div>
        <div className="field-group">
          <label>إلى تاريخ *</label>
          <input className="text-input" type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} />
        </div>
      </div>

      <div className="field-group">
        <label>السبب (اختياري)</label>
        <textarea className="text-input" rows="3" placeholder="أدخل سبب الإجازة…" value={form.reason} onChange={e => set('reason', e.target.value)} />
      </div>

      {error && (
        <div className="error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button className="submit-btn" style={{ '--btn-color': '#10b981' }} onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 size={24} className="spinner" /> : 'إرسال الطلب'}
      </button>
    </FormPage>
  );
}
