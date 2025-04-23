export default function Logo({ width = 180, height = 60 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 360 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SafiMall Logo"
    >
      {/* Leaf icon symbolizing freshness and purity */}
      <path
        d="M60 90C90 60 120 40 150 60C180 80 180 110 150 110C120 110 90 120 60 90Z"
        fill="#2F855A"
        stroke="#276749"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Text part */}
      <text
        x="190"
        y="80"
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
        fontSize="56"
        fill="#2C5282"
        letterSpacing="3"
      >
        Safi
        <tspan fill="#38A169">Mall</tspan>
      </text>
      {/* Sparkle for premium feel */}
      <circle cx="320" cy="30" r="6" fill="#38A169" />
      <path
        d="M320 22L320 38M308 30L332 30"
        stroke="#68D391"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
