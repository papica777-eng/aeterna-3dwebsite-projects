# Project: Immersion MMA Authentic Website Redesign & Integration

## Architecture
- **Tech Stack**: Vanilla HTML5, CSS3 (`assets/css/immersion-brutal.css`), JavaScript ES6 (`assets/js/immersion-engine.js`).
- **Core Engine**: `immersion-engine.js` powers the timetable dataset (`IMMERSION_SCHEDULE`), interactive filtering, location switching (Glen Waverley HQ vs Ringwood Academy), lead capture drawer, and concierge assistant.
- **Pages**:
  1. `index.html`: Hero, authentic disciplines overview, 8 coach cards, program matcher, facility highlights, lead capture.
  2. `bjj-grappling.html`: Gi & No-Gi programs, rotating beginner/intermediate syllabus, BJJ lineages (Dave Marinakis, Lee Ting, James Fitzgerald, Sam Chew, Nikki Lloyd-Griffiths).
  3. `muay-thai-mma.html`: Art of 8 Limbs Muay Thai, MMA cage control (invite only), coaches Mee Jaemmanee, Kahow Lee, Sotir Kichukov.
  4. `kids-bullyproof.html`: 33 non-violent self-defence techniques, age brackets (4–7 and 8–14 yrs), continuous year-round holiday schedule, coaches Benjamin Tran, Shah Gill, Kai-Ser Poh, Mateja Milosevic, Ben Hailey.
  5. `locations-timetables.html`: Complete weekly class schedules, interactive Day tabs, Discipline filters, location toggles, static fallback.
  6. `meet-the-team.html` (New): Dedicated comprehensive coaches & leadership roster with authentic bios, competition credentials, and photos.
  7. `contact-us.html` (New): Detailed academy location guides, transit routes, operating hours, and official landlines.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Authentic Phone Numbers | Eradicate all 32 occurrences of placeholder `0491 570 069`; replace with `(03) 8555 9881` (GW) and `(03) 9879 6052` (RW) across all HTML & JS | M3 | survey |
