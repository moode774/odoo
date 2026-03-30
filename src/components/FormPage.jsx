import { ChevronRight } from 'lucide-react';

export default function FormPage({ title, icon, color, onBack, children }) {
  return (
    <div className="form-page">
      <div className="form-header" style={{ '--form-color': color }}>
        <button className="back-btn" onClick={onBack}>
          <ChevronRight size={18} strokeWidth={2.5} />
          <span>رجوع</span>
        </button>
        <div className="form-title-wrap">
          <span className="form-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="form-body">
        {children}
      </div>
    </div>
  );
}
