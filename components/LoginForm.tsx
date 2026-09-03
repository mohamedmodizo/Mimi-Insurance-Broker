"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";

export function LoginForm({
  demoEmail,
  allowDemoLogin,
  allowDemoMfa,
  returnHref
}: {
  demoEmail: string;
  allowDemoLogin: boolean;
  allowDemoMfa: boolean;
  returnHref?: string;
}) {
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [mfaHelp, setMfaHelp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Login failed.");
      return;
    }
    window.location.href = "/broker";
  }

  async function generateDemoMfa() {
    setMfaLoading(true);
    setError("");
    setMfaHelp("");
    const response = await fetch("/api/auth/demo-mfa", { method: "GET", cache: "no-store" });
    const payload = (await response.json()) as { code?: string; expiresInSeconds?: number; error?: string };
    setMfaLoading(false);
    if (!response.ok || !payload.code) {
      setError(payload.error || "MFA code generation failed.");
      return;
    }
    setOtp(payload.code);
    setMfaHelp(`Demo MFA code filled. It expires in about ${payload.expiresInSeconds ?? 30} seconds.`);
  }

  async function demoLogin() {
    setDemoLoading(true);
    setError("");
    const response = await fetch("/api/auth/demo-login", { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setDemoLoading(false);
    if (!response.ok) {
      setError(payload.error || "Demo login failed.");
      return;
    }
    window.location.href = "/broker";
  }

  return (
    <form className="auth-box" onSubmit={login}>
      {returnHref && (
        <Link className="auth-return-link" href={returnHref}>
          <ArrowLeft size={18} />
          Back to access choices
        </Link>
      )}
      <div className="brand-row">
        <div className="brand-mark" aria-hidden="true">
          <LockKeyhole size={24} />
        </div>
        <div>
          <p className="eyebrow">Broker security</p>
          <h1>Sign in</h1>
        </div>
      </div>
      <label className="question-label" htmlFor="email">
        Email
      </label>
      <input className="text-field" id="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      <label className="question-label" htmlFor="password">
        Password
      </label>
      <div className="password-field-wrap">
        <input
          autoComplete="current-password"
          className="text-field password-field"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          type={showPassword ? "text" : "password"}
          value={password}
        />
        <button
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="password-toggle"
          onClick={() => setShowPassword((current) => !current)}
          title={showPassword ? "Hide password" : "Show password"}
          type="button"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <label className="question-label" htmlFor="otp">
        MFA code
      </label>
      <input className="text-field" id="otp" inputMode="numeric" onChange={(event) => setOtp(event.target.value)} value={otp} />
      {allowDemoMfa && (
        <div className="demo-mfa-row">
          <button className="secondary-local-button full-width" disabled={mfaLoading} onClick={generateDemoMfa} type="button">
            {mfaLoading ? "Generating..." : "Generate Demo MFA Code"}
          </button>
          <p>This helper is for test validation only. Real broker users use their own authenticator app.</p>
        </div>
      )}
      {mfaHelp && <p className="success-text">{mfaHelp}</p>}
      {error && <p className="error-text">{error}</p>}
      <button className="primary-button full-width" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign In"}
      </button>
      {allowDemoLogin && (
        <div className="demo-login-box">
          <strong>Local demo access</strong>
          <p>Use this only for the local MVP demo. Production keeps MFA enforced.</p>
          <button className="secondary-local-button full-width" disabled={demoLoading} onClick={demoLogin} type="button">
            {demoLoading ? "Opening demo..." : "Use Demo Broker Login"}
          </button>
        </div>
      )}
    </form>
  );
}
