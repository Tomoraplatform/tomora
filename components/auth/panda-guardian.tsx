"use client";

import { useEffect, useState } from "react";

/**
 * The panda that watches you sign in.
 *
 * Drawn as one SVG and animated with CSS transforms rather than a runtime
 * animation library: the auth pages are the first thing a new user loads, and
 * a character worth a few kilobytes of markup is not worth a few hundred of
 * JavaScript.
 *
 * It reacts to the form rather than decorating it. Eyes follow what is typed
 * in the email box, both paws come up over the face the moment a password
 * field is focused, and they part into a peek when the password is made
 * visible, which is the same joke as covering your eyes and looking anyway.
 */

export type PandaMood = "idle" | "typing" | "hiding" | "peeking" | "success" | "error";

export function PandaGuardian({
  mood = "idle",
  /** Where the eyes point, -1 hard left to 1 hard right. */
  look = 0,
  className = "",
}: {
  mood?: PandaMood;
  look?: number;
  className?: string;
}) {
  const covering = mood === "hiding" || mood === "peeking";
  const gaze = Math.max(-1, Math.min(1, look));

  // Eyes track the text while typing and otherwise rest looking ahead. They
  // stay put while the paws are up, so nothing slides around behind them.
  // Held still whenever the paws are up, so nothing slides about behind them.
  const px = covering ? 0 : gaze * 5;
  const py = mood === "typing" ? 2.5 : mood === "peeking" ? 3.5 : mood === "success" ? -1.5 : 0;

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    // Irregular, because a metronome blink reads as a machine.
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        schedule();
      }, 2600 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const eyesShut = blink && !covering;

  return (
    <svg
      viewBox="0 0 240 210"
      className={className}
      role="img"
      aria-label="A panda guarding your details"
    >
      <defs>
        <radialGradient id="pg-fur" cx="42%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFEAE2" />
        </radialGradient>
        <radialGradient id="pg-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F7A9A0" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#F7A9A0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pg-paw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3A3E" />
          <stop offset="100%" stopColor="#1C1C20" />
        </linearGradient>
        {/* Keeps the pupils inside the eye whites however far they look. */}
        <clipPath id="pg-eye-l"><circle cx="93" cy="103" r="12" /></clipPath>
        <clipPath id="pg-eye-r"><circle cx="147" cy="103" r="12" /></clipPath>
      </defs>

      <style>{`
        .pg-sway { animation: pg-sway 6s ease-in-out infinite; transform-origin: 120px 190px; }
        @keyframes pg-sway {
          0%, 100% { transform: rotate(-1.1deg) translateY(0px); }
          50%      { transform: rotate(1.1deg) translateY(-3px); }
        }
        .pg-eyes, .pg-lid, .pg-paw, .pg-mouth { transition: transform .28s cubic-bezier(.34,1.4,.5,1), opacity .18s ease; }
        .pg-paw { transition: transform .42s cubic-bezier(.34,1.35,.5,1); }
        @media (prefers-reduced-motion: reduce) {
          .pg-sway { animation: none; }
          .pg-eyes, .pg-lid, .pg-paw, .pg-mouth { transition: none; }
        }
      `}</style>

      <g className="pg-sway">
        {/* ---- body ---- */}
        <ellipse cx="120" cy="204" rx="74" ry="52" fill="url(#pg-fur)" />
        <path d="M56 196c8-26 30-40 64-40s56 14 64 40z" fill="#F4F0E8" />

        {/* ---- ears ---- */}
        <circle cx="64" cy="56" r="25" fill="#232327" />
        <circle cx="176" cy="56" r="25" fill="#232327" />
        <circle cx="64" cy="56" r="12" fill="#4A4A50" />
        <circle cx="176" cy="56" r="12" fill="#4A4A50" />

        {/* ---- head ---- */}
        <ellipse cx="120" cy="106" rx="74" ry="66" fill="url(#pg-fur)" />

        {/* ---- eye patches, the panda's whole identity ---- */}
        <ellipse cx="93" cy="103" rx="24" ry="28" fill="#232327" transform="rotate(-16 93 103)" />
        <ellipse cx="147" cy="103" rx="24" ry="28" fill="#232327" transform="rotate(16 147 103)" />

        {/* ---- eyes ---- */}
        <g className="pg-eyes">
          <circle cx="93" cy="103" r="12" fill="#FFFFFF" />
          <circle cx="147" cy="103" r="12" fill="#FFFFFF" />
          <g clipPath="url(#pg-eye-l)">
            <circle cx={93 + px} cy={103 + py} r="7" fill="#17171A" />
            <circle cx={93 + px + 2.6} cy={103 + py - 3} r="2.4" fill="#FFFFFF" />
          </g>
          <g clipPath="url(#pg-eye-r)">
            <circle cx={147 + px} cy={103 + py} r="7" fill="#17171A" />
            <circle cx={147 + px + 2.6} cy={103 + py - 3} r="2.4" fill="#FFFFFF" />
          </g>
          {/* Lids drop for a blink and for the closed-eyes success beam. */}
          <g className="pg-lid" opacity={eyesShut || mood === "success" ? 1 : 0}>
            <path d="M81 103q12 -9 24 0 q-12 9 -24 0" fill="#232327" />
            <path d="M135 103q12 -9 24 0 q-12 9 -24 0" fill="#232327" />
          </g>
        </g>

        {/* ---- muzzle ---- */}
        <ellipse cx="120" cy="136" rx="30" ry="23" fill="#FFFFFF" />
        <ellipse cx="88" cy="132" rx="13" ry="9" fill="url(#pg-cheek)" />
        <ellipse cx="152" cy="132" rx="13" ry="9" fill="url(#pg-cheek)" />
        <path d="M113 128q7 -6 14 0 q-7 8 -14 0" fill="#232327" />

        {/* ---- mouth: the smile is the default, everything else is a variation ---- */}
        <g className="pg-mouth">
          {mood === "error" ? (
            <path d="M107 148q13 -9 26 0" stroke="#232327" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : mood === "success" ? (
            <path d="M104 140q16 18 32 0 q-16 6 -32 0" fill="#232327" />
          ) : (
            <path d="M104 139q16 15 32 0" stroke="#232327" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* ---- paws ----
             Rest tucked at the belly, swing up over the eyes when a password is
             being typed, and drop just enough to peek when it is revealed. */}
        <Paw
          side="left"
          state={mood === "peeking" ? "peek" : covering ? "cover" : "rest"}
        />
        <Paw
          side="right"
          state={mood === "peeking" ? "peek" : covering ? "cover" : "rest"}
        />
      </g>
    </svg>
  );
}

/** One paw, in one of its three positions. */
function Paw({ side, state }: { side: "left" | "right"; state: "rest" | "cover" | "peek" }) {
  const mirror = side === "left" ? 1 : -1;
  // Units are not optional here: CSS drops the whole declaration for
  // `translate(4, -74)`, which silently leaves the paw wherever it was.
  // Distances are measured against the eye patches so the cover lands on the
  // face rather than near it.
  const TRANSFORMS = {
    rest: `translate(0px, 0px) rotate(0deg)`,
    cover: `translate(${mirror * 4}px, -74px) rotate(${mirror * -8}deg)`,
    peek: `translate(${mirror * 17}px, -46px) rotate(${mirror * -20}deg)`,
  };
  const x = side === "left" ? 74 : 166;

  return (
    <g
      className="pg-paw"
      // view-box, so the origin below is read in the same coordinates the rest
      // of this drawing uses.
      style={{ transform: TRANSFORMS[state], transformOrigin: `${x}px 186px`, transformBox: "view-box" }}
    >
      <g transform={`translate(${x} 176)`}>
        {/* arm reaching back to the shoulder, so a raised paw is not floating */}
        <path
          d={`M0 6 q${mirror * -6} 26 ${mirror * -10} 42`}
          stroke="#232327"
          strokeWidth="26"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="0" cy="0" rx="25" ry="22" fill="url(#pg-paw)" />
        {/* toe pads, the detail that makes it read as a paw and not a mitten */}
        <circle cx={mirror * -11} cy="-11" r="4.4" fill="#5A5A62" />
        <circle cx={mirror * -1} cy="-15" r="4.4" fill="#5A5A62" />
        <circle cx={mirror * 9} cy="-12" r="4.4" fill="#5A5A62" />
        <ellipse cx="0" cy="4" rx="9" ry="7" fill="#5A5A62" />
      </g>
    </g>
  );
}
