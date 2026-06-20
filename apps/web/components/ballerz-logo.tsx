type BallerzLogoProps = {
  className?: string;
  size?: number;
};

export function BallerzLogo({ className, size = 32 }: BallerzLogoProps) {
  return (
    <svg
      aria-hidden
      className={className}
      height={size}
      viewBox="0 0 32 32"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" fill="#E8751A" r="15" />
      <circle
        cx="16"
        cy="16"
        fill="none"
        r="15"
        stroke="#1C1209"
        strokeOpacity="0.25"
        strokeWidth="0.75"
      />
      <ellipse
        cx="16"
        cy="16"
        fill="none"
        rx="14"
        ry="5.5"
        stroke="#1C1209"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
      <path
        d="M16 1.5C16 1.5 7.5 16 16 30.5"
        fill="none"
        stroke="#1C1209"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
      <path
        d="M16 1.5C16 1.5 24.5 16 16 30.5"
        fill="none"
        stroke="#1C1209"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}