| 2 | Coach Dave Marinakis Profile | BJJ 3rd Degree Black Belt, 2x ADCC, World Pro Bronze, 2x Pan Pac Champ, Machado lineage | M2 | survey |
| 3 | Coach Lee Ting Profile | BJJ 3rd Degree Black Belt, Co-Founder, Pan Pac Champ, Machado lineage, link `lee.jpg` | M2 | survey |
| 4 | Coach James Fitzgerald Profile | BJJ Black Belt, 15+ yr Taekwondo vet, link `james.png` | M2 | survey |
| 5 | Coach Sam Chew Profile | BJJ Black Belt, Asian Open 2nd, Aus National 1st, Worlds 3rd, link `sam.jpg` | M2 | survey |
| 6 | Coach Nikki Lloyd-Griffiths Profile | BJJ Black Belt, ADCC Trials 1st, IBJJF Con 1st, Boa Super 8 1st, link `nikki.png` | M2 | survey |
| 7 | Coach Mee Jaemmanee Profile | Head Muay Thai Coach, 102 professional bouts, Krabi gym owner | M2 | survey |
| 8 | Coach Kahow Lee Profile | Muay Thai Coach, technical progression specialist, link `muaythai-kahow.jpg` | M2 | survey |
| 9 | Coach Sotir Kichukov Profile | Muay Thai & MMA Coach, ONE Championship vet, 15-9 pro record | M2 | survey |
| 10| Authentic Youth Staff & FOH | Replace fictional "Three Bens" with Benjamin Tran (Kids Coach) and Donny Harris (Front of House) | M2 | survey |
| 11| Glen Waverley Schedule Integration | Full Monday–Saturday schedule (9 daily time bands) in `IMMERSION_SCHEDULE` and static fallback | M1 | survey |
| 12| Ringwood Schedule Integration | Full Monday–Saturday schedule (12 daily time bands, Pro BJJ, ADCC, Comp, MMA) in `IMMERSION_SCHEDULE` | M1 | survey |
| 13| Schedule Rendering & CSS Alignment | Fix dynamic schedule generation classes and define `.hidden { display: none !important; }` in CSS | M1 | survey |
| 14| BJJ Curriculum & Class Anatomy | 3-part class structure, rotating beginner/intermediate curriculum, safety rolling | M3 | survey |
| 15| Muay Thai & MMA Curriculum | Art of 8 Limbs, pad/bag work, optional technical sparring, invite-only MMA prerequisites | M3 | survey |
| 16| Kids Bullyproof Curriculum | 33 non-violent techniques, 4-7 and 8-14 age groups, continuous school holiday training | M3 | survey |
| 17| Consultation Pricing Policy | Transparent pricing explained during free trial consultation, no lock-in contracts, flexible suspensions | M3 | survey |
| 18| Free Trial Onboarding Flow | 4-step sequence (Form -> Call -> Prep/Attire -> Class & Tour) across forms and dialogs | M3 | survey |
| 19| Dedicated Subpages | Build `meet-the-team.html` and `contact-us.html` maintaining brutalist styling & nav consistency | M2, M3 | survey |
| 20| E2E Test Suite & Adversarial Audit | Automated test harness (Tiers 1-4) + Tier 5 white-box adversarial verification + Forensic Integrity Audit | M4 | E2E track |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1| Data Architecture & Timetable Engine | Update `IMMERSION_SCHEDULE` in `immersion-engine.js`, fix timetable rendering & `.hidden` in `immersion-brutal.css`, update static schedule in `locations-timetables.html` | none | PLANNED |
| M2| Coaches Roster & Team Subpage | Integrate all 8 authentic coaches + staff across `index.html`, `bjj-grappling.html`, `muay-thai-mma.html`, replace synthetic personas, create `meet-the-team.html` | M1 | PLANNED |
| M3| Programs, Policies, Contact & Phone Eradication | Eradicate all 32 occurrences of `0491 570 069`, integrate authentic program curriculums, pricing policy, onboarding flows, and create `contact-us.html` | M2 | PLANNED |
| M4| Final Milestone: E2E Verification & Forensic Audit | Pass 100% of E2E test suite (Tiers 1-4), execute Tier 5 adversarial tests, and obtain CLEAN Forensic Audit | M3, TEST_READY | PLANNED |

## Code Layout
- `index.html`: Main landing page
- `bjj-grappling.html`: BJJ discipline page
- `muay-thai-mma.html`: Striking & MMA discipline page
- `kids-bullyproof.html`: Kids & youth discipline page
- `locations-timetables.html`: Timetables & locations page
- `meet-the-team.html`: Dedicated team and coaching staff page
- `contact-us.html`: Dedicated contact, maps, and transit page
- `assets/js/immersion-engine.js`: Client-side logic, timetable data, chat assistant
- `assets/css/immersion-brutal.css`: Master styling, layout, utility classes
- `assets/images/coaches/`: Coach headshots
- `tests/`: Automated test suite (E2E testing track)

## Interface Contracts
### `IMMERSION_SCHEDULE` Schema (`assets/js/immersion-engine.js`)
```javascript
const IMMERSION_SCHEDULE = {
  gw: {
    name: "Glen Waverley HQ (655c Waverley Rd)",
    days: [
      {
        day: "Monday", // Monday to Saturday
        dayIndex: 1, // 1=Mon, 2=Tue, ..., 6=Sat
        slots: [
          {
            time: "06:00",
            display: "6:00 AM",
            title: "Muaythai Kickboxing",
            disc: "muaythai", // "bjj" | "muaythai" | "mma" | "kids"
            badge: "Muay Thai",
            coach: "Coach Mee"
          }
        ]
      }
    ]
  },
  rw: {
    name: "Ringwood Academy (60 Charter St)",
    days: [ /* ... */ ]
  }
};
```

### Official Academy Phone Numbers & Emails
- Glen Waverley HQ: `(03) 8555 9881` | `glenwaverley@immersionmma.com.au`
- Ringwood Academy: `(03) 9879 6052` | `ringwood@immersionmma.com.au`
- General Careers/Join: `jointheteam@immersionmma.com.au` | `+61 413 271 111`

