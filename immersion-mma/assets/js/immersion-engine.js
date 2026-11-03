/**
 * IMMERSION MIXED MARTIAL ARTS — MELBOURNE
 * ASSETS/JS/IMMERSION-ENGINE.JS
 * 2026 Sovereign Multi-Page Shared Architecture
 * Zero External Dependencies · LocalStorage State Persistence · Real-time Melbourne Live Mat Engine
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. TIMETABLE MASTER DATA (Glen Waverley & Ringwood)
     ========================================================================== */
  const IMMERSION_SCHEDULE = {
    gw: {
      name: "Glen Waverley HQ (655c Waverley Rd)",
      days: [
        {
          day: "Monday",
          dayIndex: 1,
          slots: [
            { time: "06:00", display: "6:00 AM", title: "Morning Muay Thai Conditioning", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "12:00", display: "12:00 PM", title: "Lunchtime No-Gi BJJ", disc: "bjj", badge: "No-Gi BJJ", coach: "Coach Sam Chew" },
            { time: "16:15", display: "4:15 PM", title: "Kids Bullyproof (Little Grapplers 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth BJJ Champions (Ages 8–14)", disc: "kids", badge: "Youth 8–14", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "BJJ Gi Fundamentals (Beginners)", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Kickboxing Fundamentals", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "19:15", display: "7:15 PM", title: "Advanced BJJ & Positional Sparring", disc: "bjj", badge: "Advanced BJJ", coach: "Coach Dave Marinakis & Sam Chew" },
            { time: "19:15", display: "7:15 PM", title: "Muay Thai Padwork & Clinch Lab", disc: "muaythai", badge: "Padwork & Clinch", coach: "Coach Kahow Lee" }
          ]
        },
        {
          day: "Tuesday",
          dayIndex: 2,
          slots: [
            { time: "06:00", display: "6:00 AM", title: "Morning BJJ Gi (All Levels)", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis" },
            { time: "12:00", display: "12:00 PM", title: "Midday Muay Thai Dutch Drills", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "16:15", display: "4:15 PM", title: "Kids Bullyproof (Little Grapplers 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth BJJ & Anti-Bully Shield (8–14)", disc: "kids", badge: "Youth 8–14", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "BJJ Gi Fundamentals (Guard Passing)", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Dutch Drills & Combos", disc: "muaythai", badge: "Muay Thai", coach: "Coach Kahow Lee" },
            { time: "19:15", display: "7:15 PM", title: "Competition BJJ Team Training", disc: "bjj", badge: "Competition BJJ", coach: "Coach Dave Marinakis" },
            { time: "19:15", display: "7:15 PM", title: "Muay Thai Sparring & Fight Strategy", disc: "muaythai", badge: "MT Sparring", coach: "Coach Mee Jaemmanee" }
          ]
        },
        {
          day: "Wednesday",
          dayIndex: 3,
          slots: [
            { time: "06:00", display: "6:00 AM", title: "Morning Muay Thai Kickboxing", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "12:00", display: "12:00 PM", title: "Midday No-Gi Grappling", disc: "bjj", badge: "No-Gi BJJ", coach: "Coach Sam Chew" },
            { time: "16:15", display: "4:15 PM", title: "Kids Muay Thai (Ages 4–7)", disc: "kids", badge: "Kids Striking", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth Muay Thai (Ages 8–14)", disc: "kids", badge: "Youth Striking", coach: "Coach Kahow Lee" },
            { time: "18:00", display: "6:00 PM", title: "No-Gi BJJ Fundamentals", disc: "bjj", badge: "No-Gi BJJ", coach: "Coach Dave Marinakis" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Kickboxing Fundamentals", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "19:15", display: "7:15 PM", title: "Advanced No-Gi & Leg Lock Systems", disc: "bjj", badge: "Advanced No-Gi", coach: "Coach Dave Marinakis & Sam Chew" },
            { time: "19:15", display: "7:15 PM", title: "Muay Thai Clinch & Body Weapons", disc: "muaythai", badge: "Muay Thai", coach: "Coach Kahow Lee" }
          ]
        },
        {
          day: "Thursday",
          dayIndex: 4,
          slots: [
            { time: "06:00", display: "6:00 AM", title: "Morning BJJ Gi", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis" },
            { time: "12:00", display: "12:00 PM", title: "Midday Muay Thai Conditioning", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "16:15", display: "4:15 PM", title: "Kids Bullyproof (Little Grapplers 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth BJJ Takedowns (Ages 8–14)", disc: "kids", badge: "Youth 8–14", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "BJJ Gi Fundamentals (Closed Guard)", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Power Pad Rounds", disc: "muaythai", badge: "Muay Thai", coach: "Coach Kahow Lee" },
            { time: "19:15", display: "7:15 PM", title: "Advanced BJJ Gi & Takedowns", disc: "bjj", badge: "Advanced BJJ", coach: "Coach Dave Marinakis" },
            { time: "19:15", display: "7:15 PM", title: "Muay Thai Sparring & Defense", disc: "muaythai", badge: "MT Sparring", coach: "Coach Mee Jaemmanee" }
          ]
        },
        {
          day: "Friday",
          dayIndex: 5,
          slots: [
            { time: "17:00", display: "5:00 PM", title: "Immersion Open Mat (Gi & No-Gi)", disc: "bjj", badge: "Open Mat", coach: "All Resident Coaches" }
          ]
        },
        {
          day: "Saturday",
          dayIndex: 6,
          slots: [
            { time: "09:00", display: "9:00 AM", title: "Kids BJJ (8-14) Youth Champions", disc: "kids", badge: "Kids 8–14", coach: "Coach Benjamin Tran" },
            { time: "10:00", display: "10:00 AM", title: "Muay Thai Weekend Conditioning", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "11:30", display: "11:30 AM", title: "BJJ Gi & No-Gi Masterclass", disc: "bjj", badge: "BJJ All Levels", coach: "Coach Dave Marinakis & Sam Chew" }
          ]
        }
      ]
    },
    rw: {
      name: "Ringwood Academy (60 Charter St)",
      days: [
        {
          day: "Monday",
          dayIndex: 1,
          slots: [
            { time: "06:30", display: "6:30 AM", title: "Morning BJJ Gi (Technique & Rolling)", disc: "bjj", badge: "BJJ Gi", coach: "Coach James Fitzgerald" },
            { time: "10:15", display: "10:15 AM", title: "BJJ Pro Training", disc: "bjj", badge: "Pro BJJ", coach: "Coach Dave Marinakis & Nikki Lloyd-Griffiths" },
            { time: "12:00", display: "12:00 PM", title: "Midday Muay Thai Conditioning", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "16:15", display: "4:15 PM", title: "Kids Bullyproof (Little Grapplers 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth BJJ (Ages 8–14)", disc: "kids", badge: "Youth 8–14", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Kickboxing All-Levels", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "19:00", display: "7:00 PM", title: "MMA Cage Control & Wall Wrestling", disc: "mma", badge: "MMA Cage Control", coach: "Coach James Fitzgerald & Sotir Kichukov" },
            { time: "20:00", display: "8:00 PM", title: "BJJ Gi (Guard Passing & Submissions)", disc: "bjj", badge: "BJJ Gi", coach: "Coach Dave Marinakis & James Fitzgerald" }
          ]
        },
        {
          day: "Tuesday",
          dayIndex: 2,
          slots: [
            { time: "06:30", display: "6:30 AM", title: "Morning Muay Thai & Core Blast", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "12:00", display: "12:00 PM", title: "Midday BJJ Gi Mechanics", disc: "bjj", badge: "BJJ Gi", coach: "Coach Sam Chew" },
            { time: "16:15", display: "4:15 PM", title: "Kids Muay Thai (Ages 4–14)", disc: "kids", badge: "Kids Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "17:30", display: "5:30 PM", title: "Competition BJJ Grappling", disc: "bjj", badge: "Competition BJJ", coach: "Coach Dave Marinakis" },
            { time: "18:30", display: "6:30 PM", title: "Sotir Kichukov Pro Striking & MMA Transitions", disc: "mma", badge: "MMA Striking", coach: "Coach Sotir Kichukov" },
            { time: "19:30", display: "7:30 PM", title: "Fundamentals BJJ (Beginners Stream)", disc: "bjj", badge: "Fundamentals BJJ", coach: "Coach Sam Chew & James Fitzgerald" },
            { time: "20:15", display: "8:15 PM", title: "Muay Thai Heavy Pad Rounds", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" }
          ]
        },
        {
          day: "Wednesday",
          dayIndex: 3,
          slots: [
            { time: "06:30", display: "6:30 AM", title: "Morning BJJ Gi Leverage & Escapes", disc: "bjj", badge: "BJJ Gi", coach: "Coach James Fitzgerald" },
            { time: "12:00", display: "12:00 PM", title: "Midday Muay Thai Technical Sparring", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "16:15", display: "4:15 PM", title: "Kids Bullyproof (Little Grapplers 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "17:00", display: "5:00 PM", title: "Youth BJJ Champions (Ages 8–14)", disc: "kids", badge: "Youth 8–14", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "Muay Thai Kickboxing All-Levels", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "19:00", display: "7:00 PM", title: "No-Gi BJJ & Leg Lock Systems", disc: "bjj", badge: "No-Gi BJJ", coach: "Coach Nikki Lloyd-Griffiths & Dave Marinakis" },
            { time: "20:00", display: "8:00 PM", title: "Wrestling / ADCC Grappling", disc: "bjj", badge: "Wrestling / ADCC", coach: "Coach James Fitzgerald & Nikki Lloyd-Griffiths" }
          ]
        },
        {
          day: "Thursday",
          dayIndex: 4,
          slots: [
            { time: "06:30", display: "6:30 AM", title: "Morning Muay Thai Kickboxing", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "12:00", display: "12:00 PM", title: "Midday No-Gi BJJ Submission Hunting", disc: "bjj", badge: "No-Gi BJJ", coach: "Coach Sam Chew" },
            { time: "16:15", display: "4:15 PM", title: "Kids Muay Thai Striking (4–14)", disc: "kids", badge: "Kids Muay Thai", coach: "Coach Mee Jaemmanee" },
            { time: "17:00", display: "5:00 PM", title: "Advanced Youth BJJ (Competition Track)", disc: "kids", badge: "Advanced Kids", coach: "Coach Benjamin Tran" },
            { time: "18:00", display: "6:00 PM", title: "Sotir Kichukov MMA Ground Control & Takedowns", disc: "mma", badge: "MMA Ground Control", coach: "Coach Sotir Kichukov & James Fitzgerald" },
            { time: "19:15", display: "7:15 PM", title: "Fundamentals BJJ Gi", disc: "bjj", badge: "Fundamentals BJJ", coach: "Coach Sam Chew & James Fitzgerald" },
            { time: "20:15", display: "8:15 PM", title: "Muay Thai Kickboxing Combinations", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" }
          ]
        },
        {
          day: "Friday",
          dayIndex: 5,
          slots: [
            { time: "18:00", display: "6:00 PM", title: "Intermediate MMA (Invite Only)", disc: "mma", badge: "Intermediate MMA", coach: "Coach James Fitzgerald & Sotir Kichukov" }
          ]
        },
        {
          day: "Saturday",
          dayIndex: 6,
          slots: [
            { time: "09:00", display: "9:00 AM", title: "Kids BJJ Little Champions (Ages 4–7)", disc: "kids", badge: "Kids 4–7", coach: "Coach Benjamin Tran" },
            { time: "09:30", display: "9:30 AM", title: "Kids BJJ Junior Champions (Ages 8–14)", disc: "kids", badge: "Junior 8–14", coach: "Coach Benjamin Tran" },
            { time: "10:30", display: "10:30 AM", title: "BJJ Gi All-Levels Technical Masterclass", disc: "bjj", badge: "BJJ Gi", coach: "Coach James Fitzgerald & Sam Chew" },
            { time: "11:45", display: "11:45 AM", title: "Sotir Kichukov MMA Striking Clinic", disc: "mma", badge: "MMA Striking", coach: "Coach Sotir Kichukov" },
            { time: "12:45", display: "12:45 PM", title: "Muay Thai Kickboxing & Clinch Lab", disc: "muaythai", badge: "Muay Thai", coach: "Coach Mee Jaemmanee" }
          ]
        }
      ]
    }
  };

  /* ==========================================================================
     2. STATIC TOP BAR BADGE (Ticker replaced per user requirement)
     ========================================================================== */
  // Preserves clean static badge: 🟢 Glen Waverley: (03) 8555 9881 · Ringwood: (03) 9879 6052 · Open Mon–Sat from 6:00 AM

  /* ==========================================================================
     3. PERSISTENT STORAGE HELPERS
     ========================================================================== */
  const Storage = {
    get: (key, fallback = null) => {
      try {
        const val = localStorage.getItem('immersion_' + key);
        return val ? JSON.parse(val) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set: (key, val) => {
      try {
        localStorage.setItem('immersion_' + key, JSON.stringify(val));
      } catch (e) {}
    }
  };

  /* ==========================================================================
     4. GLOBAL SLIDE-OUT QUICK TRIAL BOOKING DRAWER
     ========================================================================== */
  function injectBookingDrawer() {
    if (document.getElementById('trial-drawer-overlay')) return;

    const drawerHTML = `
      <div class="trial-drawer-overlay" id="trial-drawer-overlay" aria-hidden="true">
        <div class="trial-drawer-panel" role="dialog" aria-label="Book Free Trial Class">
          <div class="drawer-header">
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 900; color: #fff;">Book 100% Free Intro Class</h3>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Zero Cost · No Lock-In Contracts · Free Loaner Gear</p>
            </div>
            <button type="button" class="drawer-close-btn" id="drawer-close-btn" aria-label="Close Drawer">×</button>
          </div>
          <div class="drawer-body">
            <form id="drawer-trial-form" style="display:flex; flex-direction:column; gap:16px;" novalidate>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Full Name *</label>
                <input type="text" id="drawer-name" class="form-field-input" placeholder="e.g. Jack Edwards" required style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
              </div>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Mobile Number (AU) *</label>
                <input type="tel" id="drawer-phone" class="form-field-input" placeholder="e.g. 0412 345 678" required style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
              </div>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Email Address *</label>
                <input type="email" id="drawer-email" class="form-field-input" placeholder="e.g. jack@example.com.au" required style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
              </div>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Preferred Melbourne Academy *</label>
                <select id="drawer-location" style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
                  <option value="Glen Waverley HQ (655c Waverley Rd)">Glen Waverley HQ (655c Waverley Rd)</option>
                  <option value="Ringwood Academy (60 Charter St)">Ringwood Academy (60 Charter St)</option>
                </select>
              </div>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Program of Interest *</label>
                <select id="drawer-program" style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
                  <option value="BJJ Fundamentals">Brazilian Jiu-Jitsu (BJJ Fundamentals)</option>
                  <option value="Muay Thai Kickboxing">Muay Thai Kickboxing</option>
                  <option value="MMA & Wrestling">Mixed Martial Arts (MMA) &amp; Wrestling</option>
                  <option value="Kids Martial Arts (4–7)">Little Grapplers (Kids 4–7)</option>
                  <option value="Kids Martial Arts (8–14)">Youth Champions (Kids &amp; Teens 8–14)</option>
                </select>
              </div>
              <div class="calc-field-group">
                <label class="calc-label" style="font-size:0.78rem;">Experience Level</label>
                <select id="drawer-experience" style="background:rgba(9,13,22,0.9); border:1px solid var(--border-light); padding:12px; border-radius:8px; color:#fff;">
                  <option value="Complete Beginner">Complete Beginner (Never trained before)</option>
                  <option value="Some Experience">Some Experience (Trained previously)</option>
                  <option value="Competitor">Active Competitor / Advanced</option>
                </select>
              </div>
              <button type="submit" class="btn btn-crimson pulse-glow" style="width:100%; margin-top:8px;">
                Lock In Free Trial Class →
              </button>
            </form>
            <div id="drawer-success-message">
              <div style="display:flex; justify-content:center; margin-bottom: 12px;"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
              <h4 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Spot Reserved!</h4>
              <p style="font-size: 0.875rem; color: #D1FAE5; line-height: 1.5;">
                Ben from the Immersion front desk is confirming your spot. We'll text you parking directions and what to wear. See you on the mats!
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    const overlay = document.getElementById('trial-drawer-overlay');
    const closeBtn = document.getElementById('drawer-close-btn');
    const form = document.getElementById('drawer-trial-form');
    const successMsg = document.getElementById('drawer-success-message');

    window.openTrialDrawer = function (prefilledProgram = null, prefilledLoc = null) {
      if (overlay) {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
      }
      if (prefilledProgram) {
        const progEl = document.getElementById('drawer-program');
        if (progEl) progEl.value = prefilledProgram;
      }
      if (prefilledLoc) {
        const locEl = document.getElementById('drawer-location');
        if (locEl) locEl.value = prefilledLoc;
      }
    };

    window.closeTrialDrawer = function () {
      if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    };

    if (closeBtn) closeBtn.addEventListener('click', window.closeTrialDrawer);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeTrialDrawer();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('drawer-name');
        const phone = document.getElementById('drawer-phone');
        const email = document.getElementById('drawer-email');

        if (!name || !name.value.trim()) { alert('Please enter your full name.'); name && name.focus(); return; }
        if (!phone || !phone.value.trim()) { alert('Please enter your phone number.'); phone && phone.focus(); return; }
        if (!email || !email.value.trim() || !email.value.includes('@')) { alert('Please enter a valid email.'); email && email.focus(); return; }

        form.style.display = 'none';
        if (successMsg) successMsg.style.display = 'block';
      });
    }

    // Attach to all elements with class .btn-trial-trigger
    document.querySelectorAll('.btn-trial-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const prog = btn.getAttribute('data-program');
        const loc = btn.getAttribute('data-location');
        window.openTrialDrawer(prog, loc);
      });
    });
  }

  /* ==========================================================================
     5. GLOBAL "BEN — FRONT DESK CONCIERGE" CHAT WIDGET
     ========================================================================== */
  function injectBenConcierge() {
    if (document.getElementById('ben-launcher')) return;

    const chatHTML = `
      <div class="ben-chat-launcher" id="ben-launcher" role="button" aria-label="Open Ben Immersion Concierge Chat">
        <div class="launcher-avatar-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          <span class="launcher-online-dot"></span>
        </div>
        <div class="launcher-text-wrap">
          <span class="launcher-title">Ben · Front Desk</span>
          <span class="launcher-subtitle">● Online · Click to ask</span>
        </div>
      </div>

      <div class="ben-chat-window" id="ben-chat-window" role="dialog" aria-label="Immersion Concierge Chat Window">
        <div class="chat-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="launcher-avatar-wrap" style="width: 38px; height: 38px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            </div>
            <div>
              <h4 style="font-family: var(--font-display); font-size: 0.9375rem; font-weight: 800; color: #fff; line-height: 1.1;">Ben (Front Desk Concierge)</h4>
              <span style="font-size: 0.72rem; color: var(--emerald); font-weight: 700;">● Active · Glen Waverley &amp; Ringwood</span>
            </div>
          </div>
          <button type="button" class="drawer-close-btn" id="ben-chat-close" style="font-size: 20px;">×</button>
        </div>

        <div class="chat-messages-container" id="chat-messages-container">
          <div class="chat-msg chat-msg-ben">
            G'day! I'm Ben from the Immersion front desk. Whether you're curious about BJJ belts, Muay Thai conditioning, or our Kids bully-proof classes, I'm here to help. Pick a topic below or type anything!
          </div>

          <div class="chat-chips-row" id="chat-chips-row">
            <button type="button" class="chat-prompt-chip" data-prompt="beginner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Complete beginner — where do I start?
            </button>
            <button type="button" class="chat-prompt-chip" data-prompt="kids">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Kids classes (Ages 4–7 &amp; 8–14) info
            </button>
            <button type="button" class="chat-prompt-chip" data-prompt="contracts">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:4px;"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> No lock-in contracts &amp; pause policy
            </button>
            <button type="button" class="chat-prompt-chip" data-prompt="timetable">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle; margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Glen Waverley vs Ringwood timetable
            </button>
          </div>
        </div>

        <form class="chat-input-bar" id="chat-form">
          <input type="text" id="chat-user-input" class="chat-input-box" placeholder="Ask Ben anything about training..." autocomplete="off">
          <button type="submit" class="chat-send-btn" aria-label="Send">Send</button>
        </form>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const launcher = document.getElementById('ben-launcher');
    const windowEl = document.getElementById('ben-chat-window');
    const closeBtn = document.getElementById('ben-chat-close');
    const container = document.getElementById('chat-messages-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-user-input');

    function toggleChat() {
      if (!windowEl) return;
      windowEl.classList.toggle('open');
      if (windowEl.classList.contains('open') && chatInput) chatInput.focus();
    }

    if (launcher) launcher.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);

    function appendMsg(sender, text, withAction = false) {
      if (!container) return;
      const msg = document.createElement('div');
      msg.className = `chat-msg chat-msg-${sender}`;
      msg.innerHTML = text;
      if (withAction) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-crimson';
        btn.style.cssText = 'margin-top: 10px; width: 100%; font-size: 0.78rem; padding: 8px 12px;';
        btn.innerHTML = '<svg class="icon-inline" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Book 100% Free Intro Class &rarr;';
        btn.addEventListener('click', () => {
          toggleChat();
          window.openTrialDrawer();
        });
        msg.appendChild(btn);
      }
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }

    const answers = {
      beginner: "Over 80% of our new members have never trained martial arts before! Our dedicated Fundamentals streams in BJJ and Muay Thai break everything down step-by-step. We loan you all sanitized gear on day 1 — just bring gym clothes and water!",
      kids: "We run two age-split streams: Little Grapplers (Ages 4–7) focusing on motor skills and listening; and Youth Champions (Ages 8–14) teaching real-world non-violent bully-proofing and self-confidence. Both run after school at Glen Waverley and Ringwood!",
      contracts: "Zero shady contracts! We don't believe in trapping members. If you're travelling, studying for exams, or recovering from an injury, just tell us at reception and we will pause your account immediately.",
      timetable: "Both Glen Waverley (655c Waverley Rd) and Ringwood (60 Charter St) run classes Monday to Saturday. Dawn patrol starts at 6:00 AM, midday sessions at 12:00 PM, kids at 4:15 PM, and evening classes from 6:00 PM to 8:00 PM."
    };

    document.querySelectorAll('.chat-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const promptKey = chip.getAttribute('data-prompt');
        appendMsg('user', chip.textContent.trim());
        chip.style.display = 'none';
        setTimeout(() => {
          appendMsg('ben', answers[promptKey] || "Happy to help!", true);
        }, 400);
      });
    });

    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = chatInput.value.trim();
        if (!q) return;
        appendMsg('user', q);
        chatInput.value = '';

        setTimeout(() => {
          const lower = q.toLowerCase();
          let reply = "That's a fantastic question! Head Coaches Dave, Mee, Sam, and the team are on the mats daily. The best way to experience Immersion is to come in for a 100% Free Trial Class.";
          if (lower.includes('price') || lower.includes('cost') || lower.includes('fee')) {
            reply = "We offer flexible weekly memberships with no lock-ins, zero joining fees, and easy pause options whenever you travel!";
          } else if (lower.includes('bjj') || lower.includes('jiu jitsu') || lower.includes('belt')) {
            reply = "Head Coach Dave Marinakis is an ADCC World Competitor and 3rd Degree Black Belt. We have 5+ Black Belts on the mats and separate beginner/advanced streams.";
          } else if (lower.includes('muay thai') || lower.includes('kickboxing') || lower.includes('striking')) {
            reply = "Coach Mee runs authentic Muay Thai striking — punches, kicks, knees, elbows and clinch. It's safe, thrilling, and burns 800+ calories!";
          } else if (lower.includes('where') || lower.includes('location') || lower.includes('address')) {
            reply = "We are at 655c Waverley Rd (Glen Waverley) and 60 Charter St (Ringwood). Both have ample parking!";
          }
          appendMsg('ben', reply, true);
        }, 450);
      });
    }
  }

  /* ==========================================================================
     6. PAGE 2: BJJ BELT & CURRICULUM EXPLORER (bjj-grappling.html)
     ========================================================================== */
  function initBjjBeltExplorer() {
    const container = document.getElementById('bjj-belt-explorer');
    if (!container) return;

    const beltData = {
      white: {
        name: "White Belt: Foundations & Survival",
        duration: "12–18 Months (4 Stripes)",
        desc: "The most important belt in Jiu-Jitsu. Under Dave Marinakis and Sam, you learn how to protect yourself, remain calm under pressure, master guard retention, and execute fundamental escapes and sweeps.",
        focus: "Positional survival, breathing control, foundational sweeps, closed guard, and basic collar/arm submissions.",
        safety: "Zero live free sparring until fundamental positioning and tap etiquette are fully mastered. 100% controlled drill environment.",
        grading: "Earn stripes based on consistent class attendance, technique retention, and ego-free mat etiquette."
      },
      blue: {
        name: "Blue Belt: Technical Architecture & Offensive Chains",
        duration: "2–3 Years (4 Stripes)",
        desc: "You have survived the trial of white belt. Now you build your offensive vocabulary: chaining submissions, fluid guard passing, and developing personal guard archetypes (Half Guard, De La Riva, Butterfly).",
        focus: "Passing open guards, counter-attacks, triangle and armbar chains, front headlock escapes, and initial leg entanglement awareness.",
        safety: "Controlled sparring with experienced partners who actively regulate intensity.",
        grading: "Demonstrated ability to escape all standard bad positions and execute 3+ offensive sequences against resisting blue/white belts."
      },
      purple: {
        name: "Purple Belt: The Creative Artisan & Pace Controller",
        duration: "2–3 Years (4 Stripes)",
        desc: "Widely regarded by BJJ practitioners as the most fun rank. You understand how leverage works effortlessly and can dictate the pace of rolling with minimal physical exertion.",
        focus: "Micro-adjustments, back-take variations, berimbolo/inversion mechanics, advanced leg locks, and pressure passing.",
        safety: "Deep technical fluency; students roll with absolute safety and self-restraint.",
        grading: "Personal game development, consistent technical execution against higher ranks, and mentoring lower belts."
      },
      brown: {
        name: "Brown Belt: The Polished Weapon & Precision Finisher",
        duration: "1.5–2 Years (4 Stripes)",
        desc: "Refining every tiny edge. A brown belt has an answer for virtually every position and specializes in high-percentage, clinical submission finishes.",
        focus: "Heavy top pressure, modern no-gi leg entanglements (50/50, saddle), wrestling takedown integration, and zero wasted movement.",
        safety: "Flawless partner protection; submissions are locked in smoothly with zero sudden jerking.",
        grading: "Mastery of both Gi and No-Gi rule sets under ADCC and IBJJF criteria."
      },
      black: {
        name: "Black Belt: Mastery, Lineage & Lifetime Evolution",
        duration: "10+ Years of Dedication",
        desc: "Certified under Head Coach Dave Marinakis (3rd Degree Black Belt). Black belt is not the finish line — it is the true beginning of selfless teaching, lineage preservation, and effortless mastery.",
        focus: "Timing, invisible Jiu-Jitsu leverage, pedagogy, mental calmness, and lifelong personal resilience.",
        safety: "Highest echelon of body awareness and protection.",
        grading: "Conferred exclusively by Head Coach Dave Marinakis following years of continuous contribution to the Immersion community."
      }
    };

    const tabs = container.querySelectorAll('.belt-tab-btn');
    const titleEl = document.getElementById('belt-display-name');
    const durEl = document.getElementById('belt-display-duration');
    const descEl = document.getElementById('belt-display-desc');
    const focusEl = document.getElementById('belt-display-focus');
    const safetyEl = document.getElementById('belt-display-safety');
    const gradingEl = document.getElementById('belt-display-grading');

    function selectBelt(key) {
      tabs.forEach(t => t.classList.remove('active'));
      const activeTab = container.querySelector(`[data-belt="${key}"]`);
      if (activeTab) activeTab.classList.add('active');

      const data = beltData[key];
      if (!data) return;

      if (titleEl) titleEl.textContent = data.name;
      if (durEl) durEl.textContent = data.duration;
      if (descEl) descEl.textContent = data.desc;
      if (focusEl) focusEl.textContent = data.focus;
      if (safetyEl) safetyEl.textContent = data.safety;
      if (gradingEl) gradingEl.textContent = data.grading;

      Storage.set('selectedBelt', key);
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        selectBelt(tab.getAttribute('data-belt'));
      });
    });

    const savedBelt = Storage.get('selectedBelt', 'white');
    selectBelt(savedBelt);
  }

  /* ==========================================================================
     7. PAGE 3: INTENSITY & CALORIE CALCULATOR (muay-thai-mma.html)
     ========================================================================== */
  function initConditioningCalculator() {
    const slider = document.getElementById('intensity-slider');
    const sessionsLabel = document.getElementById('slider-sessions-val');
    const typeMt = document.getElementById('calc-type-mt');
    const typeMma = document.getElementById('calc-type-mma');
    const calsMonthlyEl = document.getElementById('calc-monthly-cals');
    const fatLossEl = document.getElementById('calc-fat-loss');
    const milestoneEl = document.getElementById('calc-milestone');
    const gearEl = document.getElementById('calc-gear');

    if (!slider || !calsMonthlyEl) return;

    let discipline = 'muaythai';

    function recalculate() {
      const sessions = Number(slider.value);
      if (sessionsLabel) sessionsLabel.textContent = `${sessions} ${sessions === 1 ? 'Session' : 'Sessions'} / Week`;

      const perClassCals = discipline === 'muaythai' ? 850 : 920;
      const monthlySessions = sessions * 4.33;
      const totalCals = Math.round(monthlySessions * perClassCals);
      const approxKg = (totalCals / 7700).toFixed(1);

      calsMonthlyEl.textContent = totalCals.toLocaleString() + " kcal";
      if (fatLossEl) fatLossEl.textContent = `~${approxKg} kg potential fat burn / month`;

      if (milestoneEl) {
        if (discipline === 'muaythai') {
          if (sessions <= 2) milestoneEl.textContent = "90-Day Milestone: Crisp stance, powerful roundhouse kicks & 3-hit combinations.";
          else if (sessions <= 4) milestoneEl.textContent = "90-Day Milestone: Fluid Dutch combos, solid clinch knees & advanced defensive slips.";
          else milestoneEl.textContent = "90-Day Milestone: Pro-level conditioning, seamless switch-kicks & tournament cardio readiness.";
        } else {
          if (sessions <= 2) milestoneEl.textContent = "90-Day Milestone: Double-leg takedown mechanics, cage wall posture & sprawl defence.";
          else if (sessions <= 4) milestoneEl.textContent = "90-Day Milestone: Seamless striking-to-grapple transitions & ground-and-pound control.";
          else milestoneEl.textContent = "90-Day Milestone: High-level cage wrestling, ADCC submissions & amateur fight readiness.";
        }
      }

      if (gearEl) {
        gearEl.textContent = discipline === 'muaythai' 
          ? "Gear provided on Day 1: Sanitized boxing gloves, Thai shin guards & kick pads."
          : "Gear provided on Day 1: MMA sparring gloves, wrestling mats & loaner rashguards.";
      }
    }

    slider.addEventListener('input', recalculate);

    if (typeMt) {
      typeMt.addEventListener('click', () => {
        discipline = 'muaythai';
        typeMt.classList.add('selected');
        typeMma && typeMma.classList.remove('selected');
        recalculate();
      });
    }

    if (typeMma) {
      typeMma.addEventListener('click', () => {
        discipline = 'mma';
        typeMma.classList.add('selected');
        typeMt && typeMt.classList.remove('selected');
        recalculate();
      });
    }

    recalculate();
  }

  /* ==========================================================================
     8. PAGE 4: PARENT BULLYPROOF ASSESSMENT (kids-bullyproof.html)
     ========================================================================== */
  function initKidsBullyproofAssessment() {
    const container = document.getElementById('kids-assessment-tool');
    if (!container) return;

    let selectedAge = 'junior';
    let selectedChallenge = 'confidence';

    const ageBtns = container.querySelectorAll('.age-choice-btn');
    const challengeBtns = container.querySelectorAll('.challenge-choice-btn');
    const titleEl = document.getElementById('kids-result-title');
    const timelineEl = document.getElementById('kids-result-timeline');
    const quotesEl = document.getElementById('kids-result-story');

    const roadmaps = {
      'junior-confidence': {
        title: "Little Grapplers (4–7): Assertive Posture & Voice",
        timeline: "Month 1: Eye contact & coach trust → Month 2: Balance & tumbling confidence → Month 3: Safe non-violent balance neutralization."
      },
      'junior-energy': {
        title: "Little Grapplers (4–7): Discipline & Structured Focus",
        timeline: "Month 1: Mat listening rules & respectful bowing → Month 2: Channelled athletic stamina → Month 3: High-retention focus at school."
      },
      'junior-bully': {
        title: "Little Grapplers (4–7): Gentle Anti-Bully Shield",
        timeline: "Month 1: Loud assertive boundary voice ('Stop! Back away!') → Month 2: Safe grip breaks → Month 3: Unshakeable personal courage."
      },
      'youth-confidence': {
        title: "Youth Champions (8–14): Self-Esteem & Physical Strength",
        timeline: "Month 1: Guard posture & basic escapes → Month 2: Thai striking stance & coordination → Month 3: Earn first official stripe under Dave & Shah."
      },
      'youth-energy': {
        title: "Youth Champions (8–14): Screen Detox & Athletic Grit",
        timeline: "Month 1: Intense, positive cardio conditioning → Month 2: Core stability & agility → Month 3: Healthy camaraderie with top Melbourne youth."
      },
      'youth-bully': {
        title: "Youth Champions (8–14): Total Bully-Proofing & Control",
        timeline: "Month 1: De-escalation & distance management → Month 2: Takedown defence & headlock escapes → Month 3: Calm composure under pressure."
      }
    };

    function updateKidsResult() {
      const key = `${selectedAge}-${selectedChallenge}`;
      const data = roadmaps[key] || roadmaps['junior-confidence'];

      if (titleEl) titleEl.textContent = data.title;
      if (timelineEl) timelineEl.textContent = data.timeline;
    }

    ageBtns.forEach(b => {
      b.addEventListener('click', () => {
        ageBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedAge = b.getAttribute('data-age');
        updateKidsResult();
      });
    });

    challengeBtns.forEach(b => {
      b.addEventListener('click', () => {
        challengeBtns.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedChallenge = b.getAttribute('data-challenge');
        updateKidsResult();
      });
    });

    updateKidsResult();
  }

  /* ==========================================================================
     9. PAGE 5 & 1: FILTERABLE TIMETABLE RENDERER
     ========================================================================== */
  function getCoachThumb(coachStr) {
    const c = (coachStr || '').toLowerCase();
    if (c.includes('nikki')) return './assets/images/coaches/nikki.png';
    if (c.includes('james')) return './assets/images/coaches/james.png';
    if (c.includes('sam')) return './assets/images/coaches/sam.jpg';
    if (c.includes('kahow')) return './assets/images/coaches/muaythai-kahow.jpg';
    if (c.includes('lee')) return './assets/images/coaches/lee.jpg';
    if (c.includes('mee') || c.includes('sotir')) return './assets/images/coaches/muaythai-kahow.jpg';
    if (c.includes('ben') || c.includes('shah') || c.includes('kai-ser') || c.includes('mateja') || c.includes('youth') || c.includes('kids')) return './assets/images/coaches/ben.jpg';
    if (c.includes('dave')) return './assets/images/coaches/dave.jpg';
    return './assets/images/coaches/dave.jpg';
  }

  function switchLocation(loc) {
    if (window._immersionSwitchLocation) {
      window._immersionSwitchLocation(loc);
    }
  }
  window.switchLocation = switchLocation;

  function filterSchedule(discipline) {
    if (window._immersionFilterSchedule) {
      window._immersionFilterSchedule(discipline);
    }
  }
  window.filterSchedule = filterSchedule;

  function initTimetableRenderer() {
    const container = document.getElementById('timetable-container');
    if (!container) return;

    ['gw-static-schedule', 'rw-static-schedule', 'static-schedule-fallback'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    let activeLoc = Storage.get('preferredLoc', 'gw');
    let activeDiscipline = 'all';

    const tabGw = document.getElementById('tab-gw');
    const tabRw = document.getElementById('tab-rw');

    window._immersionSwitchLocation = function(loc) {
      activeLoc = loc;
      Storage.set('preferredLoc', loc);
      if (tabGw && tabRw) {
        if (loc === 'gw') {
          tabGw.classList.add('active');
          tabRw.classList.remove('active');
        } else {
          tabRw.classList.add('active');
          tabGw.classList.remove('active');
        }
      }
      render();
    };

    window._immersionFilterSchedule = function(discipline) {
      activeDiscipline = discipline || 'all';
      document.querySelectorAll('.discipline-pill-btn').forEach(pill => {
        const d = pill.getAttribute('data-discipline') || pill.getAttribute('data-filter') || pill.getAttribute('data-disc') || 'all';
        if (d === activeDiscipline) pill.classList.add('active');
        else pill.classList.remove('active');
      });
      render();
    };

    function render() {
      container.innerHTML = '';
      const data = IMMERSION_SCHEDULE[activeLoc];

      data.days.forEach(day => {
        const card = document.createElement('div');
        card.className = 'day-column-card';

        const visible = day.slots.filter(s => activeDiscipline === 'all' || s.disc === activeDiscipline);

        card.innerHTML = `
          <div class="day-card-header">
            <span class="day-card-name">${day.day}</span>
            <span class="day-card-count">${visible.length} Classes</span>
          </div>
          <div class="day-slots-list">
            ${visible.length === 0 ? `
              <div style="padding: 28px 16px; text-align: center; color: var(--text-dim); font-size: 0.8125rem;">
                No ${activeDiscipline.toUpperCase()} sessions scheduled on ${day.day}.
              </div>
            ` : ''}
            ${day.slots.map(s => {
              const isHidden = (activeDiscipline !== 'all' && s.disc !== activeDiscipline);
              let badgeClass = 'badge-bjj';
              let badgeIcon = '🥋 ';
              if (s.disc === 'muaythai') {
                badgeClass = 'badge-muaythai';
                badgeIcon = '🥊 ';
              } else if (s.disc === 'mma') {
                badgeClass = 'badge-mma';
                badgeIcon = '🤼 ';
              } else if (s.disc === 'kids') {
                badgeClass = 'badge-kids';
                badgeIcon = '👦 ';
              } else if (s.disc === 'openmat' || (s.badge && s.badge.toLowerCase().includes('open mat'))) {
                badgeClass = 'badge-openmat';
                badgeIcon = '⚡ ';
              }
              const coachImg = getCoachThumb(s.coach);

              return `
                <div class="class-slot-item ${isHidden ? 'hidden' : ''}" 
                     data-day="${day.day}" 
                     data-time="${s.display}" 
                     data-title="${s.title}" 
                     data-disc="${s.disc}"
                     data-loc="${data.name}">
                  <div class="slot-time-col">
                    <span class="slot-time-val">${s.display.split(' ')[0]}</span>
                    <span class="slot-period">${s.display.split(' ')[1]}</span>
                  </div>
                  <div class="slot-info-col">
                    <span class="slot-title">${s.title}</span>
                    <span class="slot-coach-meta">
                      <img src="${coachImg}" alt="${s.coach}" class="slot-coach-thumb" loading="lazy">
                      <span>${s.coach}</span>
                    </span>
                  </div>
                  <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    <span class="slot-discipline-badge ${badgeClass}"><span style="margin-right:2px;">${badgeIcon}</span>${s.badge}</span>
                    <span class="slot-book-hint">Book →</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        container.appendChild(card);
      });

      // Slot Click Handlers -> Open Quick Trial Drawer
      container.querySelectorAll('.class-slot-item').forEach(slot => {
        slot.addEventListener('click', () => {
          const title = slot.getAttribute('data-title');
          const day = slot.getAttribute('data-day');
          const time = slot.getAttribute('data-time');
          const loc = slot.getAttribute('data-loc');

          let progVal = "BJJ Fundamentals";
          const tLower = (title || '').toLowerCase();
          if (tLower.includes('muay thai') || tLower.includes('muaythai') || tLower.includes('kickboxing')) {
            progVal = "Muay Thai Kickboxing";
          } else if (tLower.includes('mma') || tLower.includes('wrestling')) {
            progVal = "MMA & Wrestling";
          } else if (tLower.includes('kids') || tLower.includes('bullyproof')) {
            progVal = (tLower.includes('4–7') || tLower.includes('4-7')) 
              ? "Kids Martial Arts (4–7)" 
              : "Kids Martial Arts (8–14)";
          }

          if (window.openTrialDrawer) {
            window.openTrialDrawer(progVal, loc);
          }
        });
      });
    }

    if (tabGw && tabRw) {
      tabGw.addEventListener('click', () => {
        activeLoc = 'gw';
        tabGw.classList.add('active');
        tabRw.classList.remove('active');
        Storage.set('preferredLoc', 'gw');
        render();
      });

      tabRw.addEventListener('click', () => {
        activeLoc = 'rw';
        tabRw.classList.add('active');
        tabGw.classList.remove('active');
        Storage.set('preferredLoc', 'rw');
        render();
      });

      if (activeLoc === 'rw') {
        tabRw.classList.add('active');
        tabGw.classList.remove('active');
      }
    }

    document.querySelectorAll('.discipline-pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.discipline-pill-btn').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeDiscipline = pill.getAttribute('data-discipline') || pill.getAttribute('data-filter') || pill.getAttribute('data-disc') || 'all';
        render();
      });
    });

    render();
  }

  /* ==========================================================================
     10. INITIALIZATION LIFECYCLE
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    // 0. Autoplay Video Enforcer
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(v => {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      const p = v.play();
      if (p !== undefined) {
        p.catch(() => {
          const wake = () => {
            allVideos.forEach(vid => {
              vid.muted = true;
              vid.play().catch(() => {});
            });
          };
          window.addEventListener('click', wake, { once: true });
          window.addEventListener('touchstart', wake, { once: true });
          window.addEventListener('scroll', wake, { once: true });
        });
      }
    });

    // 1. Inject Global Drawer & Concierge
    injectBookingDrawer();
    injectBenConcierge();

    // 2. Global Slot Click Listener for pre-rendered schedules
    document.querySelectorAll('.schedule-slot-row').forEach(slot => {
      slot.addEventListener('click', () => {
        const title = slot.getAttribute('data-title') || slot.querySelector('.slot-name')?.textContent?.trim() || "BJJ Fundamentals";
        const loc = slot.getAttribute('data-loc') || "Glen Waverley HQ (655c Waverley Rd)";
        
        let progVal = "BJJ Fundamentals";
        const tLower = (title || '').toLowerCase();
        if (tLower.includes('muay thai') || tLower.includes('muaythai') || tLower.includes('kickboxing')) {
          progVal = "Muay Thai Kickboxing";
        } else if (tLower.includes('mma') || tLower.includes('wrestling')) {
          progVal = "MMA & Wrestling";
        } else if (tLower.includes('kids') || tLower.includes('bullyproof')) {
          progVal = (tLower.includes('4–7') || tLower.includes('4-7')) 
            ? "Kids Martial Arts (4–7)" 
            : "Kids Martial Arts (8–14)";
        }

        if (window.openTrialDrawer) {
          window.openTrialDrawer(progVal, loc);
        }
      });
    });

    // 3. Global Form Handler for #free-trial-form (on-page booking)
    const onpageForm = document.getElementById('free-trial-form');
    const onpageSuccess = document.getElementById('booking-success-message');
    if (onpageForm) {
      onpageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const n = document.getElementById('lead-name');
        const p = document.getElementById('lead-phone');
        const em = document.getElementById('lead-email');
        if (!n || !n.value.trim()) { alert('Please enter your full name.'); n && n.focus(); return; }
        if (!p || !p.value.trim()) { alert('Please enter your phone number.'); p && p.focus(); return; }
        if (!em || !em.value.trim() || !em.value.includes('@')) { alert('Please enter a valid email address.'); em && em.focus(); return; }

        onpageForm.style.display = 'none';
        if (onpageSuccess) {
          onpageSuccess.style.display = 'block';
          onpageSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    // 4. Page specific modules
    initBjjBeltExplorer();
    initConditioningCalculator();
    initKidsBullyproofAssessment();
    initTimetableRenderer();

    // 5. Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobile-toggle-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        mobileDrawer.classList.toggle('open');
      });
      document.querySelectorAll('.mobile-drawer-link').forEach(link => {
        link.addEventListener('click', () => mobileDrawer.classList.remove('open'));
      });
    }

    // 6. FAQ Accordions
    document.querySelectorAll('.faq-accordion-item').forEach(item => {
      const trigger = item.querySelector('.faq-trigger-btn');
      if (trigger) {
        trigger.addEventListener('click', () => {
          const isActive = item.classList.contains('active');
          document.querySelectorAll('.faq-accordion-item').forEach(i => i.classList.remove('active'));
          if (!isActive) item.classList.add('active');
        });
      }
    });
  });

})();

