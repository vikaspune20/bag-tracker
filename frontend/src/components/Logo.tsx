type LogoProps = {
  /** 'sm' for nav header, 'md' (default) for sidebar */
  size?: 'sm' | 'md';
};

export const Logo = ({ size = 'md' }: LogoProps) => {
  const iconPx   = size === 'sm' ? 38  : 50;
  const brandPx  = size === 'sm' ? '17px' : '22px';
  const tagPx    = size === 'sm' ? '7px'  : '7.5px';
  const tagLS    = size === 'sm' ? '3px'  : '3.5px';
  const gap      = size === 'sm' ? '8px'  : '10px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {/* Bag + GPS pin icon */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Bag body */}
        <rect x="10" y="20" width="44" height="34" rx="5" fill="#0a2463" />
        {/* Handle bar */}
        <rect x="22" y="13" width="20" height="4" rx="2" fill="#0a2463" />
        <rect x="22" y="13" width="3"  height="11" rx="1.5" fill="#0a2463" />
        <rect x="39" y="13" width="3"  height="11" rx="1.5" fill="#0a2463" />
        {/* Stripe */}
        <rect x="10" y="32" width="44" height="5" fill="#1d3a8a" />
        {/* Zipper */}
        <line x1="10" y1="29" x2="54" y2="29" stroke="#3b5bdb" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* GPS pin circle */}
        <circle cx="48" cy="18" r="10" fill="#e63946" />
        {/* GPS pin tail */}
        <path d="M48 24 L44 18 Q44 13 48 13 Q52 13 52 18 Z" fill="#e63946" />
        {/* GPS pin inner dot */}
        <circle cx="48" cy="17" r="3.5" fill="white" />
        {/* Wheels */}
        <circle cx="20" cy="56" r="3.5" fill="#0a2463" />
        <circle cx="44" cy="56" r="3.5" fill="#0a2463" />
      </svg>

      {/* Text block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: brandPx,
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#0a2463' }}>JC </span>
          <span style={{ color: '#0a2463' }}>SMART</span>
          <span style={{ color: '#e63946' }}>BAG</span>
        </div>
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: tagPx,
            letterSpacing: tagLS,
            color: '#0a2463',
            textTransform: 'uppercase',
            marginTop: '4px',
            paddingLeft: '1px',
          }}
        >
          Track Your Bag
        </div>
        <div
          style={{
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, #0a2463, #e63946)',
            borderRadius: '2px',
            marginTop: '4px',
          }}
        />
      </div>
    </div>
  );
};
