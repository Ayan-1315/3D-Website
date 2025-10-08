import React, { useMemo } from "react";
import "./RightMenu.css";

/**
 * RightMenu: themed for Japanese paper / ink brush aesthetic.
 */
export default function RightMenu({ activePage, onOpenPage, onBack }) {
  const items = useMemo(() => ["About", "Projects", "Contact"], []);

  const handleClick = (e, label) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const anchor = { x: (rect.left + rect.width / 2) / vw, y: (rect.top + rect.height / 2) / vh };
    onOpenPage?.(label, anchor);
  };

  return (
    <aside className="right-menu">
      <div className="brand">AYAN</div>

      <ul className="menu">
        {items.map((label) => (
          <li key={label}>
            <button
              className={`menu-item ${activePage === label ? "active" : ""}`}
              onClick={(e) => handleClick(e, label)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      {activePage && (
        <button className="back-fab" onClick={onBack} aria-label="Back">戻る</button>
      )}
    </aside>
  );
}
