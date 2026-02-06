"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SlideId = "q1" | "q2" | "q3" | "q4" | "q5" | "q7" | "q6" | "s8";

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
    subtitle: "Pretty Please??...... 🥺👉👈💗",
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
  const [slideId, setSlideId] = useState<SlideId>("q1");
  const slide = SLIDES[slideId];

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
  const [yesPos, setYesPos] = useState({ x: 0, y: 0 }); // translate px
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  // reset positions when slide changes
  useEffect(() => {
    setYesPos({ x: 0, y: 0 });
    setNoPos({ x: 0, y: 0 });
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

  // Q4: Yes dodges on mouse movement anywhere on the page; moves all over viewport
  const dodgeYes = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    const h = typeof window !== "undefined" ? window.innerHeight : 800;
    setYesPos(randomOffset(w * 0.9, h * 0.9));
  };

  // Q4: Listen to mousemove anywhere on page so Yes dodges faster / more reactively
  useEffect(() => {
    if (!slide.yesDodgesMouse) return;
    const throttleMs = 40; // Dodge every ~40ms for fast, reactive movement
    let last = 0;
    const handleMove = () => {
      const now = performance.now();
      if (now - last < throttleMs) return;
      last = now;
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      const h = typeof window !== "undefined" ? window.innerHeight : 800;
      setYesPos(randomOffset(w * 0.9, h * 0.9));
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
    overflow: "visible",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    margin: "0 0 10px",
    color: "#111",
    lineHeight: 1.2,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: 0,
    color: "#555",
    fontSize: "14px",
    whiteSpace: "pre-line",
  };

  const buttonRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    marginTop: "18px",
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

  // --- Q6 + Slide 8 layouts ---
  if (slideId === "q6") {
    return (
      <div style={bgStyle}>
        <div style={{ ...cardStyle, width: "min(720px, 92vw)" }}>
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
    return (
      <div style={bgStyle}>
        <div style={{ ...cardStyle, width: "min(820px, 92vw)" }}>
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

  // --- Normal question slides (q1/q2/q3/q4/q5/q7) ---
  return (
    <div style={bgStyle}>
      <div ref={cardRef} style={cardStyle}>
        <div style={{ fontSize: 46, marginBottom: 8 }}>💗</div>
        <h1 style={titleStyle}>{slide.title}</h1>
        {slide.subtitle && <p style={subtitleStyle}>{slide.subtitle}</p>}

        <div style={buttonRowStyle}>
          {/* YES */}
          <button
            style={yesStyle}
            onClick={onYesClick}
            onMouseEnter={() => {
              if (slide.yesDodgesMouse) dodgeYes();
            }}
            onMouseMove={() => {
              if (slide.yesDodgesMouse) dodgeYes();
            }}
          >
            {slide.yesLabel ?? "Yes 💖"}
          </button>

          {/* NO */}
          <button
            style={noStyle}
            onClick={onNoClick}
            // On Q7 it's unclickable; these are harmless
            onMouseEnter={() => {
              if (slide.noFliesUnclickable) return;
            }}
          >
            {slide.noLabel ?? "No 💔"}
          </button>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "#777" }}>
          💘💕💘
        </div>
      </div>
    </div>
  );
}
