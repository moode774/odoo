import { useState } from 'react';
import { submitTravelRequest } from '../services/odooApi';
import FormPage from '../components/FormPage';
import { Plane, AlertCircle, Loader2 } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];

export default function TravelRequest({ employee, onSuccess, onBack }) {
  const [form, setForm] = useState({ destination: '', dateFrom: today, dateTo: today, purpose: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.destination.trim() || !form.dateFrom || !form.dateTo || !form.purpose.trim()) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitTravelRequest({
        employeeId:   employee.id,
        employeeName: employee.name,
        destination: form.destination,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        purpose: form.purpose,
      });
      onSuccess('تم إرسال طلب المأمورية بنجاح');
    } catch (e) {
      setError(e.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage title="طلب سفر / مأمورية" icon={<Plane size={24} strokeWidth={2} />} color="#2563eb" onBack={onBack}>
      <div className="field-group">
        <label>الوجهة *</label>
        <input className="text-input" type="text" placeholder="مثال: الرياض، جدة…" value={form.destination} onChange={e => set('destination', e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>تاريخ المغادرة *</label>
          <input className="text-input" type="date" value={form.dateFrom} onChange={e => set('dateFrom', e.target.value)} />
        </div>
        <div className="field-group">
          <label>تاريخ العودة *</label>
          <input className="text-input" type="date" value={form.dateTo} onChange={e => set('dateTo', e.target.value)} />
        </div>
      </div>

      <div className="field-group">
        <label>غرض المأمورية *</label>
        <textarea className="text-input" rows="4" placeholder="اشرح غرض السفر…" value={form.purpose} onChange={e => set('purpose', e.target.value)} />
      </div>

      {error && (
        <div className="error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button className="submit-btn" style={{ '--btn-color': '#2563eb' }} onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 size={24} className="spinner" /> : 'إرسال الطلب'}
      </button>
    </FormPage>
  );
}
