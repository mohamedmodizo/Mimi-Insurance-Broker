"use client";

import { ExternalLink, MapPin, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { kenyaInsurers } from "@/lib/kenyaInsurers";

export function InsurerAdRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const insurer = kenyaInsurers[activeIndex];

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % kenyaInsurers.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="insurer-spotlight" style={{ "--insurer-accent": insurer.accent } as React.CSSProperties} aria-label="Featured Kenya insurer">
      <div className="insurer-spotlight-art">
        <img src={`https://www.google.com/s2/favicons?domain=${insurer.domain}&sz=128`} alt={`${insurer.name} logo`} />
        <span>KENYA</span>
      </div>
      <div className="insurer-spotlight-copy">
        <div className="insurer-meta"><MapPin size={13} /> Featured insurer</div>
        <h2>{insurer.name}</h2>
        <p>{insurer.description}</p>
        <strong>{insurer.specialties}</strong>
      </div>
      <div className="insurer-spotlight-actions">
        <a href={`https://${insurer.domain}`} target="_blank" rel="noreferrer" aria-label={`Visit ${insurer.name} website`} title={`Visit ${insurer.name} website`}>
          <ExternalLink size={16} />
        </a>
        <button type="button" onClick={() => setPaused((current) => !current)} aria-label={isPaused ? "Resume insurer adverts" : "Pause insurer adverts"} title={isPaused ? "Resume adverts" : "Pause adverts"}>
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
      <div className="insurer-progress" aria-hidden="true">
        {kenyaInsurers.map((item, index) => <span key={item.name} className={index === activeIndex ? "active" : ""} />)}
      </div>
    </section>
  );
}
