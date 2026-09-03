import type { CSSProperties } from "react";
import { kenyaInsurers } from "@/lib/kenyaInsurers";

export function InsurerBackdrop() {
  return (
    <div className="insurer-backdrop" aria-hidden="true">
      <div className="insurer-backdrop-track">
        {[...kenyaInsurers, ...kenyaInsurers].map((insurer, index) => (
          <div
            className="insurer-backdrop-tile"
            key={`${insurer.name}-${index}`}
            style={{ "--insurer-accent": insurer.accent } as CSSProperties}
          >
            <img src={`https://www.google.com/s2/favicons?domain=${insurer.domain}&sz=128`} alt="" />
            <span>{insurer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
