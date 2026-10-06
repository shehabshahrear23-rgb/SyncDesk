import React from 'react';

// Reusable metadata tag. It builds on the existing ".status-pill" class from index.css
// (shape, padding) and only adds the colour for each kind of metadata.
//   <MetadataBadge label="IT" type="category" />
//   <MetadataBadge label="Onboarding" type="linked-context" />
const BADGE_STYLES = {
  // Blue-ish: same colours the project already uses for its blue pill
  category: {
    background: 'rgba(0, 122, 255, 0.12)',
    color: 'var(--primary-accent)',
    border: '1px solid rgba(0, 122, 255, 0.3)'
  },
  // Gray-ish
  'linked-context': {
    background: 'rgba(148, 163, 184, 0.12)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)'
  }
};

const MetadataBadge = ({ label, type = 'linked-context' }) => {
  const text = typeof label === 'string' ? label.trim() : '';
  if (!text) return null;

  const colours = BADGE_STYLES[type] || BADGE_STYLES['linked-context'];

  return (
    <span
      className="status-pill"
      title={text}
      style={{
        ...colours,
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '11px',
        fontWeight: '600'
      }}
    >
      {text}
    </span>
  );
};

export default MetadataBadge;
