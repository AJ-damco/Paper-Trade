import { useState, useEffect, useCallback } from "react";

/**
 * Two emoji characters whose eyes follow the mouse cursor.
 * When `peeking` is false (password field focused), they cover their eyes.
 */
export default function EmojiCharacters({ peeking = true }) {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMouse({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Eye offset based on mouse position (-4 to 4 px)
  const eyeX = (mouse.x - 0.5) * 8;
  const eyeY = (mouse.y - 0.5) * 6;

  return (
    <div className="flex items-end justify-center gap-4 select-none">
      <Character
        eyeX={eyeX}
        eyeY={eyeY}
        peeking={peeking}
        color="emerald"
        face="left"
      />
      <Character
        eyeX={eyeX}
        eyeY={eyeY}
        peeking={peeking}
        color="blue"
        face="right"
      />
    </div>
  );
}

function Character({ eyeX, eyeY, peeking, color, face }) {
  const bodyColor = color === "emerald" ? "#10b981" : "#3b82f6";
  const bodyLight = color === "emerald" ? "#34d399" : "#60a5fa";
  const handColor = color === "emerald" ? "#059669" : "#2563eb";
  const flip = face === "right" ? -1 : 1;

  return (
    <div className="relative" style={{ width: 120, height: 140 }}>
      <svg viewBox="0 0 120 140" width="120" height="140">
        {/* Body */}
        <ellipse cx="60" cy="110" rx="38" ry="30" fill={bodyColor} />
        <ellipse cx="60" cy="108" rx="32" ry="24" fill={bodyLight} opacity="0.3" />

        {/* Head */}
        <circle cx="60" cy="55" r="35" fill={bodyColor} />
        <circle cx="60" cy="52" r="30" fill={bodyLight} opacity="0.2" />

        {/* Ears */}
        <circle cx={60 - 30 * flip} cy="35" r="10" fill={bodyColor} />
        <circle cx={60 + 30 * flip} cy="35" r="10" fill={bodyColor} />
        <circle cx={60 - 30 * flip} cy="35" r="5" fill={bodyLight} opacity="0.3" />
        <circle cx={60 + 30 * flip} cy="35" r="5" fill={bodyLight} opacity="0.3" />

        {peeking ? (
          <>
            {/* Eyes open - white part */}
            <ellipse cx="47" cy="52" rx="9" ry="10" fill="white" />
            <ellipse cx="73" cy="52" rx="9" ry="10" fill="white" />

            {/* Pupils that follow cursor */}
            <circle
              cx={47 + eyeX}
              cy={52 + eyeY}
              r="4.5"
              fill="#1e293b"
              style={{ transition: "cx 0.1s ease, cy 0.1s ease" }}
            />
            <circle
              cx={73 + eyeX}
              cy={52 + eyeY}
              r="4.5"
              fill="#1e293b"
              style={{ transition: "cx 0.1s ease, cy 0.1s ease" }}
            />

            {/* Eye shine */}
            <circle cx={45 + eyeX * 0.5} cy={49 + eyeY * 0.5} r="1.8" fill="white" />
            <circle cx={71 + eyeX * 0.5} cy={49 + eyeY * 0.5} r="1.8" fill="white" />
          </>
        ) : (
          <>
            {/* Hands covering eyes */}
            <ellipse cx="47" cy="52" rx="14" ry="12" fill={handColor}>
              <animate
                attributeName="ry"
                from="0"
                to="12"
                dur="0.3s"
                fill="freeze"
              />
            </ellipse>
            <ellipse cx="73" cy="52" rx="14" ry="12" fill={handColor}>
              <animate
                attributeName="ry"
                from="0"
                to="12"
                dur="0.3s"
                fill="freeze"
              />
            </ellipse>
            {/* Fingers */}
            {[-8, -3, 2, 7].map((off) => (
              <ellipse
                key={off}
                cx={47 + off}
                cy="46"
                rx="3.5"
                ry="5"
                fill={handColor}
              >
                <animate
                  attributeName="ry"
                  from="0"
                  to="5"
                  dur="0.3s"
                  fill="freeze"
                />
              </ellipse>
            ))}
            {[-8, -3, 2, 7].map((off) => (
              <ellipse
                key={off}
                cx={73 + off}
                cy="46"
                rx="3.5"
                ry="5"
                fill={handColor}
              >
                <animate
                  attributeName="ry"
                  from="0"
                  to="5"
                  dur="0.3s"
                  fill="freeze"
                />
              </ellipse>
            ))}
          </>
        )}

        {/* Mouth */}
        <path
          d={peeking ? "M 50 68 Q 60 76 70 68" : "M 52 66 Q 60 70 68 66"}
          stroke={bodyLight}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Blush */}
        <circle cx="38" cy="62" r="5" fill="#f87171" opacity="0.2" />
        <circle cx="82" cy="62" r="5" fill="#f87171" opacity="0.2" />
      </svg>
    </div>
  );
}
