import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://cyrtelvafiarxqfbkyum.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cnRlbHZhZmlhcnhxZmJreXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzEzODAsImV4cCI6MjA5MTUwNzM4MH0.NqYYfcHHOtZUIfhFGSMjkp5FELwZPn4X1c1RqbMpDPM"
);

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xbdpnqrd";

// ─── SERVICES ────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: "mowing",
    title: "Lawn Mowing",
    pricingMode: "size",
    emoji: "🌿",
    tag: "Most popular",
    description: "Clean, even mowing for front and back yards with a neat finish.",
    details: ["Weekly or bi-weekly service", "Front and back yard options", "Final quote confirmed after review"],
    durations: { small: 60, medium: 90, large: 120 },
    estimates: { small: [45, 57], medium: [58, 72], large: [75, 95] },
    pricingNotes: ["Small yard: about $45–$57", "Medium yard: about $58–$72", "Large yard: about $75–$95+", "Final quote depends on yard size and condition"],
  },
  {
    id: "weeding",
    title: "Weed Pulling",
    pricingMode: "hourly",
    emoji: "🌱",
    tag: "Hourly",
    description: "Hand-pulled weeds from beds, edges, and walkways.",
    details: ["Great for flower beds and landscaping", "More overgrowth takes more time", "Final quote confirmed after review"],
    durations: { standard: 120 },
    estimates: { standard: [60, 85] },
    pricingNotes: ["Estimated by time needed", "Starting range about $60–$85", "Heavier overgrowth increases the quote"],
  },
  {
    id: "cleanup",
    title: "Yard Cleanup",
    pricingMode: "hourly",
    emoji: "🍃",
    tag: "Seasonal",
    description: "Leaves, sticks, light overgrowth, and a general yard refresh.",
    details: ["Great before parties or for seasonal cleanup", "Estimate depends on debris amount", "Final quote confirmed after review"],
    durations: { standard: 120 },
    estimates: { standard: [80, 120] },
    pricingNotes: ["Estimated by time needed", "Starting range about $80–$120", "More debris raises the quote"],
  },
  {
    id: "trimming",
    title: "Bush Trimming",
    pricingMode: "size",
    emoji: "✂️",
    tag: "Curb appeal",
    description: "Simple shaping and trimming for bushes and shrubs.",
    details: ["Front entry cleanup and curb appeal", "Based on number and size of bushes", "Final quote confirmed after review"],
    durations: { small: 60, medium: 90, large: 120 },
    estimates: { small: [65, 80], medium: [85, 110], large: [115, 145] },
    pricingNotes: ["Small job: about $65–$80", "Medium job: about $85–$110", "Large job: about $115–$145+", "Final quote depends on trimming needed"],
  },
  {
    id: "trash",
    title: "Trash Can Service",
    pricingMode: "flat",
    emoji: "🗑️",
    tag: "Add-on",
    description: "Roll cans to and from the curb or help with light trash area cleanup.",
    details: ["Simple add-on or recurring service", "Helpful for busy homeowners", "Extra work can raise the quote"],
    durations: { standard: 30 },
    estimates: { standard: [20, 30] },
    pricingNotes: ["Basic service starts around $20", "Extra cans or cleanup can increase the quote"],
  },
  {
    id: "powerwashing",
    title: "Power Washing",
    pricingMode: "size",
    emoji: "💦",
    tag: "Deep clean",
    description: "Driveways, patios, walkways, and outdoor surfaces blasted clean.",
    details: ["Great for patios and concrete", "Larger areas take longer", "Final quote confirmed after review"],
    durations: { small: 90, medium: 120, large: 150 },
    estimates: { small: [85, 110], medium: [120, 155], large: [160, 210] },
    pricingNotes: ["Small area: about $85–$110", "Medium area: about $120–$155", "Large area: about $160–$210+", "Final quote depends on area size and condition"],
  },
  {
    id: "pool",
    title: "Pool Cleaning",
    pricingMode: "hourly",
    emoji: "🏊",
    tag: "Summer ready",
    description: "Basic pool skimming, debris cleanup, and light pool area care.",
    details: ["Good for leaves and surface debris", "Heavier cleanup takes longer", "Final quote confirmed after review"],
    durations: { standard: 90 },
    estimates: { standard: [70, 100] },
    pricingNotes: ["Estimated by time needed", "Starting range about $70–$100", "Heavier debris raises the quote"],
  },
  {
    id: "dogwalking",
    title: "Dog Walking",
    pricingMode: "length",
    emoji: "🐕",
    tag: "Recurring",
    description: "Reliable neighborhood dog walks for busy owners.",
    details: ["Quick and standard walk options", "Simple service with flexible scheduling", "Final quote depends on walk length"],
    durations: { quick: 30, standard: 60 },
    estimates: { quick: [20, 26], standard: [28, 38] },
    pricingNotes: ["Quick walk: about $20–$26", "Standard walk: about $28–$38", "Final quote depends on walk length"],
  },
];

const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const DOG_OPTIONS = [
  { value: "quick", label: "Quick walk — 30 min" },
  { value: "standard", label: "Standard walk — 60 min" },
];

const URGENCY_OPTIONS = ["Flexible", "Within 3 days", "Next day"];
const PAYMENT_OPTIONS = ["Cash", "Apple Pay", "Card"];

