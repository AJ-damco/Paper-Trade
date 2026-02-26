import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Three cute interactive owl characters.
 *
 * Props:
 *  - peeking: true = eyes visible & follow cursor, false = covering eyes (password focused)
 *  - scared: true = characters look scared/confused (backspace/delete pressed)
 *  - passwordFilled: true = characters look away from the password field
 */
export default function EmojiCharacters({
  peeking = true,
  scared = false,
  passwordFilled = false,
}) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMouse({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Eye offset based on mouse position
  const eyeX = (mouse.x - 0.5) * 8;
  const eyeY = (mouse.y - 0.5) * 6;

  // When password is filled, look away (hard left/up)
  const finalEyeX = passwordFilled && peeking ? -6 : eyeX;
  const finalEyeY = passwordFilled && peeking ? -4 : eyeY;

  const owls = [
    { color: "#10b981", light: "#6ee7b7", dark: "#059669", size: 0.85, offsetY: 8 },
    { color: "#3b82f6", light: "#93c5fd", dark: "#2563eb", size: 1, offsetY: 0 },
    { color: "#f59e0b", light: "#fcd34d", dark: "#d97706", size: 0.8, offsetY: 12 },
  ];

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-center select-none"
      style={{ gap: "6px" }}
    >
      {owls.map((owl, i) => (
        <Owl
          key={i}
          eyeX={finalEyeX}
          eyeY={finalEyeY}
          peeking={peeking}
          scared={scared}
          passwordFilled={passwordFilled}
          color={owl.color}
          lightColor={owl.light}
          darkColor={owl.dark}
          scale={owl.size}
          offsetY={owl.offsetY}
          index={i}
        />
      ))}
    </div>
  );
}

