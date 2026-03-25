export function BigMindLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BigMind logo"
    >
      {/* Ensō circle — incomplete Zen circle representing enlightenment and the void */}
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="100 14"
        strokeDashoffset="8"
        opacity="0.9"
      />
      {/* Inner dot — representing the "big mind" awareness within */}
      <circle
        cx="24"
        cy="24"
        r="3"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
