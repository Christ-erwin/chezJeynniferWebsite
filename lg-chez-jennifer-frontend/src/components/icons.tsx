import type { SVGProps } from "react";

/** Jeu d'icônes trait (style Lucide), 24×24, currentColor. Jamais d'emoji. */
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3" y="4.5" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Base>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Base>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M20 13.5A8 8 0 1 1 10.5 4a6.2 6.2 0 0 0 9.5 9.5Z" />
  </Base>
);

export const ArrowDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 4v16M6 14l6 6 6-6" />
  </Base>
);

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </Base>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </Base>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const WhatsappIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 20l1.4-4.1A8 8 0 1 1 8.9 19L4 20Z" />
    <path d="M9 9.2c.2-.6.5-.6.9-.6l.6.02c.2 0 .4 0 .6.5.2.6.7 1.8.7 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5l-.4.4c-.2.2-.3.3-.1.6.2.3.8 1.2 1.7 2 1.1.9 1.9 1.2 2.2 1.3.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.3.1.2.1.7-.2 1.3-.2.6-1.2 1.2-1.8 1.2-.5.1-1.1.1-1.8-.1a8.5 8.5 0 0 1-3.5-2.1c-1.4-1.4-2.3-3-2.6-3.6-.3-.5-.6-1.4-.6-2.2 0-.8.4-1.2.6-1.4Z" />
  </Base>
);

export const WalletIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v1.5" />
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <path d="M16 12.5h3.5v3H16a1.5 1.5 0 0 1 0-3Z" />
  </Base>
);

export const SparkIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </Base>
);

export const HeartIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </Base>
);

export const TicketIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M3.5 8.5V6.5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2a2.5 2.5 0 0 0 0 5v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2a2.5 2.5 0 0 0 0-5Z" />
    <path d="M14 6v12" strokeDasharray="1.5 2" />
  </Base>
);

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Base>
);

export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.7-3.2 3.1-5 6-5s5.3 1.8 6 5" />
    <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.6c1.8.6 3 2.2 3.5 4.9" />
  </Base>
);

export const PhoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
  </Base>
);

export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Base>
);

export const ArrowLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </Base>
);

export const MinusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);

export const InstagramIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </Base>
);
