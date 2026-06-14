/** Tidecast brand mark — a tide line cresting into a forecast point, distilled
 *  from the app icon. Inherits color via currentColor (use text-accent). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.6 16.4C5 16.4 6 11.8 9.4 11.8C12.4 11.8 13 15.2 15.4 14.2C17 13.5 18 10.4 20.4 8.6"
        opacity="0.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M2.6 13.2C5 13.2 6 8.6 9.4 8.6C12.4 8.6 13 12 15.4 11C17 10.3 18 7.2 20.4 5.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="20.4" cy="5.4" fill="currentColor" r="2.1" />
      <path
        d="M18.4 2.9L20.4 0.9L22.4 2.9"
        opacity="0.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