function Owl({
  eyeX,
  eyeY,
  peeking,
  scared,
  passwordFilled,
  color,
  lightColor,
  darkColor,
  scale,
  offsetY,
  index,
}) {
  const w = 100 * scale;
  const h = 120 * scale;

  // Stagger the scared animation slightly per owl
  const scaredDelay = index * 0.05;
  const scaredRotation = scared ? (index % 2 === 0 ? -8 : 8) : 0;

  return (
    <div
      style={{
        width: w,
        height: h + offsetY,
        paddingTop: offsetY,
        transition: "transform 0.2s ease",
        transform: `rotate(${scaredRotation}deg)`,
        animation: scared ? `owl-shake-${index % 2} 0.3s ease ${scaredDelay}s` : "none",
      }}
    >
      <svg viewBox="0 0 100 120" width={w} height={h}>
        <defs>
          {/* Body gradient */}
          <radialGradient id={`owl-body-${index}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={lightColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </radialGradient>
          {/* Belly highlight */}
          <radialGradient id={`owl-belly-${index}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ear tufts */}
        <ellipse cx="30" cy="18" rx="10" ry="16" fill={color} transform="rotate(-15, 30, 18)" />
        <ellipse cx="70" cy="18" rx="10" ry="16" fill={color} transform="rotate(15, 70, 18)" />
        <ellipse cx="30" cy="16" rx="6" ry="10" fill={lightColor} opacity="0.25" transform="rotate(-15, 30, 16)" />
        <ellipse cx="70" cy="16" rx="6" ry="10" fill={lightColor} opacity="0.25" transform="rotate(15, 70, 16)" />

        {/* Body */}
        <ellipse cx="50" cy="85" rx="34" ry="32" fill={`url(#owl-body-${index})`} />
        <ellipse cx="50" cy="88" rx="22" ry="20" fill={`url(#owl-belly-${index})`} />

        {/* Belly pattern - lighter tummy */}
        <ellipse cx="50" cy="90" rx="18" ry="16" fill={lightColor} opacity="0.15" />

        {/* Feet */}
        <ellipse cx="38" cy="115" rx="10" ry="5" fill={darkColor} />
        <ellipse cx="62" cy="115" rx="10" ry="5" fill={darkColor} />
        {/* Toes */}
        {[32, 38, 44].map((tx) => (
          <circle key={`lt-${tx}`} cx={tx} cy="118" r="2.5" fill={darkColor} />
        ))}
        {[56, 62, 68].map((tx) => (
          <circle key={`rt-${tx}`} cx={tx} cy="118" r="2.5" fill={darkColor} />
        ))}

        {/* Head */}
        <circle cx="50" cy="48" r="32" fill={`url(#owl-body-${index})`} />
        {/* Face disc (lighter circle around eyes - owl feature) */}
        <ellipse cx="50" cy="50" rx="26" ry="24" fill={lightColor} opacity="0.12" />

        {peeking ? (
          <>
            {/* Eye sockets - darker circles behind eyes */}
            <circle cx="37" cy="46" r="14" fill={darkColor} opacity="0.15" />
            <circle cx="63" cy="46" r="14" fill={darkColor} opacity="0.15" />

            {/* Eyes - big owl eyes */}
            <circle cx="37" cy="46" r={scared ? 13 : 12} fill="white">
              {scared && (
                <animate attributeName="r" values="12;13;12" dur="0.3s" repeatCount="2" />
              )}
            </circle>
            <circle cx="63" cy="46" r={scared ? 13 : 12} fill="white">
              {scared && (
                <animate attributeName="r" values="12;13;12" dur="0.3s" repeatCount="2" />
              )}
            </circle>

            {/* Iris */}
            <circle
              cx={37 + eyeX * 0.8}
              cy={46 + eyeY * 0.6}
              r={scared ? 7 : 6.5}
              fill={scared ? "#1a1a2e" : "#2d1b69"}
              style={{ transition: "cx 0.15s ease, cy 0.15s ease" }}
            />
            <circle
              cx={63 + eyeX * 0.8}
              cy={46 + eyeY * 0.6}
              r={scared ? 7 : 6.5}
              fill={scared ? "#1a1a2e" : "#2d1b69"}
              style={{ transition: "cx 0.15s ease, cy 0.15s ease" }}
            />

            {/* Pupils */}
            <circle
              cx={37 + eyeX}
              cy={46 + eyeY}
              r={scared ? 4 : 3.5}
              fill="#0f0f1a"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />
            <circle
              cx={63 + eyeX}
              cy={46 + eyeY}
              r={scared ? 4 : 3.5}
              fill="#0f0f1a"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />

            {/* Eye shine */}
            <circle
              cx={34 + eyeX * 0.3}
              cy={43 + eyeY * 0.3}
              r="2.5"
              fill="white"
              opacity="0.9"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />
            <circle
              cx={60 + eyeX * 0.3}
              cy={43 + eyeY * 0.3}
              r="2.5"
              fill="white"
              opacity="0.9"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />
            {/* Secondary shine */}
            <circle
              cx={40 + eyeX * 0.2}
              cy={49 + eyeY * 0.2}
              r="1.2"
              fill="white"
              opacity="0.6"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />
            <circle
              cx={66 + eyeX * 0.2}
              cy={49 + eyeY * 0.2}
              r="1.2"
              fill="white"
              opacity="0.6"
              style={{ transition: "cx 0.12s ease, cy 0.12s ease" }}
            />

            {/* Eyebrows */}
            {scared ? (
              <>
                {/* Raised worried eyebrows */}
                <line x1="27" y1="30" x2="40" y2="32" stroke={darkColor} strokeWidth="2.5" strokeLinecap="round">
                  <animate attributeName="y1" values="33;30;33" dur="0.4s" repeatCount="1" />
                </line>
                <line x1="60" y1="32" x2="73" y2="30" stroke={darkColor} strokeWidth="2.5" strokeLinecap="round">
                  <animate attributeName="y2" values="33;30;33" dur="0.4s" repeatCount="1" />
                </line>
              </>
            ) : passwordFilled ? (
              <>
                {/* Suspicious half-closed eyebrows */}
                <line x1="27" y1="35" x2="42" y2="33" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />
                <line x1="58" y1="33" x2="73" y2="35" stroke={darkColor} strokeWidth="2" strokeLinecap="round" />
              </>
            ) : null}
          </>
        ) : (
          <>
            {/* Closed eyes - covering with wings */}
            {/* Wing shapes over eyes */}
            <ellipse cx="37" cy="47" rx="15" ry="13" fill={darkColor}>
              <animate attributeName="ry" from="0" to="13" dur="0.25s" fill="freeze" />
            </ellipse>
            <ellipse cx="63" cy="47" rx="15" ry="13" fill={darkColor}>
              <animate attributeName="ry" from="0" to="13" dur="0.25s" fill="freeze" />
            </ellipse>
            {/* Feather lines on wings */}
            {[-9, -3, 3, 9].map((off) => (
              <ellipse
                key={`lf-${off}`}
                cx={37 + off}
                cy="40"
                rx="3"
                ry="6"
                fill={color}
                opacity="0.6"
              >
                <animate attributeName="ry" from="0" to="6" dur="0.3s" fill="freeze" />
              </ellipse>
            ))}
            {[-9, -3, 3, 9].map((off) => (
              <ellipse
                key={`rf-${off}`}
                cx={63 + off}
                cy="40"
                rx="3"
                ry="6"
                fill={color}
                opacity="0.6"
              >
                <animate attributeName="ry" from="0" to="6" dur="0.3s" fill="freeze" />
              </ellipse>
            ))}
          </>
        )}

        {/* Beak */}
        <path
          d={scared ? "M 46 57 L 50 64 L 54 57 Z" : "M 47 57 L 50 62 L 53 57 Z"}
          fill={darkColor}
          opacity="0.8"
        />

        {/* Mouth */}
        {scared ? (
          /* Open mouth - surprised "O" */
          <ellipse cx="50" cy="67" rx="4" ry="3" fill={darkColor} opacity="0.5">
            <animate attributeName="ry" values="1;3;2" dur="0.3s" fill="freeze" />
          </ellipse>
        ) : peeking ? (
          /* Happy smile */
          <path
            d="M 44 66 Q 50 72 56 66"
            stroke={darkColor}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
        ) : (
          /* Flat mouth when covering eyes */
          <path
            d="M 46 66 Q 50 68 54 66"
            stroke={darkColor}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.4"
          />
        )}

        {/* Blush */}
        <circle cx="25" cy="56" r="5" fill="#f87171" opacity={scared ? "0.35" : "0.18"} />
        <circle cx="75" cy="56" r="5" fill="#f87171" opacity={scared ? "0.35" : "0.18"} />

        {/* Scared sweat drop */}
        {scared && (
          <g opacity="0.6">
            <ellipse cx={index === 0 ? 20 : index === 1 ? 78 : 22} cy="35" rx="2" ry="3.5" fill="#60a5fa">
              <animate attributeName="cy" values="32;38;32" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="0.6s" repeatCount="indefinite" />
            </ellipse>
          </g>
        )}

        {/* Little wing detail on sides */}
        {peeking && !scared && (
          <>
            <ellipse cx="18" cy="78" rx="8" ry="14" fill={darkColor} opacity="0.15" transform="rotate(-10, 18, 78)" />
            <ellipse cx="82" cy="78" rx="8" ry="14" fill={darkColor} opacity="0.15" transform="rotate(10, 82, 78)" />
          </>
        )}

        {/* Scared wing flap */}
        {scared && (
          <>
            <ellipse cx="14" cy="72" rx="10" ry="16" fill={darkColor} opacity="0.25" transform="rotate(-25, 14, 72)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-15,14,72;-30,14,72;-15,14,72"
                dur="0.3s"
                repeatCount="3"
              />
            </ellipse>
            <ellipse cx="86" cy="72" rx="10" ry="16" fill={darkColor} opacity="0.25" transform="rotate(25, 86, 72)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="15,86,72;30,86,72;15,86,72"
                dur="0.3s"
                repeatCount="3"
              />
            </ellipse>
          </>
        )}
      </svg>
    </div>
  );
}
