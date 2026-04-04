import React from 'react';
import { Loader2 } from 'lucide-react';
import './UI.css';

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled, className = '', icon, ...props
}) => (
  <button
    className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 size={16} className="spin" /> : icon}
    {children}
  </button>
);

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({ label, error, icon: Icon, className = '', ...props }) => (
  <div className={`form-field ${className}`}>
    {label && <label className="form-label">{label}</label>}
    <div className={`input-wrap ${Icon ? 'input-wrap--icon' : ''} ${error ? 'input-wrap--error' : ''}`}>
      {Icon && <Icon size={16} className="input-icon" />}
      <input className="form-input" {...props} />
    </div>
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`form-field ${className}`}>
    {label && <label className="form-label">{label}</label>}
    <div className={`input-wrap ${error ? 'input-wrap--error' : ''}`}>
      <select className="form-input form-select" {...props}>
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ─── Textarea ────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, className = '', ...props }) => (
  <div className={`form-field ${className}`}>
    {label && <label className="form-label">{label}</label>}
    <textarea className={`form-input form-textarea ${error ? 'form-input--error' : ''}`} {...props} />
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hoverable = false, ...props }) => (
  <div className={`card ${hoverable ? 'card--hoverable' : ''} ${className}`} {...props}>
    {children}
  </div>
);

// ─── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`badge badge--${variant} ${className}`}>{children}</span>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, icon: Icon, trend, color = 'primary', loading }) => (
  <Card className={`stat-card stat-card--${color}`}>
    <div className="stat-card__header">
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <span className={`stat-card__trend ${trend >= 0 ? 'trend--up' : 'trend--down'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    {loading ? (
      <div className="stat-card__loading">
        <div className="skeleton skeleton--sm" />
        <div className="skeleton skeleton--xs" />
      </div>
    ) : (
      <>
        <p className="stat-card__value">{value ?? '—'}</p>
        <p className="stat-card__title">{title}</p>
      </>
    )}
  </Card>
);

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal modal--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state">
    {Icon && <div className="empty-state__icon"><Icon size={32} /></div>}
    <h3 className="empty-state__title">{title}</h3>
    {description && <p className="empty-state__desc">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
);

// ─── Page Header ─────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24, className = '' }) => (
  <div className={`spinner ${className}`} style={{ width: size, height: size }} />
);

// ─── Table ───────────────────────────────────────────────────────────────────
export const Table = ({ columns, data, loading, onRowClick, emptyMessage = 'No data found' }) => (
  <div className="table-wrap">
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={{ width: col.width }}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key}><div className="skeleton skeleton--sm" /></td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="table__empty">{emptyMessage}</td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={row._id || row.id || i} onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'table__row--clickable' : ''}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
