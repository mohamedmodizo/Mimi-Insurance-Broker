"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { kenyaInsurers } from "@/lib/kenyaInsurers";
import { insuranceScenes } from "@/lib/insuranceScenes";

const MARQUEE_DURATION_MS = 36000;
const PHOTO_INTERVAL_MS = 9000;

export function InsurerBackdrop({ variant = "insurers" }: { variant?: "insurers" | "campaign" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<"spotlight" | "marquee">("spotlight");
  const [photoIndex, setPhotoIndex] = useState(0);
  const insurer = kenyaInsurers[activeIndex % kenyaInsurers.length];
  const scene = insuranceScenes[variant === "campaign" ? activeIndex % insuranceScenes.length : photoIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (variant === "campaign") {
        setActiveIndex((current) => (current + 1) % insuranceScenes.length);
        return;
      }

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
    }, phase === "marquee" ? MARQUEE_DURATION_MS : 5000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, phase, variant]);

  useEffect(() => {
    if (variant === "campaign" || phase !== "marquee") return;

    const nextPhoto = () => {
      setPhotoIndex((current) => {
        const offset = 1 + Math.floor(Math.random() * (insuranceScenes.length - 1));
        return (current + offset) % insuranceScenes.length;
      });
    };

    nextPhoto();
    const timer = window.setInterval(nextPhoto, PHOTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [phase, variant]);

  return (
    <div
      className={`insurer-backdrop ${variant === "campaign" ? "is-campaign" : phase === "marquee" ? "is-marquee" : ""}`}
      style={{ "--insurer-accent": insurer.accent, "--insurance-scene-accent": scene.accent } as CSSProperties}
      aria-hidden="true"
    >
      {variant === "campaign" ? (
        <div
          className="insurer-campaign-scene"
          key={scene.type}
          style={{ "--insurance-scene-accent": scene.accent, backgroundImage: `url(${scene.image})` } as CSSProperties}
        >
          <div className="insurer-campaign-scrim" />
          <div className="insurer-campaign-caption">
            <span>Insurance for every chapter</span>
            <strong>{scene.slogan}</strong>
            <small>
              {scene.type} · {scene.description}
            </small>
          </div>
        </div>
      ) : phase === "spotlight" ? (
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
          <div
            className="insurance-photo-stage"
            key={scene.type}
            style={{ "--insurance-scene-accent": scene.accent, backgroundImage: `url(${scene.image})` } as CSSProperties}
          >
            <div className="insurance-photo-scrim" />
            <div className="insurance-photo-caption">
              <span>Coverage spotlight</span>
              <strong>{scene.type}</strong>
              <small>{scene.description}</small>
            </div>
          </div>
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
