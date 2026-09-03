"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { kenyaInsurers } from "@/lib/kenyaInsurers";

export function InsurerBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"spotlight" | "marquee">("spotlight");
  const insurer = kenyaInsurers[activeIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (phase === "marquee") {
        setActiveIndex(0);
        setPhase("spotlight");
        return;
      }

      if (activeIndex === kenyaInsurers.length - 1) {
        setPhase("marquee");
        return;
      }

      setActiveIndex((current) => current + 1);
    }, phase === "marquee" ? 18000 : 5000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, phase]);

  return (
    <div className={`insurer-backdrop ${phase === "marquee" ? "is-marquee" : ""}`} style={{ "--insurer-accent": insurer.accent } as CSSProperties} aria-hidden="true">
      {phase === "spotlight" ? (
        <>
          <div className="insurer-backdrop-glow" />
          <div className="insurer-backdrop-scene" key={insurer.name}>
            <div className="insurer-backdrop-halo" />
            <img src={`https://www.google.com/s2/favicons?domain=${insurer.domain}&sz=256`} alt="" />
            <span className="insurer-backdrop-name">{insurer.name}</span>
            <span className="insurer-backdrop-country">KENYA / INSURANCE</span>
          </div>
        </>
      ) : (
        <div className="insurer-marquee">
          <div className="insurer-marquee-track">
            {kenyaInsurers.map((marqueeInsurer) => (
              <div className="insurer-marquee-card" key={marqueeInsurer.name} style={{ "--insurer-accent": marqueeInsurer.accent } as CSSProperties}>
                <img src={`https://www.google.com/s2/favicons?domain=${marqueeInsurer.domain}&sz=256`} alt="" />
                <span>{marqueeInsurer.name}</span>
                <small>KENYA / INSURANCE</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