// ─── SCHEDULING LOGIC ────────────────────────────────────────────────────────
//
// Your slots are 4:30 PM, 5:30 PM, 6:30 PM.
// Each slot is a 60-minute window. Hard stop: 8:30 PM.
//
// Valid start times by job duration:
//   30 min  → 4:30, 5:30, 6:30  (ends by 7:00 at latest)
//   60 min  → 4:30, 5:30, 6:30  (ends by 8:30 at latest — OK)
//   90 min  → 4:30, 5:30, 6:30  (6:30 ends 8:00 — OK)
//  120 min  → 4:30, 5:30        (6:30 would end 8:30 — OK actually)
//  150 min  → 4:30, 5:30        (6:30 would end 9:00 — too late)
//
// Multi-slot blocking: a 120-min job starting at 4:30 blocks 4:30 AND 5:30,
// so nobody else can book that evening's remaining slot.

const ALL_SLOTS = ["4:30 PM", "5:30 PM", "6:30 PM"];
const HARD_STOP = 20 * 60 + 30; // 8:30 PM in minutes

// Fallback slots used if Supabase is unreachable
const FALLBACK_SLOTS = [
  "2026-04-16","2026-04-20","2026-04-23","2026-04-24",
  "2026-04-27","2026-04-30","2026-05-04","2026-05-07","2026-05-08",
].flatMap((date) =>
  ALL_SLOTS.map((time_slot) => ({ date, time_slot, is_available: true }))
);

