"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { kenyaInsurers } from "@/lib/kenyaInsurers";

export function InsurerBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const insurer = kenyaInsurers[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % kenyaInsurers.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="insurer-backdrop" style={{ "--insurer-accent": insurer.accent } as CSSProperties} aria-hidden="true">
      <div className="insurer-backdrop-glow" />
      <div className="insurer-backdrop-scene" key={insurer.name}>
        <div className="insurer-backdrop-halo" />
        <img src={`https://www.google.com/s2/favicons?domain=${insurer.domain}&sz=256`} alt="" />
        <span className="insurer-backdrop-name">{insurer.name}</span>
        <span className="insurer-backdrop-country">KENYA / INSURANCE</span>
      </div>
    </div>
  );
}
