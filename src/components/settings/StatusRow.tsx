import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusColorPicker } from './StatusColorPicker';

export interface LocalStatus {
  id: string;          // real UUID or temp string like 'new-1'
  name: string;
  color: string;
  category: string;
  position: number;
  is_default: boolean;
  is_closed: boolean;
  isNew?: boolean;     // flag for newly added statuses
  isDeleted?: boolean; // scheduled for deletion
}

interface StatusRowProps {
  status: LocalStatus;
  onUpdate: (id: string, changes: Partial<LocalStatus>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function StatusRow({ status, onUpdate, onDelete, onSetDefault }: StatusRowProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(status.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
    disabled: status.is_closed,
    data: { category: status.category },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 6,
    background: 'var(--pb-bg)',
    border: '1px solid var(--pb-border)',
    marginBottom: 4,
    cursor: status.is_closed ? 'default' : 'default',
    userSelect: 'none',
  };

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== status.name) {
      onUpdate(status.id, { name: trimmed });
    } else {
      setNameValue(status.name);
    }
    setEditingName(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle — hidden for closed status */}
      {!status.is_closed ? (
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab', color: 'var(--pb-text3)', fontSize: 13,
            lineHeight: 1, padding: '0 2px', flexShrink: 0,
          }}
          title="Drag to reorder"
        >
          ⠿
        </div>
      ) : (
        <div style={{ width: 14, flexShrink: 0 }} />
      )}

      {/* Color circle */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowColorPicker(p => !p)}
          style={{
            width: 14, height: 14, borderRadius: '50%', background: status.color,
            border: 'none', cursor: 'pointer', padding: 0, display: 'block',
            transition: 'transform .1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        {showColorPicker && (
          <div style={{ position: 'absolute', top: '120%', left: 0, zIndex: 20 }}>
            <StatusColorPicker
              value={status.color}
              onChange={(c) => { onUpdate(status.id, { color: c }); setShowColorPicker(false); }}
            />
          </div>
        )}
      </div>

      {/* Name — click to edit */}
      {editingName ? (
        <input
          ref={inputRef}
          autoFocus
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') { setNameValue(status.name); setEditingName(false); }
          }}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: 'var(--pb-text)',
            borderBottom: '1px solid var(--pb-accent-alt)', padding: '1px 2px',
          }}
        />
      ) : (
        <span
          onClick={() => setEditingName(true)}
          style={{
            flex: 1, fontSize: 13, color: 'var(--pb-text)', cursor: 'text',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {status.name}
        </span>
      )}

      {/* Default badge */}
      {status.is_default && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 10,
          background: 'var(--pb-blue-bg)', color: 'var(--pb-blue)',
          fontFamily: "'Syne', sans-serif", fontWeight: 600, flexShrink: 0,
        }}>Default</span>
      )}

      {/* Closed badge */}
      {status.is_closed && (
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 10,
          background: 'var(--pb-bg3)', color: 'var(--pb-text3)',
          fontFamily: "'Syne', sans-serif", flexShrink: 0,
        }}>Locked</span>
      )}

      {/* ··· menu — not for closed */}
      {!status.is_closed && (
        <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
          <button
            onClick={() => setShowMenu(m => !m)}
            style={{
              width: 22, height: 22, borderRadius: 4, border: '1px solid transparent',
              background: 'transparent', cursor: 'pointer', color: 'var(--pb-text3)',
              fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--pb-bg3)'; e.currentTarget.style.borderColor = 'var(--pb-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            ···
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 40,
              background: 'var(--pb-bg2)', border: '1px solid var(--pb-border2)',
              borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: 160, overflow: 'hidden', marginTop: 4,
            }}>
              {[
                { label: 'Edit name', action: () => { setEditingName(true); setShowMenu(false); } },
                { label: 'Set as default', action: () => { onSetDefault(status.id); setShowMenu(false); }, disabled: status.is_default },
                { label: 'Delete', action: () => { onDelete(status.id); setShowMenu(false); }, danger: true, disabled: status.is_default },
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={item.disabled ? undefined : item.action}
                  style={{
                    padding: '7px 12px', fontSize: 13, cursor: item.disabled ? 'not-allowed' : 'pointer',
                    color: item.disabled ? 'var(--pb-text3)' : item.danger ? 'var(--pb-red)' : 'var(--pb-text)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.danger ? 'var(--pb-red-bg)' : 'var(--pb-bg3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
