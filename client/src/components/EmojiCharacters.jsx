import { useState, useEffect, useCallback } from "react";

/**
 * Vegas Sphere-style emoji characters.
 *
 * Three large, bold emoji faces (inspired by the MSG Sphere in Las Vegas)
 * with interactive eye tracking, scared reactions, and privacy look-away.
 *
 * Props:
 *  - peeking (bool)         – true = eyes open & follow cursor; false = eyelids close
 *  - scared (bool)          – true = confused/scared expression (backspace/delete)
 *  - passwordFilled (bool)  – true = look away from the password field
 */
export default function EmojiCharacters({
  peeking = true,
  scared = false,
  passwordFilled = false,
}) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e) => {
    setMouse({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Pupil travel range
  const eyeX = (mouse.x - 0.5) * 10;
  const eyeY = (mouse.y - 0.5) * 7;

  // Override: look away when password has content
  const finalEyeX = passwordFilled && peeking ? 9 : eyeX;
  const finalEyeY = passwordFilled && peeking ? -2 : eyeY;

  const emojis = [
    { scale: 0.82, offsetY: 18, hue: 0 },    // left  – slightly smaller, lower
    { scale: 1,    offsetY: 0,  hue: 0 },     // center – hero
    { scale: 0.82, offsetY: 18, hue: 0 },     // right – slightly smaller, lower
  ];

  return (
    <div className="flex items-end justify-center select-none" style={{ gap: "2px" }}>
      {emojis.map((cfg, i) => (
        <SphereEmoji
          key={i}
          index={i}
          scale={cfg.scale}
          offsetY={cfg.offsetY}
          eyeX={finalEyeX}
          eyeY={finalEyeY}
          peeking={peeking}
          scared={scared}
          passwordFilled={passwordFilled}
        />
      ))}
    </div>
  );
}

/* ─── Individual Sphere Emoji Face ────────────────────────────────────── */

function SphereEmoji({
  index,
  scale,
  offsetY,
  eyeX,
  eyeY,
  peeking,
  scared,
  passwordFilled,
}) {
  const size = 140 * scale;

  return (
    <div
      style={{
        width: size,
        height: size + offsetY,
        paddingTop: offsetY,
        animation: scared ? "emoji-shake 0.5s ease" : "none",
      }}
    >
      <svg viewBox="0 0 140 140" width={size} height={size}>
        <defs>
          {/* Face sphere gradient — yellow center, darker orange edge */}
          <radialGradient id={`face-${index}`} cx="45%" cy="38%" r="52%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFCC33" />
            <stop offset="85%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#E08A00" />
          </radialGradient>

          {/* LED outer glow */}
          <radialGradient id={`glow-${index}`} cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="#FFD54F" stopOpacity="0" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0.25" />
          </radialGradient>

          {/* Eye white subtle gradient */}
          <radialGradient id={`sclera-${index}`} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f0f0" />
          </radialGradient>

          {/* Clip for eyelids – circles that match eye shape */}
          <clipPath id={`eye-clip-l-${index}`}>
            <circle cx="48" cy="62" r={scared ? 22 : 18} />
          </clipPath>
          <clipPath id={`eye-clip-r-${index}`}>
            <circle cx="92" cy="62" r={scared ? 22 : 18} />
          </clipPath>
        </defs>

        {/* ── LED glow ring ── */}
        <circle cx="70" cy="70" r="68" fill={`url(#glow-${index})`} />

        {/* ── Face sphere ── */}
        <circle cx="70" cy="70" r="62" fill={`url(#face-${index})`} />

        {/* ── Top-left sheen (3-D sphere illusion) ── */}
        <ellipse
          cx="52"
          cy="44"
          rx="28"
          ry="22"
          fill="white"
          opacity="0.18"
        />

        {/* ── Cheek blush ── */}
        <circle cx="32" cy="82" r="10" fill="#FF6B6B" opacity={scared ? "0.35" : "0.2"} />
        <circle cx="108" cy="82" r="10" fill="#FF6B6B" opacity={scared ? "0.35" : "0.2"} />

        {/* ── LEFT EYE ── */}
        <g clipPath={`url(#eye-clip-l-${index})`}>
          {/* Sclera */}
          <circle cx="48" cy="62" r={scared ? 22 : 18} fill={`url(#sclera-${index})`} />

          {peeking ? (
            <>
              {/* Iris */}
              <circle
                cx={48 + eyeX * 0.75}
                cy={62 + eyeY * 0.6}
                r={scared ? 12 : 10}
                fill="#5C3A1E"
                style={{ transition: "cx 0.15s ease, cy 0.15s ease" }}
              />
              {/* Pupil */}
              <circle
                cx={48 + eyeX}
                cy={62 + eyeY * 0.75}
                r={scared ? 6.5 : 5.5}
                fill="#1A0A00"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
              {/* Primary shine */}
              <circle
                cx={43 + eyeX * 0.25}
                cy={56 + eyeY * 0.2}
                r="3.5"
                fill="white"
                opacity="0.95"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
              {/* Secondary shine */}
              <circle
                cx={52 + eyeX * 0.15}
                cy={67 + eyeY * 0.15}
                r="1.8"
                fill="white"
                opacity="0.6"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
            </>
          ) : (
            /* Eyelid (slides down to cover eye) */
            <rect x="26" y="40" width="44" height="44" rx="4" fill="#E5981E" opacity="0.95">
              <animate attributeName="y" from="20" to="40" dur="0.25s" fill="freeze" />
            </rect>
          )}
        </g>

        {/* ── RIGHT EYE ── */}
        <g clipPath={`url(#eye-clip-r-${index})`}>
          <circle cx="92" cy="62" r={scared ? 22 : 18} fill={`url(#sclera-${index})`} />

          {peeking ? (
            <>
              <circle
                cx={92 + eyeX * 0.75}
                cy={62 + eyeY * 0.6}
                r={scared ? 12 : 10}
                fill="#5C3A1E"
                style={{ transition: "cx 0.15s ease, cy 0.15s ease" }}
              />
              <circle
                cx={92 + eyeX}
                cy={62 + eyeY * 0.75}
                r={scared ? 6.5 : 5.5}
                fill="#1A0A00"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
              <circle
                cx={87 + eyeX * 0.25}
                cy={56 + eyeY * 0.2}
                r="3.5"
                fill="white"
                opacity="0.95"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
              <circle
                cx={96 + eyeX * 0.15}
                cy={67 + eyeY * 0.15}
                r="1.8"
                fill="white"
                opacity="0.6"
                style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
              />
            </>
          ) : (
            <rect x="70" y="40" width="44" height="44" rx="4" fill="#E5981E" opacity="0.95">
              <animate attributeName="y" from="20" to="40" dur="0.25s" fill="freeze" />
            </rect>
          )}
        </g>

        {/* ── EYEBROWS ── */}
        {peeking && scared && (
          <>
            {/* Worried / raised brows */}
            <path d="M 32 42 Q 42 32 56 40" stroke="#A06A20" strokeWidth="3" fill="none" strokeLinecap="round">
              <animate attributeName="d" from="M 32 44 Q 42 38 56 44" to="M 32 42 Q 42 32 56 40" dur="0.2s" fill="freeze" />
            </path>
            <path d="M 84 40 Q 98 32 108 42" stroke="#A06A20" strokeWidth="3" fill="none" strokeLinecap="round">
              <animate attributeName="d" from="M 84 44 Q 98 38 108 44" to="M 84 40 Q 98 32 108 42" dur="0.2s" fill="freeze" />
            </path>
          </>
        )}
        {peeking && passwordFilled && !scared && (
          <>
            {/* Skeptical – left brow flat, right brow arched */}
            <path d="M 32 44 Q 42 42 56 44" stroke="#A06A20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 84 40 Q 96 34 108 42" stroke="#A06A20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* ── NOSE (subtle small dot) ── */}
        <ellipse cx="70" cy="80" rx="3" ry="2" fill="#D4882B" opacity="0.5" />

        {/* ── MOUTH ── */}
        {scared ? (
          /* Open "O" — surprised */
          <ellipse cx="70" cy="100" rx="9" ry="7" fill="#8B5E1A" opacity="0.85">
            <animate attributeName="ry" from="2" to="7" dur="0.15s" fill="freeze" />
          </ellipse>
        ) : peeking && passwordFilled ? (
          /* Smirk / side grin */
          <path
            d="M 58 96 Q 70 102 82 94"
            stroke="#8B5E1A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        ) : peeking ? (
          /* Happy smile */
          <path
            d="M 50 94 Q 70 112 90 94"
            stroke="#8B5E1A"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          /* Flat / neutral (eyes closed) */
          <path
            d="M 56 98 Q 70 103 84 98"
            stroke="#8B5E1A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* ── SCARED EXTRAS ── */}
        {scared && (
          <>
            {/* Sweat drop */}
            <ellipse
              cx={index === 1 ? 24 : index === 0 ? 112 : 24}
              cy="42"
              rx="3"
              ry="5"
              fill="#5CB8FF"
              opacity="0.7"
            >
              <animate attributeName="cy" values="38;48;38" dur="0.5s" repeatCount="2" />
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.5s" repeatCount="2" />
            </ellipse>

            {/* Stress lines near eyes */}
            <line x1="22" y1="55" x2="26" y2="58" stroke="#D4882B" strokeWidth="1.5" opacity="0.4" />
            <line x1="20" y1="60" x2="24" y2="62" stroke="#D4882B" strokeWidth="1.5" opacity="0.4" />
            <line x1="114" y1="55" x2="118" y2="58" stroke="#D4882B" strokeWidth="1.5" opacity="0.4" />
            <line x1="116" y1="60" x2="120" y2="62" stroke="#D4882B" strokeWidth="1.5" opacity="0.4" />
          </>
        )}

        {/* ── Bottom rim shadow (grounds the sphere) ── */}
        <ellipse cx="70" cy="130" rx="40" ry="4" fill="#C07A00" opacity="0.1" />
      </svg>
    </div>
  );
}
