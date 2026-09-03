"use client";

import { ExternalLink, MapPin, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

type InsurerSpotlight = {
  name: string;
  domain: string;
  description: string;
  specialties: string;
  accent: string;
};

// Featured Kenyan market directory. Descriptions are intentionally general and do not imply endorsement.
const insurers: InsurerSpotlight[] = [
  { name: "Jubilee Insurance", domain: "jubileeinsurance.com", description: "General, health, life and pension solutions for individuals, families and businesses.", specialties: "Health / Motor / Life", accent: "#b52836" },
  { name: "Britam", domain: "britam.com", description: "Insurance and financial services across life, health, general insurance and investments.", specialties: "Life / Health / General", accent: "#e45b2f" },
  { name: "CIC Insurance", domain: "cic.co.ke", description: "Co-operative-focused protection for personal, medical, motor, life and business needs.", specialties: "Motor / Medical / Business", accent: "#006b5a" },
  { name: "APA Insurance", domain: "apainsurance.com", description: "Personal and commercial general insurance products, including motor, medical and property cover.", specialties: "Motor / Medical / Property", accent: "#e0a323" },
  { name: "AAR Insurance", domain: "aar-insurance.com", description: "Medical and health insurance support for individuals, families and corporate clients.", specialties: "Medical / Wellness / Travel", accent: "#9e1b32" },
  { name: "ICEA LION", domain: "icealion.co.ke", description: "Life assurance, pensions and general insurance solutions for personal and corporate clients.", specialties: "Life / Pensions / General", accent: "#1e3f62" },
  { name: "Heritage Insurance", domain: "heritage.co.ke", description: "General insurance solutions across motor, property, travel, personal accident and business risks.", specialties: "Motor / Property / Travel", accent: "#173f73" },
  { name: "GA Insurance", domain: "gainsurance.co.ke", description: "General insurance for individuals, SMEs and corporate clients in Kenya.", specialties: "Motor / Fire / Liability", accent: "#008c95" },
  { name: "Old Mutual Kenya", domain: "oldmutual.co.ke", description: "Protection, savings, investment and financial wellbeing solutions for the Kenyan market.", specialties: "Life / Savings / Investments", accent: "#006a59" },
  { name: "Sanlam Allianz", domain: "sanlamallianz.com", description: "General and life insurance capabilities serving personal and commercial protection needs.", specialties: "General / Life / Business", accent: "#00635e" },
  { name: "Madison Insurance", domain: "madison.co.ke", description: "General and life insurance products including motor, medical, property and personal protection.", specialties: "Motor / Medical / Life", accent: "#1d4d91" },
  { name: "Kenya Orient", domain: "kenyaorient.com", description: "General insurance services for motor, property, marine, travel and commercial risks.", specialties: "Motor / Marine / Property", accent: "#d47b2c" },
  { name: "UAP Old Mutual", domain: "uapoldmutual.com", description: "General insurance and health protection products for people and businesses.", specialties: "Health / Motor / Business", accent: "#253c87" },
  { name: "Pacis Insurance", domain: "paciskenya.com", description: "General insurance products supporting personal, institutional and commercial clients.", specialties: "Motor / Property / Liability", accent: "#3c7f47" },
  { name: "Liberty Life Assurance", domain: "liberty.co.ke", description: "Life assurance and financial protection solutions for individuals and employers.", specialties: "Life / Group Cover / Pensions", accent: "#6c1f5b" }
];

export function InsurerAdRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const insurer = insurers[activeIndex];

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % insurers.length);
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
        {insurers.map((item, index) => <span key={item.name} className={index === activeIndex ? "active" : ""} />)}
      </div>
    </section>
  );
}
