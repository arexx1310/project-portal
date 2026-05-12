import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, ArrowRight, BookOpen, Users,
  ClipboardList, BarChart3, ShieldCheck, Clock,
} from "lucide-react";

/* ── stagger-in hook ── */
const useVisible = (delay = 0) => {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return v;
};

/* ── SVG hero illustration ── */
const HeroIllustration = () => (
  <svg viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", maxWidth: 520, display: "block" }}>
    {/* grid */}
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={`h${i}`} x1="0" y1={i * 44} x2="520" y2={i * 44} stroke="#1e3a5f" strokeWidth="0.4" />
    ))}
    {Array.from({ length: 13 }).map((_, i) => (
      <line key={`v${i}`} x1={i * 43} y1="0" x2={i * 43} y2="400" stroke="#1e3a5f" strokeWidth="0.4" />
    ))}

    {/* main card */}
    <rect x="40" y="30" width="400" height="300" rx="14" fill="#0d2035" stroke="#1e3f6e" strokeWidth="1" />

    {/* top bar */}
    <rect x="40" y="30" width="400" height="46" rx="14" fill="#112844" />
    <rect x="40" y="60" width="400" height="16" fill="#112844" />
    <circle cx="65" cy="53" r="6" fill="#ef4444" opacity=".8" />
    <circle cx="83" cy="53" r="6" fill="#f59e0b" opacity=".8" />
    <circle cx="101" cy="53" r="6" fill="#22c55e" opacity=".8" />
    <text x="128" y="57" fill="#3b6ea5" fontSize="10.5" fontFamily="monospace" letterSpacing=".04em">BTP / MTP Project Portal</text>

    {/* sidebar */}
    <rect x="40" y="76" width="76" height="254" fill="#091d30" />
    {["Dashboard", "Projects", "Groups", "Reports", "Settings"].map((label, i) => (
      <g key={label}>
        <rect x="48" y={90 + i * 44} width="60" height="30" rx="6"
          fill={i === 0 ? "#1e3f6e" : "transparent"} />
        <rect x="56" y={101 + i * 44} width={[40, 32, 28, 34, 30][i]} height="7" rx="2"
          fill={i === 0 ? "#6ea8fe" : "#1e3a5f"} />
      </g>
    ))}

    {/* content header */}
    <text x="132" y="100" fill="#94b8d8" fontSize="9" fontFamily="monospace" letterSpacing=".08em">ACTIVE PROJECTS</text>

    {/* project bars */}
    {[
      { name: "Machine Learning Pipeline", w: 150, pct: "78%", color: "#6ea8fe" },
      { name: "IoT Smart Campus",          w: 107, pct: "55%", color: "#34d399" },
      { name: "NLP Sentiment Engine",      w: 174, pct: "90%", color: "#a78bfa" },
      { name: "Blockchain Auth System",    w: 77,  pct: "40%", color: "#f59e0b" },
    ].map((p, i) => (
      <g key={i}>
        <text x="132" y={120 + i * 46} fill="#64748b" fontSize="8" fontFamily="monospace">{p.name}</text>
        <rect x="132" y={126 + i * 46} width="193" height="7" rx="3.5" fill="#1e3a5f" />
        <rect x="132" y={126 + i * 46} width={p.w}  height="7" rx="3.5" fill={p.color} opacity=".85" />
        <text x={132 + p.w + 6} y={134 + i * 46} fill={p.color} fontSize="7.5" fontFamily="monospace">{p.pct}</text>
      </g>
    ))}

    {/* stat strip */}
    {[
      { x: 132, label: "Total",  val: "36" },
      { x: 196, label: "Active", val: "22" },
      { x: 260, label: "Review", val: "8"  },
      { x: 324, label: "Done",   val: "6"  },
    ].map((c) => (
      <g key={c.x}>
        <rect x={c.x} y="312" width="56" height="44" rx="7" fill="#112844" stroke="#1e3f6e" strokeWidth=".6" />
        <text x={c.x + 28} y="329" fill="#475569" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{c.label}</text>
        <text x={c.x + 28} y="347" fill="#6ea8fe" fontSize="15"  fontFamily="monospace" textAnchor="middle" fontWeight="bold">{c.val}</text>
      </g>
    ))}

    {/* floating toast */}
    <rect x="310" y="268" width="152" height="62" rx="10" fill="#060f1e" stroke="#6ea8fe" strokeWidth=".8" />
    <circle cx="327" cy="287" r="8" fill="rgba(110,168,254,0.12)" />
    <circle cx="327" cy="287" r="4" fill="#6ea8fe" />
    <text x="341" y="283" fill="#6ea8fe"  fontSize="8.5" fontFamily="monospace">Proposal submitted</text>
    <text x="341" y="295" fill="#475569"  fontSize="7.5" fontFamily="monospace">Group 7 · MTP Phase 2</text>
    <rect x="320" y="307" width="56" height="14" rx="4" fill="rgba(110,168,254,0.1)" />
    <text x="348" y="318" fill="#6ea8fe" fontSize="7.5" fontFamily="monospace" textAnchor="middle">Review →</text>

    {/* decorative orbs */}
    <circle cx="460" cy="50"  r="60" fill="rgba(99,102,241,0.04)" />
    <circle cx="50"  cy="370" r="55" fill="rgba(99,102,241,0.04)" />
    <circle cx="480" cy="380" r="35" fill="rgba(30,63,110,0.5)" />
  </svg>
);