function toMins(time12) {
  const [time, ampm] = time12.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function groupByDate(rows) {
  const map = {};
  rows.forEach(({ date, time_slot, is_available }) => {
    if (!is_available) return;
    if (!map[date]) map[date] = [];
    map[date].push(time_slot);
  });
  Object.keys(map).forEach((d) => {
    map[d] = [...new Set(map[d])].sort((a, b) => toMins(a) - toMins(b));
  });
  return map;
}

function stripPastDates(map) {
  const today = new Date().toISOString().split("T")[0];
  return Object.fromEntries(Object.entries(map).filter(([d]) => d >= today));
}

// Which slots does a job block? A slot is blocked if any part of the job
// overlaps the slot's 60-min window.
function blockedSlots(startSlot, durationMins) {
  const start = toMins(startSlot);
  const end = start + durationMins;
  return ALL_SLOTS.filter((slot) => {
    const s = toMins(slot);
    return s < end && s + 60 > start;
  });
}

// Which slots are valid start times for this job on a given day?
function validStartSlots(availableOnDay, durationMins) {
  const avail = new Set(availableOnDay);
  return ALL_SLOTS.filter((slot) => {
    if (!avail.has(slot)) return false;
    if (toMins(slot) + durationMins > HARD_STOP) return false;
    // Every slot the job would overlap must also be available
    return blockedSlots(slot, durationMins).every((s) => avail.has(s));
  });
}

function getService(id) {
  return SERVICES.find((s) => s.id === id) || SERVICES[0];
}

function getDuration(serviceId, sizeValue, dogValue) {
  const svc = getService(serviceId);
  if (serviceId === "dogwalking") return svc.durations[dogValue] ?? 30;
  if (svc.pricingMode === "hourly" || svc.pricingMode === "flat") return svc.durations.standard ?? 60;
  return svc.durations[sizeValue] ?? svc.durations.standard ?? 60;
}

function getEstimate(serviceId, sizeValue, dogValue) {
  const svc = getService(serviceId);
  let r;
  if (serviceId === "dogwalking") r = svc.estimates[dogValue] ?? svc.estimates.quick;
  else if (svc.pricingMode === "hourly" || svc.pricingMode === "flat") r = svc.estimates.standard;
  else r = svc.estimates[sizeValue] ?? svc.estimates.small;
  return `$${r[0]}–$${r[1]}`;
}

function getPriceRange(svc) {
  if (svc.pricingMode === "length") return `$${svc.estimates.quick[0]}–$${svc.estimates.standard[1]}`;
  if (svc.pricingMode === "hourly" || svc.pricingMode === "flat") return `$${svc.estimates.standard[0]}–$${svc.estimates.standard[1]}`;
  return `$${svc.estimates.small[0]}–$${svc.estimates.large[1]}+`;
}

function fmtDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");           // "home" | "pricing" | "service"
  const [activeId, setActiveId] = useState(null);     // service detail page
  const [bookingId, setBookingId] = useState(null);   // booking modal open
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIn, setHeroIn] = useState(false);

  const [availability, setAvailability] = useState({});
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const servicesRef = useRef(null);
  const contactRef  = useRef(null);

  const [form, setForm] = useState({
    serviceId:     "mowing",
    sizeValue:     "small",
    dogValue:      "quick",
    fullName:      "",
    email:         "",
    phone:         "",
    address:       "",
    date:          "",
    timeSlot:      "",
    urgency:       "Flexible",
    paymentMethod: "Cash",
    notes:         "",
  });

  const patchForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // ── Hero animation
  useEffect(() => { setTimeout(() => setHeroIn(true), 60); }, []);

  // ── Load availability — reusable, called on mount AND after every booking
  const loadAvailability = async () => {
    setLoadingAvail(true);
    const { data, error } = await supabase
      .from("availability")
      .select("date, time_slot, is_available")
      .eq("is_available", true)
      .order("date", { ascending: true });
    const rows = (!error && data && data.length > 0) ? data : FALLBACK_SLOTS;
    setAvailability(stripPastDates(groupByDate(rows)));
    setLoadingAvail(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAvailability(); }, []);

  // ── Derived scheduling state
  const duration = useMemo(
    () => getDuration(form.serviceId, form.sizeValue, form.dogValue),
    [form.serviceId, form.sizeValue, form.dogValue]
  );
  const estimate = useMemo(
    () => getEstimate(form.serviceId, form.sizeValue, form.dogValue),
    [form.serviceId, form.sizeValue, form.dogValue]
  );

  // Only show dates that have at least one valid start slot for this job
  const filteredAvail = useMemo(() => {
    const result = {};
    Object.entries(availability).forEach(([date, slots]) => {
      const starts = validStartSlots(slots, duration);
      if (starts.length) result[date] = starts;
    });
    return result;
  }, [availability, duration]);

  const availDates = Object.keys(filteredAvail).sort();
  const availTimes = filteredAvail[form.date] ?? [];

  // Auto-select first date/time whenever filtered availability changes
  useEffect(() => {
    if (!availDates.length) { patchForm({ date: "", timeSlot: "" }); return; }
    if (!form.date || !filteredAvail[form.date]) {
      patchForm({ date: availDates[0], timeSlot: filteredAvail[availDates[0]]?.[0] ?? "" });
      return;
    }
    if (!availTimes.includes(form.timeSlot)) {
      patchForm({ timeSlot: availTimes[0] ?? "" });
    }
  }, [availDates.join(","), form.date]); // eslint-disable-line

  // ── Navigation helpers
  const goHome    = () => { setPage("home"); setMenuOpen(false); };
  const scrollTo  = (ref) => {
    goHome();
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  const openService = (id) => { setActiveId(id); setPage("service"); setMenuOpen(false); };
  const openBooking = (id) => {
    patchForm({ serviceId: id });
    setBookingId(id);
    setSuccessMsg("");
    setErrorMsg("");
  };
  const closeBooking = () => setBookingId(null);

  // ── Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.timeSlot) {
      setErrorMsg("No available times fit this job. Try a different service size.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const svc = getService(form.serviceId);
      const payload = {
        full_name:      form.fullName,
        email:          form.email,
        phone:          form.phone,
        address:        form.address,
        service:        svc.title,
        booking_date:   form.date,
        time_slot:      form.timeSlot,
        payment_method: form.paymentMethod,
        estimated_price: estimate,
        notes: `${form.notes}${svc.id === "dogwalking" ? ` | walk:${form.dogValue}` : ` | size:${form.sizeValue}`}`.trim(),
      };

      // 1. Insert booking
      const { error: bookErr } = await supabase.from("bookings").insert([payload]);
      if (bookErr) throw bookErr;

      // 2. Block every slot the job overlaps on that date
      const toBlock = blockedSlots(form.timeSlot, duration);
      for (const slot of toBlock) {
        await supabase
          .from("availability")
          .update({ is_available: false })
          .eq("date", form.date)
          .eq("time_slot", slot);
      }

      // 3. Email notification via Formspree
      try {
        await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            service: svc.title, name: form.fullName, email: form.email,
            phone: form.phone, address: form.address, date: form.date,
            time: form.timeSlot, payment: form.paymentMethod, estimate, notes: form.notes,
          }),
        });
      } catch { /* email failure doesn't break the booking */ }

      // 4. Re-fetch availability from Supabase so UI reflects exact DB state
      await loadAvailability();

      closeBooking();
      setPage("home");
      setSuccessMsg("Booking request sent! We'll reach out to confirm shortly.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMsg(`Booking failed: ${err?.message ?? "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentSvc = getService(form.serviceId);
  const activeSvc  = activeId ? getService(activeId) : null;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-brand" onClick={goHome}>
            <span className="brand-name">SummerStrong</span>
            <span className="brand-sub">Lawn Care · Mechanicsburg, PA</span>
          </button>
          <div className="nav-links">
            <button className="nav-link" onClick={() => setPage("pricing")}>How we price</button>
            <button className="nav-link" onClick={() => scrollTo(servicesRef)}>Services</button>
            <button className="nav-link" onClick={() => scrollTo(contactRef)}>Contact</button>
          </div>
          <button className="btn-green nav-cta" onClick={() => openBooking("mowing")}>Book now</button>
          <button className="nav-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <button onClick={() => setPage("pricing")}>How we price</button>
            <button onClick={() => scrollTo(servicesRef)}>Services</button>
            <button onClick={() => scrollTo(contactRef)}>Contact</button>
            <button className="mobile-book" onClick={() => openBooking("mowing")}>Book now →</button>
          </div>
        )}
      </nav>

      {/* HOME */}
      {page === "home" && (
        <>
          {(successMsg || errorMsg) && (
            <div style={{ maxWidth: 1200, margin: "16px auto 0", padding: "0 24px" }}>
              <div className={successMsg ? "alert-ok" : "alert-err"}>{successMsg || errorMsg}</div>
            </div>
          )}

          {/* HERO */}
          <section style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 48px" }}>
            <div className={`hero-grid ${heroIn ? "hero-in" : ""}`}>
              <div>
                <div className="eyebrow">
                  <span className="eyebrow-dot" />
                  Now booking Spring 2026
                </div>
                <h1>Your yard,<br /><em>done right.</em></h1>
                <p className="hero-desc">
                  Lawn mowing, weeding, power washing, dog walking, and more —
                  all from a reliable local crew in Mechanicsburg.
                </p>
                <div className="hero-btns">
                  <button className="btn-green" onClick={() => scrollTo(servicesRef)}>See all services</button>
                  <button className="btn-outline" onClick={() => setPage("pricing")}>How we price</button>
                </div>
              </div>
              <div className="hero-card">
                <span style={{ fontSize: 52 }}>🏡</span>
                <h3>Local. Reliable. Easy.</h3>
                <p>Pick a service, get an upfront estimate, and book in minutes.</p>
                <div className="hero-stats">
                  {[["8","Services"],["PA","Local"],["$20+","Starting"],["Easy","Booking"]].map(([v,l]) => (
                    <div key={l} className="stat">
                      <span className="stat-val">{v}</span>
                      <span className="stat-lbl">{l}</span>
                    </div>
                  ))}
                </div>
                <button className="hero-card-btn" onClick={() => openBooking("mowing")}>Get a booking →</button>
              </div>
            </div>
          </section>

          {/* SERVICES GRID */}
          <section ref={servicesRef} style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 64px" }}>
            <p className="section-label">Services</p>
            <h2>What we do</h2>
            <p className="section-desc">Pick a service to see pricing details and book online.</p>
            <div className="services-grid">
              {SERVICES.map((svc) => (
                <button key={svc.id} className="svc-card" onClick={() => openService(svc.id)}>
                  <div className="svc-art">
                    {svc.emoji}
                    <span className="svc-tag">{svc.tag}</span>
                  </div>
                  <div className="svc-body">
                    <div className="svc-title">{svc.title}</div>
                    <div className="svc-desc">{svc.description}</div>
                    <div className="svc-price">From {getPriceRange(svc)}</div>
                    <div className="svc-arrow">View & book <ArrowRight /></div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* CONTACT */}
          <section ref={contactRef} style={{ background: "var(--white)", borderTop: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px 72px" }}>
              <p className="section-label">Contact</p>
              <h2>Get in touch</h2>
              <p className="section-desc">Questions before booking? Reach out anytime.</p>
              <div className="contact-grid">
                <div className="contact-card">
                  <div className="contact-icon">✉️</div>
                  <div>
                    <div className="contact-label">Email</div>
                    <div className="contact-val">overthesummerservices@gmail.com</div>
                  </div>
                </div>
                <div className="contact-card">
                  <div className="contact-icon">📍</div>
                  <div>
                    <div className="contact-label">Service area</div>
                    <div className="contact-val">Mechanicsburg, PA 17055 + nearby</div>
                  </div>
                </div>
                <div className="contact-card">
                  <div className="contact-icon">📞</div>
                  <div>
                    <div className="contact-label">Phone</div>
                    <div className="contact-val" style={{ color: "var(--text-muted)" }}>Add your number here</div>
                  </div>
                </div>
                <div className="contact-card" style={{ background: "var(--grass)", border: "none", cursor: "pointer" }} onClick={() => openBooking("mowing")}>
                  <div className="contact-icon" style={{ background: "rgba(255,255,255,0.15)" }}>📅</div>
                  <div>
                    <div className="contact-label" style={{ color: "rgba(255,255,255,0.65)" }}>Ready to book?</div>
                    <div className="contact-val" style={{ color: "white" }}>Tap to book a service →</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* PRICING PAGE */}
      {page === "pricing" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
          <button className="back-btn" onClick={goHome}><ChevLeft /> Back</button>
          <p className="section-label">Pricing</p>
          <h2>How we price</h2>
          <p className="section-desc">We show a starting estimate before you commit. The final quote is always confirmed after we review the job.</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>📐 Priced by size</h3>
              <p>The bigger the job, the higher the range.</p>
              <ul className="check-list">
                {["Lawn mowing","Bush trimming","Power washing","Dog walking (by walk length)"].map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
            <div className="pricing-card">
              <h3>⏱️ Priced by time</h3>
              <p>Some jobs are hard to size — more debris or overgrowth means more time.</p>
              <ul className="check-list">
                {["Weed pulling","Yard cleanup","Pool cleaning"].map((i) => <li key={i}>{i}</li>)}
              </ul>
            </div>
            <div className="pricing-card" style={{ background: "var(--grass-pale)", borderColor: "rgba(45,90,45,0.2)" }}>
              <h3>✅ Estimates first</h3>
              <p>All online prices are starting ranges. Your final quote is confirmed after we see the actual job — no surprise bills.</p>
            </div>
            <div className="pricing-card" style={{ background: "var(--gold-pale)", borderColor: "rgba(196,148,58,0.2)" }}>
              <h3>💳 Payment options</h3>
              <p>We accept cash, Apple Pay, and card. You choose at booking time.</p>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE DETAIL PAGE */}
      {page === "service" && activeSvc && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px 80px" }}>
          <button className="back-btn" onClick={goHome}><ChevLeft /> All services</button>
          <div className="detail-grid">
            <div className="detail-card">
              <div className="detail-art">{activeSvc.emoji}</div>
              <div className="detail-body">
                <p className="section-label">{activeSvc.tag}</p>
                <h2>{activeSvc.title}</h2>
                <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.7, margin: "12px 0 28px", fontWeight: 300 }}>{activeSvc.description}</p>
                <div className="detail-box">
                  <div className="detail-box-label">What's included</div>
                  {activeSvc.details.map((d) => <div key={d} className="detail-row"><span className="check-icon">✓</span>{d}</div>)}
                </div>
                <div className="detail-box" style={{ marginTop: 16 }}>
                  <div className="detail-box-label">Pricing notes</div>
                  {activeSvc.pricingNotes.map((n) => <div key={n} className="detail-row"><span className="dollar-icon">$</span>{n}</div>)}
                </div>
              </div>
            </div>
            <div className="detail-sidebar">
              <div className="sidebar-card">
                <div className="detail-box-label">Starting estimate</div>
                <div className="sidebar-estimate">{getPriceRange(activeSvc)}</div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "4px 0 20px" }}>Final price confirmed after review.</p>
                <button className="btn-green" style={{ width: "100%" }} onClick={() => openBooking(activeSvc.id)}>
                  Book {activeSvc.title}
                </button>
              </div>
              <div className="sidebar-card">
                <div className="detail-box-label">Pricing type</div>
                <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.6, marginTop: 8 }}>
                  {activeSvc.pricingMode === "hourly"  && "⏱️ Priced by time — estimated based on how long the job takes."}
                  {activeSvc.pricingMode === "length"  && "📏 Priced by walk length — quick or standard."}
                  {activeSvc.pricingMode === "flat"    && "📌 Flat rate — simple, predictable pricing."}
                  {activeSvc.pricingMode === "size"    && "📐 Priced by size — small, medium, or large job."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {bookingId && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) closeBooking(); }}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-label">Book a service</div>
                <div className="modal-title">{getService(bookingId).title}</div>
              </div>
              <button className="modal-close" onClick={closeBooking}>✕</button>
            </div>
            <div className="modal-body">
              {/* FORM */}
              <div className="form-col">
                {/* Service */}
                <Field label="Service">
                  <select className="input" value={form.serviceId} onChange={(e) => patchForm({ serviceId: e.target.value })}>
                    {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </Field>

                {/* Size / walk length */}
                {currentSvc.id === "dogwalking" ? (
                  <Field label="Walk length">
                    <select className="input" value={form.dogValue} onChange={(e) => patchForm({ dogValue: e.target.value })}>
                      {DOG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                ) : currentSvc.pricingMode === "size" ? (
                  <Field label="Estimated job size" hint="Starting estimate only — final price confirmed after review.">
                    <select className="input" value={form.sizeValue} onChange={(e) => patchForm({ sizeValue: e.target.value })}>
                      {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                ) : null}

                <div className="info-box">Estimated job length: <strong>{duration} minutes</strong></div>

                {/* Name + phone */}
                <div className="form-row">
                  <Field label="Full name">
                    <input className="input" required value={form.fullName} onChange={(e) => patchForm({ fullName: e.target.value })} placeholder="Jane Smith" />
                  </Field>
                  <Field label="Phone">
                    <input className="input" required value={form.phone} onChange={(e) => patchForm({ phone: e.target.value })} placeholder="(717) 555-0100" />
                  </Field>
                </div>

                {/* Email */}
                <Field label="Email">
                  <input className="input" required type="email" value={form.email} onChange={(e) => patchForm({ email: e.target.value })} placeholder="you@email.com" />
                </Field>

                {/* Address */}
                <Field label="Address">
                  <input className="input" required value={form.address} onChange={(e) => patchForm({ address: e.target.value })} placeholder="123 Main St, Mechanicsburg, PA" />
                </Field>

                {/* Date + time */}
                <div className="form-row">
                  <Field label="Date">
                    <select className="input" required value={form.date} onChange={(e) => patchForm({ date: e.target.value })} disabled={loadingAvail || !availDates.length}>
                      {availDates.length
                        ? availDates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)
                        : <option value="">No dates available</option>}
                    </select>
                  </Field>
                  <Field label="Start time">
                    <select className="input" required value={form.timeSlot} onChange={(e) => patchForm({ timeSlot: e.target.value })} disabled={loadingAvail || !availTimes.length}>
                      {availTimes.length
                        ? availTimes.map((t) => <option key={t} value={t}>{t}</option>)
                        : <option value="">No times available</option>}
                    </select>
                  </Field>
                </div>

                {/* Urgency + payment */}
                <div className="form-row">
                  <Field label="Timing">
                    <select className="input" value={form.urgency} onChange={(e) => patchForm({ urgency: e.target.value })}>
                      {URGENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="Payment method">
                    <select className="input" value={form.paymentMethod} onChange={(e) => patchForm({ paymentMethod: e.target.value })}>
                      {PAYMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Notes */}
                <Field label="Notes (optional)">
                  <textarea className="input" style={{ minHeight: 90, resize: "vertical" }} value={form.notes} onChange={(e) => patchForm({ notes: e.target.value })} placeholder="Gate code, dog's name, anything we should know..." />
                </Field>

                {errorMsg && <div className="alert-err">{errorMsg}</div>}
              </div>

              {/* SUMMARY SIDEBAR */}
              <div className="summary">
                <div className="summary-label">Your estimate</div>
                <div className="summary-estimate">{estimate}</div>
                <div className="summary-note">Starting estimate only. Final price confirmed after review.</div>
                <div className="summary-details">
                  {[
                    ["Service",  currentSvc.title],
                    ["Duration", `${duration} min`],
                    ["Date",     form.date ? fmtDate(form.date) : "—"],
                    ["Time",     form.timeSlot || "—"],
                    ["Payment",  form.paymentMethod],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="summary-row">
                      <span className="summary-lbl">{lbl}</span>
                      <span className="summary-val">{val}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="summary-submit"
                  disabled={submitting || loadingAvail || !form.date || !form.timeSlot}
                  onClick={handleSubmit}
                >
                  {submitting ? "Sending..." : loadingAvail ? "Loading times..." : "Confirm booking →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        © 2026 SummerStrong Lawn Care · Mechanicsburg, PA ·{" "}
        <a href="mailto:overthesummerservices@gmail.com" style={{ color: "var(--grass)" }}>
          overthesummerservices@gmail.com
        </a>
      </footer>
    </>
  );
}

// ─── TINY HELPER COMPONENTS ──────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display:"inline-block", verticalAlign:"middle" }}>
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

:root {
  --ink:        #1a1a14;
  --grass:      #2d5a2d;
  --grass-lt:   #4a7c4a;
  --grass-pale: #e8f0e8;
  --cream:      #f5f0e8;
  --cream-dk:   #ede5d6;
  --gold:       #c4943a;
  --gold-pale:  #fdf3e0;
  --text:       #3d3d30;
  --text-muted: #7a7a60;
  --white:      #fefefe;
  --border:     rgba(45,90,45,0.15);
  --sh-sm: 0 2px 12px rgba(26,26,20,.08);
  --sh-md: 0 8px 32px rgba(26,26,20,.12);
  --sh-lg: 0 20px 60px rgba(26,26,20,.16);
}

body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--ink); font-size:16px; line-height:1.6; -webkit-font-smoothing:antialiased; }
h1,h2,h3 { font-family:'Playfair Display',serif; }
button { font-family:'DM Sans',sans-serif; }

/* NAV */
.nav { position:sticky; top:0; z-index:100; background:rgba(245,240,232,.94); backdrop-filter:blur(16px); border-bottom:1px solid var(--border); }
.nav-inner { max-width:1200px; margin:0 auto; padding:0 24px; height:68px; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.nav-brand { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; gap:1px; text-align:left; }
.brand-name { font-family:'Playfair Display',serif; font-size:20px; font-weight:900; color:var(--grass); line-height:1; letter-spacing:-.3px; }
.brand-sub  { font-size:11px; font-weight:500; color:var(--text-muted); letter-spacing:.06em; text-transform:uppercase; }
.nav-links  { display:flex; align-items:center; gap:4px; }
.nav-link   { background:none; border:1px solid transparent; padding:8px 16px; border-radius:100px; font-size:14px; font-weight:500; color:var(--text); cursor:pointer; transition:all .2s; }
.nav-link:hover { background:var(--white); border-color:var(--border); color:var(--grass); }
.nav-cta    { padding:10px 22px !important; font-size:14px !important; }
.nav-burger { display:none; background:none; border:1px solid var(--border); border-radius:10px; padding:10px; cursor:pointer; color:var(--ink); }
.mobile-menu { background:var(--cream); border-bottom:1px solid var(--border); padding:16px 24px 20px; display:flex; flex-direction:column; gap:8px; }
.mobile-menu button { background:var(--white); border:1px solid var(--border); border-radius:14px; padding:14px 18px; text-align:left; font-size:15px; font-weight:500; color:var(--text); cursor:pointer; transition:all .15s; }
.mobile-menu button:hover { background:var(--grass-pale); color:var(--grass); }
.mobile-book { background:var(--grass) !important; color:white !important; font-weight:700 !important; }

/* BUTTONS */
.btn-green   { background:var(--grass); color:white; border:none; padding:14px 28px; border-radius:100px; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; letter-spacing:.01em; }
.btn-green:hover { background:var(--grass-lt); transform:translateY(-2px); box-shadow:var(--sh-md); }
.btn-outline { background:transparent; color:var(--ink); border:1.5px solid rgba(26,26,20,.2); padding:14px 28px; border-radius:100px; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; }
.btn-outline:hover { background:var(--white); border-color:var(--grass); color:var(--grass); transform:translateY(-1px); }
.back-btn { display:inline-flex; align-items:center; gap:8px; background:var(--white); border:1px solid var(--border); border-radius:100px; padding:10px 20px; font-size:14px; font-weight:600; color:var(--text); cursor:pointer; transition:all .15s; margin-bottom:28px; box-shadow:var(--sh-sm); }
.back-btn:hover { color:var(--grass); border-color:var(--grass); background:var(--grass-pale); }

/* ALERTS */
.alert-ok  { background:#e6f4ea; border:1px solid #a8d5b0; color:#1e5c2e; border-radius:14px; padding:14px 20px; font-size:14px; font-weight:600; }
.alert-err { background:#fdeaea; border:1px solid #f5b8b8; color:#8b2020; border-radius:14px; padding:14px 20px; font-size:14px; font-weight:600; }

/* HERO */
.hero-grid { display:grid; grid-template-columns:1fr 420px; gap:32px; align-items:center; opacity:0; transform:translateY(24px); transition:opacity .7s ease,transform .7s ease; }
.hero-grid.hero-in { opacity:1; transform:translateY(0); }
.eyebrow { display:inline-flex; align-items:center; gap:8px; background:var(--gold-pale); border:1px solid rgba(196,148,58,.25); border-radius:100px; padding:6px 14px 6px 10px; font-size:12px; font-weight:600; color:var(--gold); letter-spacing:.08em; text-transform:uppercase; margin-bottom:20px; }
.eyebrow-dot { width:6px; height:6px; background:var(--gold); border-radius:50%; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
h1 { font-size:clamp(48px,6vw,80px); font-weight:900; line-height:.95; letter-spacing:-2px; margin-bottom:24px; }
h1 em { font-style:italic; color:var(--grass); }
.hero-desc { font-size:18px; color:var(--text-muted); line-height:1.7; max-width:480px; margin-bottom:36px; font-weight:300; }
.hero-btns { display:flex; gap:12px; flex-wrap:wrap; }
.hero-card { background:var(--grass); border-radius:28px; padding:36px 32px; color:white; position:relative; overflow:hidden; box-shadow:var(--sh-lg); display:flex; flex-direction:column; gap:0; }
.hero-card::before { content:''; position:absolute; top:-60px; right:-60px; width:220px; height:220px; background:rgba(255,255,255,.06); border-radius:50%; }
.hero-card h3 { font-size:24px; font-weight:900; color:white; margin:16px 0 8px; }
.hero-card p  { font-size:15px; color:rgba(255,255,255,.7); line-height:1.6; margin-bottom:24px; }
.hero-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px; }
.stat { background:rgba(255,255,255,.12); border-radius:14px; padding:14px; }
.stat-val { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:white; display:block; }
.stat-lbl { font-size:12px; color:rgba(255,255,255,.65); font-weight:500; }
.hero-card-btn { background:white; color:var(--grass); border:none; padding:14px; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; transition:all .2s; width:100%; }
.hero-card-btn:hover { background:var(--cream); }

/* SECTION SHARED */
.section-label { display:block; font-size:11px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--grass); margin-bottom:10px; }
h2 { font-size:clamp(30px,4vw,52px); font-weight:900; letter-spacing:-1px; color:var(--ink); line-height:1.05; margin-bottom:12px; }
.section-desc { font-size:17px; color:var(--text-muted); max-width:540px; line-height:1.7; font-weight:300; margin-bottom:40px; }

/* SERVICES GRID */
.services-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.svc-card { background:var(--white); border-radius:22px; overflow:hidden; border:1px solid var(--border); cursor:pointer; text-align:left; transition:all .25s; box-shadow:var(--sh-sm); display:flex; flex-direction:column; }
.svc-card:hover { transform:translateY(-4px); box-shadow:var(--sh-md); border-color:rgba(45,90,45,.3); }
.svc-art  { height:110px; background:linear-gradient(135deg,var(--grass-pale),var(--cream-dk)); display:flex; align-items:center; justify-content:center; font-size:48px; position:relative; }
.svc-tag  { position:absolute; top:10px; right:10px; background:white; border-radius:100px; padding:3px 10px; font-size:10px; font-weight:600; color:var(--grass); letter-spacing:.04em; border:1px solid var(--border); }
.svc-body { padding:18px; flex:1; display:flex; flex-direction:column; }
.svc-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--ink); margin-bottom:6px; line-height:1.2; }
.svc-desc  { font-size:13px; color:var(--text-muted); line-height:1.5; flex:1; margin-bottom:12px; }
.svc-price { font-size:13px; font-weight:600; color:var(--grass); margin-bottom:8px; }
.svc-arrow { display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:600; color:var(--grass); }

/* PRICING */
.pricing-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:36px; }
.pricing-card { background:var(--white); border-radius:22px; padding:32px; border:1px solid var(--border); box-shadow:var(--sh-sm); }
.pricing-card h3 { font-size:22px; font-weight:700; margin-bottom:8px; }
.pricing-card p  { font-size:15px; color:var(--text-muted); line-height:1.6; margin-bottom:16px; }
.check-list { list-style:none; padding:0; display:flex; flex-direction:column; gap:8px; }
.check-list li { display:flex; align-items:center; gap:10px; font-size:14px; color:var(--text); font-weight:500; }
.check-list li::before { content:'✓'; min-width:20px; height:20px; background:var(--grass-pale); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; color:var(--grass); font-weight:700; }

/* SERVICE DETAIL */
.detail-grid    { display:grid; grid-template-columns:1fr 360px; gap:28px; align-items:start; }
.detail-card    { background:var(--white); border-radius:28px; overflow:hidden; border:1px solid var(--border); box-shadow:var(--sh-md); }
.detail-art     { height:220px; background:linear-gradient(135deg,var(--grass-pale),var(--cream-dk)); display:flex; align-items:center; justify-content:center; font-size:80px; }
.detail-body    { padding:32px; }
.detail-body h2 { font-size:36px; font-weight:900; margin:8px 0 0; letter-spacing:-1px; }
.detail-box     { background:var(--cream); border-radius:16px; padding:20px; }
.detail-box-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); margin-bottom:12px; }
.detail-row     { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:var(--text); line-height:1.5; padding:5px 0; }
.check-icon  { min-width:18px; height:18px; background:var(--grass-pale); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; color:var(--grass); font-weight:700; margin-top:2px; }
.dollar-icon { min-width:18px; height:18px; background:var(--gold-pale); border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px; color:var(--gold); font-weight:700; margin-top:2px; }
.detail-sidebar  { display:flex; flex-direction:column; gap:16px; position:sticky; top:80px; }
.sidebar-card    { background:var(--white); border-radius:20px; padding:24px; border:1px solid var(--border); box-shadow:var(--sh-sm); }
.sidebar-estimate { font-family:'Playfair Display',serif; font-size:40px; font-weight:700; color:var(--grass); display:block; margin:6px 0 0; }

