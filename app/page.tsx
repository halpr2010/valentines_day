"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SlideId = "env" | "q1" | "q2" | "q3" | "q4" | "q5" | "q7" | "q6" | "s8";

type Slide = {
  id: SlideId;
  title: string;
  subtitle?: string;
  hearts?: string;
  yesLabel?: string;
  noLabel?: string;
  yesNext?: SlideId;
  noNext?: SlideId;
  // behavior flags
  yesInflatesOverTime?: boolean; // Q2
  yesDodgesMouse?: boolean; // Q4
  noTiny?: boolean; // Q5 etc
  noVerySmall?: boolean;
  yesHuge?: boolean;
  yesBigRound?: boolean; // Q7
  noFliesUnclickable?: boolean; // Q7
  noSmaller?: boolean; // Q2/Q3
  noNormal?: boolean;
  yesNormal?: boolean;
  noNormalSize?: boolean;
  yesNormalSize?: boolean;
  terminal?: boolean; // Q6 & S8 are special
};

const SLIDES: Record<SlideId, Slide> = {
  env: {
    id: "env",
    title: "You've got mail 💌💖",
    subtitle: "Click the heart seal to open… 💘💘💘",
    terminal: true,
  },

  q1: {
    id: "q1",
    title: "Hi Beautiful, will you be my Valentine? 💘💘",
    subtitle: "❤️🩷❤️",
    yesLabel: "Yes 💖",
    noLabel: "No 💔",
    yesNext: "q2",
    noNext: "q3",
  },

  q2: {
    id: "q2",
    title: "Will you be my Valentine? 💘💘💘",
    subtitle: "ARE YOU SURE?????? 😳💓💓",
    yesLabel: "Yes 😍",
    noLabel: "No 😬",
    yesNext: "q4",
    noNext: "q5",
    yesInflatesOverTime: true, // Yes grows while you’re on this slide
    noSmaller: true,
  },

  q3: {
    id: "q3",
    title: "Will you be my Valentine? 💘💘💘",
    subtitle: "Nu-Uhhhh. Try Again (plz) 🥺💗",
    yesLabel: "Yes 🥹💞",
    noLabel: "No 😒",
    yesNext: "q4",
    noNext: "q5",
    yesHuge: true,
    noVerySmall: true,
  },

  q4: {
    id: "q4",
    title: "Will you be my Valentine? 💘💘💘💘",
    subtitle: "Really!!!!!!! Prove it 😈💓",
    yesLabel: "Yes 😤💖",
    noLabel: "No 🙂",
    yesNext: "q6",
    noNext: "q7",
    yesDodgesMouse: true, // Yes runs away from the cursor
    noNormalSize: true,
  },

  q5: {
    id: "q5",
    title: "Will you be my Valentine? 💘💘💘💘💘",
    subtitle: "Chase the heart ❤️ and click it to say yes! 🏃‍♀️💨",
    yesLabel: "Yes 😭💞",
    noLabel: "No 😶",
    yesNext: "q6",
    noNext: "q7",
    yesHuge: true,
    noTiny: true,
  },

  q7: {
    id: "q7",
    title: "Will you be my Valentine? 💘💘💘💘💘💘",
    subtitle: "I don't believe you. Try this one on for size big boy 😤💗",
    yesLabel: "Yes 💘",
    noLabel: "No 🏃‍♂️💨",
    yesNext: "q6",
    // noNext intentionally not used; No is unclickable anyway
    yesBigRound: true,
    noFliesUnclickable: true,
  },

  q6: {
    id: "q6",
    title: "CONGRATULATIONS 🎉💖",
    subtitle:
      'YOU WON A $10 SHEIN GIFT CARD. 💸💘\nCLICK BELOW TO REDEEM YOUR PRIZE (definitely not a scam) 😇💗',
    terminal: true,
  },

  s8: {
    id: "s8",
    title: "Happy Valentine’s Day 💌💘",
    subtitle: "Write your full Valentine’s Day letter here… 🩷🩷🩷",
    terminal: true,
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Page() {
  const [slideId, setSlideId] = useState<SlideId>("env");
  const slide = SLIDES[slideId];
  const [envOpen, setEnvOpen] = useState(false);

  // --- Q2: Yes inflates over time ---
  const [inflateScale, setInflateScale] = useState(1);

  useEffect(() => {
    setInflateScale(1);
    if (!slide.yesInflatesOverTime) return;

    // grow smoothly while on q2
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = (t - start) / 1000; // seconds
      // scale grows indefinitely (no cap); 0.5 per second
      const s = 1 + elapsed * 0.5;
      setInflateScale(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [slideId, slide.yesInflatesOverTime]);

  // --- Dodging / flying positions ---
  const cardRef = useRef<HTMLDivElement | null>(null);
  const yesButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastDodgeTimeRef = useRef(0);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [yesPos, setYesPos] = useState({ x: 0, y: 0 }); // translate px
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });

  // reset positions when slide changes
  useEffect(() => {
    setYesPos({ x: 0, y: 0 });
    setNoPos({ x: 0, y: 0 });
    setRingPos({ x: 0, y: 0 });
    if (slideId === "env") {
      setEnvOpen(false);
    }
  }, [slideId]);

  // Q5: Ring floats around the screen slowly
  useEffect(() => {
    if (slideId !== "q5") return;
    
    // Start with an initial position
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const maxX = Math.min(w * 0.4, 480);
    const maxY = Math.min(h * 0.4, 320);
    setRingPos(randomOffset(maxX, maxY));
    
    let raf = 0;
    let lastJump = performance.now();
    const jumpInterval = 3500; // Move every 3.5 seconds (slow)
    
    const animate = (t: number) => {
      if (t - lastJump > jumpInterval) {
        lastJump = t;
        const w = typeof window !== "undefined" ? window.innerWidth : 1200;
        const h = typeof window !== "undefined" ? window.innerHeight : 800;
        // Keep ring on screen but move it around slowly
        const maxX = Math.min(w * 0.4, 480);
        const maxY = Math.min(h * 0.4, 320);
        setRingPos(randomOffset(maxX, maxY));
      }
      raf = requestAnimationFrame(animate);
    };
    
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [slideId]);

  const randomOffset = (maxX: number, maxY: number) => {
    const rx = (Math.random() * 2 - 1) * maxX;
    const ry = (Math.random() * 2 - 1) * maxY;
    return { x: rx, y: ry };
  };

  // Q7: “No” flies around forever (unclickable)
  useEffect(() => {
    if (!slide.noFliesUnclickable) return;
    let raf = 0;
    let lastJump = 0;

    const loop = (t: number) => {
      // jump every ~300ms
      if (t - lastJump > 300) {
        lastJump = t;
        setNoPos(randomOffset(220, 110));
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slideId, slide.noFliesUnclickable]);

  const onYesClick = () => {
    if (slideId === "q6") {
      setSlideId("s8");
      return;
    }
    if (slide.yesNext) setSlideId(slide.yesNext);
  };

  const onNoClick = () => {
    // Q7 No is unclickable anyway
    if (slide.noNext) setSlideId(slide.noNext);
  };

  // Q4: Yes dodges on mouse movement — clamped so it never moves off the page
  const dodgeYes = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    // Keep Yes on screen: max offset ~half viewport minus button margin
    const maxX = Math.min(w * 0.45, 420);
    const maxY = Math.min(h * 0.4, 280);
    setYesPos(randomOffset(maxX, maxY));
    lastDodgeTimeRef.current = performance.now();
  };

  // Q4: Dodge only when mouse is near the button, and only after cooldown (so user can click during pause)
  useEffect(() => {
    if (!slide.yesDodgesMouse) return;
    const PROXIMITY_PX = 130; // Dodge when mouse gets within this many px
    const COOLDOWN_MS = 600; // Stay still for 0.6s after dodging — that's the window to click
    const throttleMs = 10;

    let lastThrottle = 0;
    const handleMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastThrottle < throttleMs) return;
      lastThrottle = now;

      const btn = yesButtonRef.current;
      if (!btn) return;
      if (now - lastDodgeTimeRef.current < COOLDOWN_MS) return; // Cooldown: button stays put

      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < PROXIMITY_PX) {
        dodgeYes();
      }
    };

    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [slideId, slide.yesDodgesMouse]);

  // --- Styles (keeps your pink/white vibe) ---
  const bgStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at 20% 20%, #ffd1e1, transparent 40%), radial-gradient(circle at 80% 30%, #f8b7ff, transparent 40%), linear-gradient(180deg, #ffd6e6, #f6d8ff)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  };

  const cardStyle: React.CSSProperties = {
    width: "min(620px, 92vw)",
    padding: "28px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.90)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
    overflow: slideId === "q3" ? "hidden" : "visible",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    margin: "0 0 10px",
    color: "#111",
    lineHeight: 1.2,
    position: "relative",
    zIndex: 15,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: 0,
    color: "#555",
    fontSize: "14px",
    whiteSpace: "pre-line",
    position: "relative",
    zIndex: 15,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    marginTop: slide.yesHuge ? "36px" : "18px",
    position: "relative",
    minHeight: "80px",
  };

  const btnBase: React.CSSProperties = {
    border: "none",
    borderRadius: "999px",
    padding: "12px 22px",
    fontSize: "16px",
    cursor: "pointer",
    minWidth: "120px",
    transition: "transform 120ms ease",
    userSelect: "none",
  };

  // Yes sizing rules
  const yesScale = useMemo(() => {
    if (slide.yesInflatesOverTime) return inflateScale;
    if (slide.yesHuge) return 1.9;
    if (slide.yesBigRound) return 1.5;
    return 1.0;
  }, [slideId, slide.yesInflatesOverTime, inflateScale, slide.yesHuge, slide.yesBigRound]);

  // No sizing rules
  const noScale = useMemo(() => {
    if (slide.noTiny) return 0.55;
    if (slide.noVerySmall) return 0.40;
    if (slide.noSmaller) return 0.75;
    return 1.0;
  }, [slideId, slide.noTiny, slide.noVerySmall, slide.noSmaller]);

  const yesStyle: React.CSSProperties = {
    ...btnBase,
    background: "#ff3b7a",
    color: "white",
    transform: `translate(${yesPos.x}px, ${yesPos.y}px) scale(${yesScale})`,
    borderRadius: slide.yesBigRound ? "9999px" : "999px",
    padding: slide.yesBigRound ? "16px 30px" : btnBase.padding,
    fontWeight: slide.yesBigRound ? 700 : 600,
    transition: slide.yesDodgesMouse ? "transform 60ms ease-out" : btnBase.transition,
  };

  const noStyle: React.CSSProperties = {
    ...btnBase,
    background: "#e9e9ef",
    color: "#222",
    transform: `translate(${noPos.x}px, ${noPos.y}px) scale(${noScale})`,
    opacity: slide.noFliesUnclickable ? 0.95 : 1,
    // Unclickable “No” on Q7
    pointerEvents: slide.noFliesUnclickable ? "none" : "auto",
    // Stay on top when Yes grows huge (e.g. Q2), so No remains visible and clickable
    position: "relative",
    zIndex: 10,
  };

    // --- Envelope intro screen ---
  if (slideId === "env") {
    const handleSealClick = () => {
      if (envOpen) return;
      setEnvOpen(true);
      // let the animation play, then go to Q1
      setTimeout(() => setSlideId("q1"), 950);
    };

    return (
      <div style={bgStyle}>
        <div style={{ ...cardStyle, width: "min(760px, 92vw)", padding: 28 }}>
          <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
            <h1 style={{ ...titleStyle, fontSize: 28 }}>You’ve got mail 💌💖</h1>
            <p style={{ ...subtitleStyle, fontSize: 15 }}>
              Click the heart seal to open… 💘💘💘
            </p>
          </div>

          <div className="stage">
            {/* Letter (slides up out of the envelope) */}
            <div className={`letter ${envOpen ? "open" : ""}`}>
              <div className="letterHead">Dear Valentine… 💖</div>
              <div className="letterLine">I have something to ask you 🥺💘</div>
              <div className="letterLine">Open me… 😈💕</div>
            </div>

            {/* Envelope */}
            <div className={`env ${envOpen ? "open" : ""}`}>
              <div className="envBack" />
              <div className="envLeft" />
              <div className="envRight" />
              <div className="envFront" />
              <div className="envFlap" />

              {/* Heart seal */}
              <button
                className={`seal ${envOpen ? "open" : ""}`}
                onClick={handleSealClick}
                aria-label="Open envelope"
              >
                💗
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: "#777" }}>💘💕💘</div>

          <style>{`
            .stage {
              position: relative;
              margin-top: 18px;
              display: grid;
              place-items: center;
              height: 360px;
              perspective: 1200px;
              perspective-origin: center center;
            }

            /* Letter */
            .letter {
              position: absolute;
              width: min(420px, 82vw);
              height: 250px;
              border-radius: 18px;
              background: rgba(255, 255, 255, 0.96);
              border: 1px solid rgba(0, 0, 0, 0.10);
              box-shadow: 0 26px 70px rgba(0, 0, 0, 0.14);
              z-index: 2;
              display: grid;
              align-content: start;
              padding: 18px;
              text-align: left;

              /* starts mostly "inside" */
              transform: translateY(95px) scale(0.98);
              transition: transform 900ms cubic-bezier(0.18, 0.9, 0.2, 1);
            }

            .letter.open {
              transform: translateY(-78px) scale(1);
            }

            .letterHead {
              font-weight: 800;
              color: #333;
              margin-bottom: 10px;
            }
            .letterLine {
              color: #555;
              margin-top: 6px;
            }

            /* Envelope base */
            .env {
              position: relative;
              width: min(460px, 86vw);
              height: 270px;
              transform: translateY(18px);
              z-index: 3;
            }

            .envBack {
              position: absolute;
              inset: 0;
              border-radius: 18px;
              background: rgba(255, 255, 255, 0.78);
              border: 1px solid rgba(0, 0, 0, 0.10);
              box-shadow: 0 18px 50px rgba(0, 0, 0, 0.10);
              z-index: 1;
            }

            .envLeft,
            .envRight {
              position: absolute;
              inset: 0;
              border-radius: 18px;
              z-index: 2;
              opacity: 0.95;
            }

            .envLeft {
              clip-path: polygon(0 0, 55% 52%, 0 100%);
              background: rgba(255, 59, 122, 0.10);
            }
            .envRight {
              clip-path: polygon(100% 0, 45% 52%, 100% 100%);
              background: rgba(255, 59, 122, 0.10);
            }

            .envFront {
              position: absolute;
              inset: 0;
              border-radius: 18px;
              z-index: 4;
              clip-path: polygon(0 100%, 100% 100%, 50% 48%);
              background: rgba(255, 255, 255, 0.55);
              border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            }

            /* Top flap opens upward/back (video-style) */
            .envFlap {
              position: absolute;
              inset: 0;
              border-radius: 18px;
              z-index: 5;
              clip-path: polygon(0 0, 100% 0, 50% 52%);
              background: rgba(255, 59, 122, 0.14);
              transform-origin: top center;
              transform: rotateX(0deg);
              transition: transform 750ms cubic-bezier(0.2, 0.95, 0.2, 1);
              backface-visibility: hidden;
            }

            .env.open .envFlap {
              transform: rotateX(-155deg);
            }

            /* Heart seal */
            .seal {
              position: absolute;
              left: 50%;
              top: 52%;
              transform: translate(-50%, -50%);
              z-index: 6;
              width: 72px;
              height: 72px;
              border-radius: 999px;
              border: 1px solid rgba(0, 0, 0, 0.10);
              background: rgba(255, 59, 122, 0.92);
              color: #fff;
              box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
              cursor: pointer;
              font-size: 30px;
              display: grid;
              place-items: center;
              transition: transform 160ms ease, opacity 260ms ease;
            }

            .seal:hover {
              transform: translate(-50%, -50%) scale(1.06);
            }

            .seal.open {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.6);
              pointer-events: none;
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (slideId === "q6") {
    return (
      <div style={bgStyle}>
        {/* Animated dinosaurs in background — masked so they don't cross into the white card */}
        <style>{`
          @keyframes dino-walk-left {
            0% { transform: translateX(100vw) scaleX(1); }
            100% { transform: translateX(-120px) scaleX(1); }
          }
          @keyframes dino-walk-right {
            0% { transform: translateX(-120px) scaleX(-1); }
            100% { transform: translateX(100vw) scaleX(-1); }
          }
          @keyframes dino-curve-1 {
            0% { transform: translate(0, 0) scaleX(1); }
            25% { transform: translate(28vw, 12vh) scaleX(1); }
            50% { transform: translate(55vw, -8vh) scaleX(1); }
            75% { transform: translate(82vw, 18vh) scaleX(1); }
            100% { transform: translate(110vw, 5vh) scaleX(1); }
          }
          @keyframes dino-curve-2 {
            0% { transform: translate(100vw, 0) scaleX(-1); }
            25% { transform: translate(72vw, 15vh) scaleX(-1); }
            50% { transform: translate(45vw, -10vh) scaleX(-1); }
            75% { transform: translate(18vw, 20vh) scaleX(-1); }
            100% { transform: translate(-50px, 8vh) scaleX(-1); }
          }
          @keyframes dino-arc-3 {
            0% { transform: translate(0, -30px) scaleX(1); }
            33% { transform: translate(35vw, 25vh) scaleX(1); }
            66% { transform: translate(70vw, 50vh) scaleX(1); }
            100% { transform: translate(105vw, 105vh) scaleX(1); }
          }
          @keyframes dino-arc-4 {
            0% { transform: translate(100vw, -30px) scaleX(-1); }
            33% { transform: translate(65vw, 30vh) scaleX(-1); }
            66% { transform: translate(30vw, 55vh) scaleX(-1); }
            100% { transform: translate(-50px, 108vh) scaleX(-1); }
          }
          @keyframes dino-swerve-5 {
            0% { transform: translate(0, 0) scaleX(1); }
            20% { transform: translate(15vw, -15vh) scaleX(1); }
            40% { transform: translate(45vw, 5vh) scaleX(1); }
            60% { transform: translate(70vw, -10vh) scaleX(1); }
            80% { transform: translate(95vw, 8vh) scaleX(1); }
            100% { transform: translate(115vw, -5vh) scaleX(1); }
          }
          @keyframes dino-swerve-6 {
            0% { transform: translate(100vw, 0) scaleX(-1); }
            25% { transform: translate(75vw, -10vh) scaleX(-1); }
            50% { transform: translate(50vw, 6vh) scaleX(-1); }
            75% { transform: translate(25vw, -8vh) scaleX(-1); }
            100% { transform: translate(-80px, 0) scaleX(-1); }
          }
          @keyframes dino-loop-7 {
            0% { transform: translate(0, 50vh) scaleX(1); }
            25% { transform: translate(50vw, 25vh) scaleX(1); }
            50% { transform: translate(100vw, 50vh) scaleX(-1); }
            75% { transform: translate(50vw, 75vh) scaleX(-1); }
            100% { transform: translate(-50px, 50vh) scaleX(1); }
          }
          @keyframes dino-loop-8 {
            0% { transform: translate(100vw, 25vh) scaleX(-1); }
            33% { transform: translate(60vw, 55vh) scaleX(-1); }
            66% { transform: translate(20vw, 30vh) scaleX(1); }
            100% { transform: translate(-80px, 55vh) scaleX(1); }
          }
        `}</style>
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: 1,
            maskImage:
              "radial-gradient(ellipse 35% 28% at 50% 50%, transparent 99%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 35% 28% at 50% 50%, transparent 99%, black 100%)",
          }}
        >
          {[
            { emoji: "🦕", top: "6%", anim: "dino-walk-left", delay: 0 },
            { emoji: "🦖", top: "12%", anim: "dino-walk-right", delay: 1.2 },
            { emoji: "🦕", top: "82%", anim: "dino-walk-right", delay: 0.6 },
            { emoji: "🦖", top: "92%", anim: "dino-walk-left", delay: 1.8 },
            { emoji: "🦕", top: "4%", anim: "dino-curve-1", delay: 0.3 },
            { emoji: "🦖", top: "18%", anim: "dino-curve-2", delay: 2.1 },
            { emoji: "🦕", top: "0", anim: "dino-arc-3", delay: 1.5 },
            { emoji: "🦖", top: "0", anim: "dino-arc-4", delay: 2.8 },
            { emoji: "🦕", top: "25%", anim: "dino-swerve-5", delay: 3.2 },
            { emoji: "🦖", top: "96%", anim: "dino-swerve-6", delay: 0.9 },
            { emoji: "🦕", top: "0", anim: "dino-loop-7", delay: 2.4 },
            { emoji: "🦖", top: "0", anim: "dino-loop-8", delay: 1.8 },
            { emoji: "🦕", top: "8%", anim: "dino-curve-1", delay: 3.6 },
            { emoji: "🦖", top: "88%", anim: "dino-curve-2", delay: 4.2 },
            { emoji: "🦕", top: "30%", anim: "dino-swerve-5", delay: 0.5 },
            { emoji: "🦖", top: "72%", anim: "dino-swerve-6", delay: 2.9 },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "0",
                top: d.top,
                fontSize: "clamp(48px, 7vw, 72px)",
                animation: `${d.anim} ${10 + (i % 4) * 1.5}s ease-in-out infinite`,
                animationDelay: `${d.delay}s`,
              }}
            >
              {d.emoji}
            </div>
          ))}
        </div>
        <div style={{ ...cardStyle, width: "min(720px, 92vw)", position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>🎉💘🎉</div>
          <h1 style={{ ...titleStyle, fontSize: 28 }}>{SLIDES.q6.title}</h1>
          <p style={{ ...subtitleStyle, fontSize: 15 }}>{SLIDES.q6.subtitle}</p>

          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 16,
              background: "rgba(255, 59, 122, 0.08)",
              border: "1px solid rgba(255, 59, 122, 0.18)",
            }}
          >
            <div style={{ fontSize: 14, color: "#444" }}>
              💖💖💖 Totally legit prize claim portal 💖💖💖
            </div>

            <button
              onClick={() => setSlideId("s8")}
              style={{
                marginTop: 14,
                ...btnBase,
                background: "#ff3b7a",
                color: "white",
                minWidth: 220,
                fontSize: 18,
                padding: "14px 26px",
                fontWeight: 700,
              }}
            >
              Click here 💌
            </button>

            <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
              (not a scam) 😇💗
            </div>
          </div>

          <div style={{ marginTop: 18, fontSize: 12, color: "#777" }}>
            💗💕💗
          </div>
        </div>
      </div>
    );
  }

  if (slideId === "s8") {
    // Arrange 9 images in a circle around the center
    const imageCount = 9;
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    const radius = Math.min(w, h) * 0.35; // Circle radius - positioned to avoid white box
    const images = Array.from({ length: imageCount }, (_, i) => ({
      src: `/${i + 1}.jpg`,
      angle: (i * 360) / imageCount, // Distribute evenly around circle
    }));

    return (
      <div style={bgStyle}>
        {/* Semi-transparent images arranged in a circle behind the card */}
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: radius * 2,
            height: radius * 2,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {images.map((img, i) => {
            const angleRad = (img.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;
            const size = Math.min(radius * 0.7, 280); // Size of each circular image - bigger

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: "50%",
                  overflow: "hidden",
                  opacity: 0.5,
                  border: "2px solid rgba(255,255,255,0.3)",
                }}
              >
                <img
                  src={img.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    console.error(`Image ${i + 1} failed to load:`, e);
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle, width: "min(820px, 92vw)", position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>💌💘💌</div>
          <h1 style={{ ...titleStyle, fontSize: 28 }}>{SLIDES.s8.title}</h1>
          <p style={{ ...subtitleStyle, fontSize: 15 }}>{SLIDES.s8.subtitle}</p>

          <div style={{ marginTop: 16 }}>
            <textarea
              placeholder={`Dear Valentine… 💖\n\n[Write your full letter here]\n\n💘💘💘`}
              style={{
                width: "100%",
                minHeight: 320,
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.12)",
                padding: 16,
                fontSize: 15,
                lineHeight: 1.45,
                outline: "none",
                resize: "vertical",
                background: "rgba(255,255,255,0.95)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
            <button
              onClick={() => setSlideId("q1")}
              style={{ ...btnBase, background: "#ff3b7a", color: "white", minWidth: 180 }}
            >
              Restart 💞
            </button>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: "#777" }}>
            🩷🩷🩷
          </div>
        </div>
      </div>
    );
  }

  // --- Flying images for Q3 ---
  const flyingImages = [
    { src: "/lucy.webp", name: "lucy" },
    { src: "/me1.webp", name: "me1" },
    { src: "/me2.webp", name: "me2" },
    { src: "/me4.webp", name: "me4" },
    { src: "/me6.webp", name: "me6" },
    { src: "/me7.webp", name: "me7" },
    { src: "/me8.webp", name: "me8" },
    { src: "/me9.webp", name: "me9" },
    { src: "/me10.webp", name: "me10" },
    { src: "/me11.webp", name: "me11" },
    { src: "/shrek.webp", name: "shrek" },
  ];

  const meteors = slideId === "q3" && (
    <>
      <style>{`
        @keyframes fly-diagonal-1 {
          0% { transform: translate(-100px, -100px) rotate(0deg); opacity: 0.8; }
          100% { transform: translate(calc(100vw + 100px), calc(100vh + 100px)) rotate(360deg); opacity: 0.8; }
        }
        @keyframes fly-diagonal-2 {
          0% { transform: translate(calc(100vw + 100px), -100px) rotate(0deg); opacity: 0.8; }
          100% { transform: translate(-100px, calc(100vh + 100px)) rotate(-360deg); opacity: 0.8; }
        }
        @keyframes fly-horizontal-1 {
          0% { transform: translate(-150px, 0) rotate(0deg); opacity: 0.7; }
          100% { transform: translate(calc(100vw + 150px), 0) rotate(180deg); opacity: 0.7; }
        }
        @keyframes fly-horizontal-2 {
          0% { transform: translate(calc(100vw + 150px), 0) rotate(0deg); opacity: 0.7; }
          100% { transform: translate(-150px, 0) rotate(-180deg); opacity: 0.7; }
        }
        @keyframes fly-vertical-1 {
          0% { transform: translate(0, -150px) rotate(0deg); opacity: 0.75; }
          100% { transform: translate(0, calc(100vh + 150px)) rotate(180deg); opacity: 0.75; }
        }
        @keyframes fly-vertical-2 {
          0% { transform: translate(0, calc(100vh + 150px)) rotate(0deg); opacity: 0.75; }
          100% { transform: translate(0, -150px) rotate(-180deg); opacity: 0.75; }
        }
        @keyframes fly-arc-1 {
          0% { transform: translate(-100px, -100px) rotate(0deg); opacity: 0.8; }
          50% { transform: translate(50vw, 50vh) rotate(180deg); opacity: 0.9; }
          100% { transform: translate(calc(100vw + 100px), calc(100vh + 100px)) rotate(360deg); opacity: 0.8; }
        }
        @keyframes fly-arc-2 {
          0% { transform: translate(calc(100vw + 100px), -100px) rotate(0deg); opacity: 0.8; }
          50% { transform: translate(50vw, 50vh) rotate(-180deg); opacity: 0.9; }
          100% { transform: translate(-100px, calc(100vh + 100px)) rotate(-360deg); opacity: 0.8; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        {flyingImages.map((img, i) => {
          const animations = [
            "fly-diagonal-1",
            "fly-diagonal-2",
            "fly-horizontal-1",
            "fly-horizontal-2",
            "fly-vertical-1",
            "fly-vertical-2",
            "fly-arc-1",
            "fly-arc-2",
          ];
          const anim = animations[i % animations.length];
          const duration = 3 + (i % 3) * 0.5; // 3-4.5 seconds
          const delay = (i * 0.3) % 2; // Staggered delays
          const size = 80 + (i % 4) * 20; // 80-140px

          return (
            <img
              key={img.name}
              src={img.src}
              alt=""
              style={{
                position: "absolute",
                width: `${size}px`,
                height: "auto",
                animation: `${anim} ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}
              onError={(e) => {
                console.error(`Flying image failed to load: ${img.src}`, e);
                (e.target as HTMLImageElement).style.border = "2px solid red";
              }}
              onLoad={() => {
                console.log(`Flying image loaded: ${img.src}`);
              }}
            />
          );
        })}
      </div>
    </>
  );

  // --- Normal question slides (q1/q2/q3/q4/q5/q7) ---
  return (
    <div style={bgStyle}>
      {meteors}
      {slideId === "q1" && (
        <>
          <style>{`
            @keyframes float-gentle {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
          <img
            src="/us.webp"
            alt=""
            style={{
              position: "fixed",
              left: "calc(50% + min(310px, 46vw) + 20px)",
              top: "calc(50vh - 200px)",
              width: "clamp(120px, 15vw, 180px)",
              height: "auto",
              zIndex: 3,
              pointerEvents: "none",
              animation: "float-gentle 3s ease-in-out infinite",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
            }}
            onError={(e) => {
              console.error("Us image failed to load. Path:", "/us.webp", e);
            }}
            onLoad={() => {
              console.log("Us image loaded successfully");
            }}
          />
        </>
      )}
      {slideId === "q3" && (
        <style>{`
          @keyframes no-shake {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-6px) translateY(-2px); }
            20% { transform: translateX(6px) translateY(2px); }
            30% { transform: translateX(-6px) translateY(2px); }
            40% { transform: translateX(6px) translateY(-2px); }
            50% { transform: translateX(-5px) translateY(0); }
            60% { transform: translateX(5px) translateY(-3px); }
            70% { transform: translateX(-5px) translateY(3px); }
            80% { transform: translateX(6px) translateY(0); }
            90% { transform: translateX(-6px) translateY(-2px); }
          }
        `}</style>
      )}
      <div ref={cardRef} style={cardStyle}>
        <div style={{ fontSize: 46, marginBottom: 8 }}>💗</div>
        <h1 style={titleStyle}>{slide.title}</h1>
        {slide.subtitle && <p style={subtitleStyle}>{slide.subtitle}</p>}

        {/* Q5: Floating ring instead of Yes button */}
        {slideId === "q5" && (
          <>
            <style>{`
              @keyframes ring-bob {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                25% { transform: translateY(-8px) rotate(3deg); }
                50% { transform: translateY(-4px) rotate(-3deg); }
                75% { transform: translateY(-10px) rotate(2deg); }
              }
            `}</style>
            <div
              ref={ringRef}
              onClick={onYesClick}
              style={{
                position: "fixed",
                left: "50%",
                top: "50%",
                fontSize: "clamp(60px, 8vw, 100px)",
                cursor: "pointer",
                zIndex: 10,
                pointerEvents: "auto",
                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
                userSelect: "none",
                transform: `translate(calc(-50% + ${ringPos.x}px), calc(-50% + ${ringPos.y}px))`,
                transition: "transform 1s ease-in-out",
              }}
            >
              <div
                style={{
                  animation: "ring-bob 2s ease-in-out infinite",
                  display: "inline-block",
                }}
              >
                ❤️
              </div>
            </div>
          </>
        )}

        <div style={buttonRowStyle}>
          {/* YES - hidden on Q5 */}
          {slideId !== "q5" && (
            <button
              ref={yesButtonRef}
              style={yesStyle}
              onClick={onYesClick}
            >
              {slide.yesLabel ?? "Yes 💖"}
            </button>
          )}

          {/* NO */}
          {slideId === "q3" ? (
            <div
              style={{
                display: "inline-flex",
                animation: "no-shake 0.1s ease-in-out infinite",
              }}
            >
              <button style={noStyle} onClick={onNoClick}>
                {slide.noLabel ?? "No 💔"}
              </button>
            </div>
          ) : (
            <button
              style={noStyle}
              onClick={onNoClick}
              onMouseEnter={() => {
                if (slide.noFliesUnclickable) return;
              }}
            >
              {slide.noLabel ?? "No 💔"}
            </button>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
          💘💕💘
        </div>
      </div>
    </div>
  );
}