/* ── feature list ── */
const FEATURES = [
  { icon: <BookOpen  size={20} />, title: "BTP & MTP Proposals",   desc: "Submit and track project proposals through structured departmental approval workflows." },
  { icon: <Users     size={20} />, title: "Group Formation",        desc: "Form teams, send peer invites, and get assigned to faculty supervisors seamlessly." },
  { icon: <ClipboardList size={20} />, title: "Supervisor Reviews", desc: "Faculty review submissions, provide structured feedback, and approve project milestones." },
  { icon: <BarChart3 size={20} />, title: "Progress Analytics",     desc: "Visual dashboards track every group's status, submission history, and completion rate." },
  { icon: <ShieldCheck size={20} />, title: "Role-based Access",    desc: "Separate, secure portals for students, faculty supervisors, and department administration." },
  { icon: <Clock     size={20} />, title: "Deadline Alerts",        desc: "Automated reminders ensure no submission deadline or review window is ever missed." },
];

/* ═══════════════════════
   LANDING PAGE
═══════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroVisible = useVisible(80);
  const midVisible  = useVisible(300);
  const btmVisible  = useVisible(500);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          min-height: 100vh;
          background: #060f1e;
          color: #cbd5e1;
          font-family: 'Inter', system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* NAV */
        .lp-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 64px; height: 64px;
          background: rgba(6,15,30,0.9);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lp-brand { display: flex; align-items: center; gap: 11px; }
        .lp-brand-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: #3730a3;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lp-brand-name  { font-size: 15px; font-weight: 600; color: #e2e8f0; letter-spacing: -.01em; line-height: 1.2; }
        .lp-brand-sub   { font-size: 10.5px; color: #475569; letter-spacing: .06em; text-transform: uppercase; }
        .lp-nav-actions { display: flex; align-items: center; gap: 10px; }

        /* BUTTONS */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 22px;
          background: #4f46e5; color: #fff;
          font-size: 14px; font-weight: 500; font-family: inherit;
          border: none; border-radius: 9px; cursor: pointer;
          transition: background .2s, transform .15s, box-shadow .2s;
          letter-spacing: .01em;
        }
        .btn-primary:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(79,70,229,.35); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary.lg { padding: 13px 30px; font-size: 15px; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px;
          background: transparent; color: #94a3b8;
          font-size: 14px; font-family: inherit;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; cursor: pointer;
          transition: color .2s, border-color .2s, background .2s;
        }
        .btn-ghost:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
        .btn-ghost.lg { padding: 12px 24px; font-size: 15px; }

        /* HERO */
        .lp-hero {
          position: relative;
          padding: 86px 64px 68px;
          overflow: hidden;
        }
        .lp-hero-inner {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
          max-width: 1100px; margin: 0 auto;
        }
        .lp-dot-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(79,70,229,.15) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 100%);
        }
        .lp-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(80px);
        }

        /* chip / badge */
        .lp-chip {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px 5px 9px;
          background: rgba(79,70,229,.1);
          border: 1px solid rgba(79,70,229,.28);
          border-radius: 100px;
          font-size: 12px; color: #818cf8; letter-spacing: .04em;
          margin-bottom: 24px;
        }
        .lp-chip-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #818cf8;
          animation: blink 2.2s ease infinite;
          flex-shrink: 0;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

        .lp-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 4.5vw, 58px);
          font-weight: 700; line-height: 1.1;
          letter-spacing: -.028em; color: #f1f5f9;
          margin-bottom: 22px;
        }
        .lp-h1 em { font-style: italic; color: #818cf8; }

        .lp-lead {
          font-size: 16px; line-height: 1.78; color: #64748b;
          max-width: 440px; margin-bottom: 36px;
        }
        .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .lp-hero-note { margin-top: 18px; font-size: 12px; color: #334155; }

        /* STATS STRIP */
        .lp-strip {
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 32px 64px;
        }
        .lp-strip-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 12px; max-width: 860px; margin: 0 auto;
        }
        .lp-stat {
          text-align: center; padding: 20px 12px;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
          background: rgba(255,255,255,0.02);
          transition: border-color .25s;
        }
        .lp-stat:hover { border-color: rgba(79,70,229,.25); }
        .lp-stat-val   { font-size: 28px; font-family: 'Playfair Display', serif; color: #818cf8; margin-bottom: 4px; }
        .lp-stat-label { font-size: 12px; color: #475569; letter-spacing: .03em; }

        /* FEATURES */
        .lp-features { padding: 80px 64px; max-width: 1100px; margin: 0 auto; }
        .lp-section-hd { text-align: center; margin-bottom: 52px; }
        .lp-h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3.5vw, 40px); font-weight: 700;
          letter-spacing: -.02em; color: #f1f5f9; margin-top: 14px;
        }
        .lp-feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
        .lp-feat-card {
          padding: 26px 22px;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 13px;
          background: rgba(255,255,255,0.02);
          transition: border-color .25s, transform .25s;
        }
        .lp-feat-card:hover { border-color: rgba(79,70,229,.25); transform: translateY(-4px); }
        .lp-feat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(79,70,229,.12);
          display: flex; align-items: center; justify-content: center;
          color: #818cf8; margin-bottom: 16px;
        }
        .lp-feat-title { font-size: 15px; font-weight: 500; color: #e2e8f0; margin-bottom: 8px; }
        .lp-feat-desc  { font-size: 13px; line-height: 1.65; color: #475569; }

        /* CTA BANNER */
        .lp-cta-wrap { padding: 72px 64px 80px; }
        .lp-cta {
          padding: 60px 48px; border-radius: 18px;
          background: linear-gradient(135deg, #0d1f35 0%, #111b30 100%);
          border: 1px solid rgba(79,70,229,.18);
          text-align: center; position: relative; overflow: hidden;
        }
        .lp-cta-dots {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(rgba(79,70,229,.08) 1px, transparent 1px);
          background-size: 22px 22px;
        }
        .lp-cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 3vw, 38px); color: #f1f5f9;
          letter-spacing: -.02em; margin-bottom: 14px; position: relative;
        }
        .lp-cta-sub { font-size: 15px; color: #475569; margin-bottom: 32px; position: relative; }

        /* FOOTER */
        .lp-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 24px 64px;
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 10px;
        }
        .lp-footer-copy { font-size: 12px; color: #334155; }

        /* FADE ANIMATIONS */
        .fade { opacity: 0; transform: translateY(20px); transition: opacity .65s ease, transform .65s ease; }
        .fade.in { opacity: 1; transform: translateY(0); }
        .d1 { transition-delay: .05s; }
        .d2 { transition-delay: .2s;  }
        .d3 { transition-delay: .35s; }
        .d4 { transition-delay: .5s;  }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .lp-nav          { padding: 0 20px; }
          .lp-hero         { padding: 56px 20px 44px; }
          .lp-hero-inner   { grid-template-columns: 1fr; gap: 36px; }
          .lp-strip        { padding: 24px 20px; }
          .lp-strip-grid   { grid-template-columns: repeat(2,1fr); }
          .lp-features     { padding: 56px 20px; }
          .lp-feat-grid    { grid-template-columns: 1fr; }
          .lp-cta-wrap     { padding: 48px 20px 56px; }
          .lp-cta          { padding: 40px 24px; }
          .lp-footer       { padding: 20px; flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="lp">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <GraduationCap size={18} color="#fff" />
            </div>
            <div>
              <div className="lp-brand-name">UniProject Portal</div>
              <div className="lp-brand-sub">Academic Project Management</div>
            </div>
          </div>
          <div className="lp-nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/admin/login")}>Admin</button>
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Sign In <ArrowRight size={14} />
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-dot-bg" />
          <div className="lp-orb" style={{ width: 560, height: 560, background: "rgba(79,70,229,0.07)",  top: -160, right: -120 }} />
          <div className="lp-orb" style={{ width: 380, height: 380, background: "rgba(30,63,110,0.12)", bottom: -80, left: -60 }} />

          <div className="lp-hero-inner">
            {/* copy */}
            <div className={`fade d1 ${heroVisible ? "in" : ""}`}>
              <div className="lp-chip">
                <span className="lp-chip-dot" />
                Portal live · Academic Year 2025–26
              </div>

              <h1 className="lp-h1">
                One portal for<br />every project<br /><em>milestone.</em>
              </h1>

              <p className="lp-lead">
                The official BTP &amp; M.Tech Dissertation management system — connecting
                students, faculty supervisors, and the department under a
                single, structured workflow.
              </p>

              <div className="lp-hero-btns">
                <button className="btn-primary lg" onClick={() => navigate("/login")}>
                  Access Portal <ArrowRight size={16} />
                </button>
                <button className="btn-ghost lg" onClick={() => navigate("/admin/login")}>
                  Admin Login
                </button>
              </div>

              <p className="lp-hero-note">
                Sign in with your institutional credentials &nbsp;·&nbsp; For students &amp; faculty
              </p>
            </div>

            {/* illustration */}
            <div className={`fade d3 ${heroVisible ? "in" : ""}`}>
              <HeroIllustration />
            </div>
          </div>
        </section>

      

        {/* ── FEATURES ── */}
        <section className="lp-features">
          <div className={`lp-section-hd fade d1 ${midVisible ? "in" : ""}`}>
            <div className="lp-chip" style={{ justifyContent: "center" }}>
              <span className="lp-chip-dot" />
              Built for academia
            </div>
            <h2 className="lp-h2">Everything the department needs</h2>
          </div>

          <div className={`lp-feat-grid fade d2 ${midVisible ? "in" : ""}`}>
            {FEATURES.map((ft) => (
              <div key={ft.title} className="lp-feat-card">
                <div className="lp-feat-icon">{ft.icon}</div>
                <div className="lp-feat-title">{ft.title}</div>
                <div className="lp-feat-desc">{ft.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="lp-cta-wrap">
          <div className={`lp-cta fade d1 ${btmVisible ? "in" : ""}`}>
            <div className="lp-cta-dots" />
            <h2 className="lp-cta-title">Ready to begin your project journey?</h2>
            <p className="lp-cta-sub">
              Log in with your university email to access proposals,<br />group formations, and supervisor assignments.
            </p>
            <button className="btn-primary lg" style={{ position: "relative" }} onClick={() => navigate("/login")}>
              Sign In to Portal <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-brand">
            <div className="lp-brand-icon" style={{ width: 28, height: 28, borderRadius: 7 }}>
              <GraduationCap size={13} color="#fff" />
            </div>
            <span className="lp-brand-name" style={{ fontSize: 13 }}>UniProject Portal</span>
          </div>
          <p className="lp-footer-copy">© 2026 · Academic Project Management System · All rights reserved</p>
        </footer>

      </div>
    </>
  );
}