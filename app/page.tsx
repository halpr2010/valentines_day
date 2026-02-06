"use client";

import { useMemo, useState } from "react";

const FLOW = {
  start: {
    id: "start",
    title: "Do you want to answer a few quick questions?",
    subtitle: "It’s just yes/no — takes 10 seconds.",
    icon: "✅",
    yesLabel: "Yes",
    noLabel: "No",
    yesNext: "q1",
    noNext: "no_1",
  },

  q1: {
    id: "q1",
    title: "Are you shopping for yourself?",
    subtitle: "",
    icon: "🧍",
    yesNext: "q2_self",
    noNext: "q2_gift",
  },

  q2_self: {
    id: "q2_self",
    title: "Do you prefer something practical?",
    subtitle: "",
    icon: "🧰",
    yesNext: "result_practical",
    noNext: "result_fun",
  },

  q2_gift: {
    id: "q2_gift",
    title: "Is it for someone you know well?",
    subtitle: "",
    icon: "🎁",
    yesNext: "result_personal",
    noNext: "result_safe",
  },

  no_1: {
    id: "no_1",
    title: "You sure? 😅",
    subtitle: "It’s honestly very quick.",
    icon: "👀",
    yesLabel: "Ok fine",
    noLabel: "Nope",
    yesNext: "q1",
    noNext: "no_2",
  },

  no_2: {
    id: "no_2",
    title: "Last chance…",
    subtitle: "The ‘No’ button might get suspicious now.",
    icon: "😈",
    yesLabel: "Ok",
    noLabel: "Still no",
    yesNext: "q1",
    noNext: "no_3",
  },

  no_3: {
    id: "no_3",
    title: "Alright then 😤",
    subtitle: "Try clicking ‘No’ now…",
    icon: "🫣",
    yesLabel: "Yes",
    noLabel: "No",
    yesNext: "q1",
    noNext: "no_3", // loop
    dodgeNo: true,  // activates runaway behavior
  },

  result_practical: {
    id: "result_practical",
    title: "Recommendation: Practical pick ✅",
    subtitle: "You value usefulness and clarity.",
    icon: "📦",
    isTerminal: true,
  },
  result_fun: {
    id: "result_fun",
    title: "Recommendation: Fun pick 🎉",
    subtitle: "You like novelty and vibes.",
    icon: "🎈",
    isTerminal: true,
  },
  result_personal: {
    id: "result_personal",
    title: "Recommendation: Personal gift 💝",
    subtitle: "Go meaningful — something tailored.",
    icon: "🫶",
    isTerminal: true,
  },
  result_safe: {
    id: "result_safe",
    title: "Recommendation: Safe gift 👍",
    subtitle: "Keep it universal — can’t go wrong.",
    icon: "🎀",
    isTerminal: true,
  },
};

export default function Page() {
  const [currentId, setCurrentId] = useState("start");
  const [noClicks, setNoClicks] = useState(0);
  const node = FLOW[currentId];

  const [noPos, setNoPos] = useState({ x: 0, y: 0 });

  const yesLabel = node.yesLabel ?? "Yes";
  const noLabel = node.noLabel ?? "No";

  const isTerminal = !!node.isTerminal;

  const moveNo = () => {
    const chaos = Math.min(1, noClicks / 8);
    const maxX = 150;
    const maxY = 70;

    const rand = (m) => (Math.random() * 2 - 1) * m * (0.35 + chaos);
    setNoPos({ x: rand(maxX), y: rand(maxY) });
  };

  const onYes = () => {
    if (node.yesNext) setCurrentId(node.yesNext);
  };

  const onNo = () => {
    setNoClicks((c) => c + 1);

    if (node.dodgeNo) {
      moveNo();
      return;
    }

    if (node.noNext) setCurrentId(node.noNext);
  };

  const reset = () => {
    setCurrentId("start");
    setNoClicks(0);
    setNoPos({ x: 0, y: 0 });
  };

  const bgStyle = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at 20% 20%, #ffd1e1, transparent 40%), radial-gradient(circle at 80% 30%, #f8b7ff, transparent 40%), linear-gradient(180deg, #ffd6e6, #f6d8ff)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
  };

  const cardStyle = {
    width: "min(560px, 92vw)",
    padding: "28px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.88)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  };

  const buttonRowStyle = {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    marginTop: "18px",
    position: "relative",
    height: "56px",
  };

  const btnBase = {
    border: "none",
    borderRadius: "999px",
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    minWidth: "120px",
    transition: "transform 120ms ease",
  };

  const yesStyle = { ...btnBase, background: "#ff3b7a", color: "white" };
  const noStyle = {
    ...btnBase,
    background: "#e9e9ef",
    color: "#222",
    transform: `translate(${noPos.x}px, ${noPos.y}px)`,
  };

  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: "44px", marginBottom: "10px" }}>
          {node.icon ?? "💖"}
        </div>

        <h1 style={{ fontSize: "22px", margin: "0 0 10px", color: "#111" }}>
          {node.title}
        </h1>

        {node.subtitle && (
          <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>
            {node.subtitle}
          </p>
        )}

        {!isTerminal ? (
          <div style={buttonRowStyle}>
            <button style={yesStyle} onClick={onYes}>
              {yesLabel}
            </button>

            <button
              style={noStyle}
              onMouseEnter={() => {
                if (node.dodgeNo) moveNo();
              }}
              onMouseMove={() => {
                if (node.dodgeNo) moveNo();
              }}
              onClick={onNo}
            >
              {noLabel}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "18px" }}>
            <button style={yesStyle} onClick={reset}>
              Restart
            </button>
          </div>
        )}

        <div style={{ marginTop: "18px", fontSize: "12px", color: "#777" }}>
          Step: <strong>{currentId}</strong>
        </div>
      </div>
    </div>
  );
}