/* CONTACT */
.contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.contact-card { background:var(--white); border-radius:20px; padding:28px; border:1px solid var(--border); box-shadow:var(--sh-sm); display:flex; align-items:center; gap:18px; }
.contact-icon  { width:48px; height:48px; background:var(--grass-pale); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
.contact-label { font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-muted); margin-bottom:4px; }
.contact-val   { font-size:14px; font-weight:600; color:var(--ink); }

/* MODAL */
.overlay { position:fixed; inset:0; z-index:200; background:rgba(26,26,20,.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn .2s ease; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
.modal { background:var(--cream); border-radius:28px; width:100%; max-width:880px; max-height:92vh; overflow-y:auto; box-shadow:0 40px 100px rgba(0,0,0,.3); animation:slideUp .25s ease; }
.modal-head  { padding:28px 28px 20px; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; justify-content:space-between; gap:16px; position:sticky; top:0; background:var(--cream); border-radius:28px 28px 0 0; z-index:1; }
.modal-label { font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--text-muted); margin-bottom:5px; }
.modal-title { font-family:'Playfair Display',serif; font-size:28px; font-weight:900; color:var(--ink); letter-spacing:-.5px; }
.modal-close { background:var(--white); border:1px solid var(--border); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; color:var(--text-muted); flex-shrink:0; transition:all .15s; }
.modal-close:hover { background:var(--cream-dk); color:var(--ink); }
.modal-body  { padding:24px 28px 28px; display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
.form-col    { display:flex; flex-direction:column; gap:14px; }
.form-row    { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.input { background:var(--white); border:1.5px solid var(--border); border-radius:12px; padding:11px 14px; font-size:14px; font-family:'DM Sans',sans-serif; color:var(--ink); outline:none; transition:border-color .15s; width:100%; appearance:none; -webkit-appearance:none; }
.input:focus { border-color:var(--grass); }
select.input { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a7a60' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; cursor:pointer; }
.info-box { background:var(--grass-pale); border-radius:12px; padding:11px 14px; font-size:13px; color:var(--grass); font-weight:500; }

/* BOOKING SUMMARY */
.summary { background:var(--grass); border-radius:20px; padding:24px; color:white; position:sticky; top:16px; }
.summary-label    { font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:6px; }
.summary-estimate { font-family:'Playfair Display',serif; font-size:40px; font-weight:700; color:white; line-height:1; margin-bottom:4px; }
.summary-note     { font-size:12px; color:rgba(255,255,255,.6); line-height:1.4; margin-bottom:18px; }
.summary-details  { background:rgba(255,255,255,.1); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:9px; margin-bottom:18px; }
.summary-row  { display:flex; justify-content:space-between; align-items:center; font-size:13px; }
.summary-lbl  { color:rgba(255,255,255,.6); }
.summary-val  { color:white; font-weight:600; }
.summary-submit { width:100%; background:white; color:var(--grass); border:none; padding:13px; border-radius:13px; font-size:15px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
.summary-submit:hover:not(:disabled) { background:var(--cream); transform:translateY(-1px); }
.summary-submit:disabled { opacity:.5; cursor:not-allowed; }

/* FOOTER */
.footer { border-top:1px solid var(--border); padding:28px 24px; text-align:center; font-size:13px; color:var(--text-muted); }
.footer a { text-decoration:none; }
.footer a:hover { text-decoration:underline; }

/* RESPONSIVE */
@media(max-width:1024px) {
  .services-grid { grid-template-columns:repeat(2,1fr); }
  .hero-grid { grid-template-columns:1fr; }
  .hero-card { display:none; }
  .detail-grid { grid-template-columns:1fr; }
  .detail-sidebar { position:static; }
  .pricing-grid { grid-template-columns:1fr; }
  .contact-grid { grid-template-columns:1fr; }
}
@media(max-width:768px) {
  .nav-links,.nav-cta { display:none; }
  .nav-burger { display:flex; }
  .modal-body { grid-template-columns:1fr; }
  .summary { position:static; order:-1; }
  .form-row { grid-template-columns:1fr; }
  .modal-head,.modal-body { padding-left:20px; padding-right:20px; }
}
@media(max-width:480px) {
  .services-grid { grid-template-columns:1fr; }
}
`;
