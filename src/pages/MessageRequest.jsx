import { useState } from 'react';
import { submitMessageToManagement } from '../services/odooApi';
import FormPage from '../components/FormPage';
import { MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

export default function MessageRequest({ employee, onSuccess, onBack }) {
  const [form, setForm] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setError('يرجى تعبئة الموضوع والرسالة');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await submitMessageToManagement({
        employeeId:   employee.id,
        employeeName: employee.name,
        subject: form.subject,
        body:    form.body,
      });
      onSuccess('تم إرسال رسالتك للإدارة بنجاح');
    } catch (e) {
      setError(e.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage title="رسالة للإدارة" icon={<MessageSquare size={24} strokeWidth={2} />} color="#8b5cf6" onBack={onBack}>
      <div className="field-group">
        <label>الموضوع *</label>
        <input className="text-input" type="text" placeholder="موضوع الرسالة…" value={form.subject} onChange={e => set('subject', e.target.value)} />
      </div>

      <div className="field-group">
        <label>الرسالة *</label>
        <textarea className="text-input" rows="6" placeholder="اكتب رسالتك هنا…" value={form.body} onChange={e => set('body', e.target.value)} />
      </div>

      {error && (
        <div className="error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button className="submit-btn" style={{ '--btn-color': '#8b5cf6' }} onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 size={24} className="spinner" /> : 'إرسال الرسالة'}
      </button>
    </FormPage>
  );
}
