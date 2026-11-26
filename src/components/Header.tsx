"use client";
import { useEffect, useState } from "react";
import { onReady } from "@/lib/anim";

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 12 12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Cta({ href, children, className = "", onClick, type, disabled }: {
  href?: string; children: React.ReactNode; className?: string;
  onClick?: () => void; type?: "submit" | "button"; disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="cta-text">{children}</span>
      <span className="cta-arrow"><Arrow /></span>
    </>
  );
  if (href) return <a className={`cta ${className}`} href={href} onClick={onClick}>{inner}</a>;
  return <button className={`cta ${className}`} type={type ?? "button"} onClick={onClick} disabled={disabled}>{inner}</button>;
}

export default function Header({ host, logo, timing, mapUrl }: { host: string; logo: string; timing: [string, string]; mapUrl: string }) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => onReady(() => setShow(true)), []);
  useEffect(() => {
    document.documentElement.classList.toggle("menu-lock", open);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`header ${show ? "show" : ""} ${open ? "menu-open" : ""}`}>
      <nav className="nav">
        <div className="nav-links">
          <a className="nav-link" href="#program"><span>The afternoon</span></a>
          <a className="nav-link" href={mapUrl} target="_blank" rel="noopener"><span>Location ↗</span></a>
        </div>
        <a className="nav-logo" href="#top" aria-label={host}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={host} width={286} height={278} />
        </a>
        <div className="nav-right">
          <div className="nav-timing">{timing[0]}<br />{timing[1]}</div>
          <Cta href="#rsvp">RSVP</Cta>
          <button className="ham" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            <span />
          </button>
        </div>
      </nav>
      <div className="ham-menu" aria-hidden={!open}>
        <a className="nav-link" href="#program" onClick={close}><span>The afternoon</span></a>
        <a className="nav-link" href="#voices" onClick={close}><span>From the bar</span></a>
        <a className="nav-link" href={mapUrl} target="_blank" rel="noopener" onClick={close}><span>Location ↗</span></a>
        <Cta href="#rsvp" onClick={close}>RSVP</Cta>
        <p>{timing[0]}<br />{timing[1]}</p>
      </div>
    </header>
  );
}
