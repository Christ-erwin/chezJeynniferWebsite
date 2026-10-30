import { useId } from "react";

/** Couronne du chef du village (or, gravée), posée en haut à gauche de sa carte. */
export function Crown({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 64 50"
      className={`overflow-visible ${className}`}
      style={{ filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.65)) drop-shadow(0 0 8px rgba(242,200,107,0.5))", ...style }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1c4" />
          <stop offset="0.45" stopColor="#f2c86b" />
          <stop offset="1" stopColor="#a8741f" />
        </linearGradient>
      </defs>
      <g>
        <path d="M5 38 9 12l12 13L32 5l11 20 12-13 4 26Z" fill={`url(#${id}g)`} stroke="#5a3a0c" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="5" y="38" width="54" height="8" rx="2" fill={`url(#${id}g)`} stroke="#5a3a0c" strokeWidth="1.6" />
        <circle cx="9" cy="11" r="3" fill="#fff1c4" stroke="#5a3a0c" strokeWidth="1.2" />
        <circle cx="32" cy="5" r="3.4" fill="#fff1c4" stroke="#5a3a0c" strokeWidth="1.2" />
        <circle cx="55" cy="11" r="3" fill="#fff1c4" stroke="#5a3a0c" strokeWidth="1.2" />
        <circle cx="32" cy="42" r="2.6" fill="#c8262f" stroke="#5a3a0c" strokeWidth="1" />
        <circle cx="19" cy="42" r="1.9" fill="#c8262f" stroke="#5a3a0c" strokeWidth="1" />
        <circle cx="45" cy="42" r="1.9" fill="#c8262f" stroke="#5a3a0c" strokeWidth="1" />
      </g>
    </svg>
  );
}
