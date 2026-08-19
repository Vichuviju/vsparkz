import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Fully custom dropdown — immune to OS dark mode and global CSS overrides
export const CustomSelect = ({ value, onChange, options, placeholder, className = "" }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className={className} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '12px',
                    border: '1.5px solid #e2e8f0', backgroundColor: '#ffffff',
                    color: selectedOption ? '#1e293b' : '#94a3b8',
                    fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', userSelect: 'none',
                    minHeight: '42px'
                }}
            >
                <span style={{ color: selectedOption ? '#1e293b' : '#94a3b8' }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {open && (
                <div 
                    style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                        backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0',
                        borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 9999, overflowY: 'auto', maxHeight: '250px'
                    }}
                >
                    {options.length === 0 ? (
                        <div style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
                            No options available
                        </div>
                    ) : options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            style={{
                                padding: '10px 14px', cursor: 'pointer',
                                backgroundColor: value === opt.value ? '#eff6ff' : '#ffffff',
                                color: '#1e293b', fontWeight: value === opt.value ? 700 : 500,
                                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = value === opt.value ? '#eff6ff' : '#ffffff'}
                        >
                            {opt.icon && opt.icon}
                            <span style={{ color: '#1e293b' }}>{opt.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CustomToggle = ({ checked, onChange }) => (
    <div 
        onClick={() => onChange(!checked)}
        style={{
            width: '44px', height: '22px', backgroundColor: checked ? '#4f46e5' : '#e2e8f0',
            borderRadius: '100px', padding: '2px', cursor: 'pointer',
            transition: 'background-color 0.2s', position: 'relative', display: 'flex', alignItems: 'center'
        }}
    >
        <div style={{
            width: '18px', height: '18px', backgroundColor: '#fff', borderRadius: '50%',
            transition: 'transform 0.2s', transform: checked ? 'translateX(22px)' : 'translateX(0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }} />
    </div>
);
