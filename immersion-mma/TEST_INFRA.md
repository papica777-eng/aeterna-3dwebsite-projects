# TEST_INFRA.md — Immersion MMA Automated E2E Test Infrastructure

## 1. Architecture & Testing Philosophy

The Immersion MMA website verification suite is designed as an automated, opaque-box, multi-tier End-to-End (E2E) testing harness.
It tests the static HTML pages, CSS stylesheets, client-side JavaScript engine (`assets/js/immersion-engine.js`), media assets, timetable data, and lead capture workflows.

### Core Principles:
1. **Opaque-Box Evaluation**: Tests evaluate observable outputs, DOM structures, rendered text, asset integrity, and external links without assuming internal private implementation state.
2. **Deterministic & Pure**: Powered entirely by standard Python (`unittest`, `re`, `json`, `subprocess`) and `BeautifulSoup4`. Requires zero mock servers, third-party cloud APIs, or non-deterministic random data.
3. **Progressive Testability**: Organized into 4 distinct tiers and mapped directly to implementation milestones (M1 through M4). Tests are designed to verify features deterministically as they are integrated into the repository.
4. **Adversarial Rigor**: Includes negative boundary tests, broken link detection, missing attribute enforcement, phone regex purity, and strict cross-feature state preservation.

---

## 2. Directory Layout & Test Suite Organization

```
tests/
├── __init__.py                  # Test package initialization
├── test_utils.py                # Shared utilities: HTML/CSS/JS loaders, Node.js AST extractor, asset checker
├── test_tier1_features.py       # Tier 1: Feature Coverage (>=5 tests per feature across all 20 features)
├── test_tier2_boundaries.py     # Tier 2: Boundary, edge case, and corner condition verification
├── test_tier3_combinations.py   # Tier 3: Cross-feature interactions and state transitions
├── test_tier4_scenarios.py      # Tier 4: Real-world user journeys & full site asset/link crawler
└── run_all_tests.py             # Master test runner with tier, milestone, and verbosity flags
```

---

## 3. Systematic 4-Tier Test Coverage Matrix

### Tier 1: Feature Coverage (All 20 Features from `PROJECT.md`)

| Feature # | Feature Name | Test Class | Min Tests | Key Verifications |
|:---:|:---|:---|:---:|:---|
| **F01** | Authentic Phone Numbers | `TestTier1Feature01AuthenticPhones` | 5 | Eradicate `0491 570 069` from HTML & JS; verify GW `(03) 8555 9881` & RW `(03) 9879 6052`; official emails. |
| **F02** | Coach Dave Marinakis | `TestTier1Feature02CoachDaveMarinakis` | 5 | 3rd Degree Black Belt, 2x ADCC, World Pro Bronze, Pan Pac titles, Machado lineage, `dave.jpg` asset. |
| **F03** | Coach Lee Ting | `TestTier1Feature03CoachLeeTing` | 5 | 3rd Degree Black Belt, Co-Founder, Pan Pac Champ, Machado lineage, `lee.jpg` linked and not orphaned. |
| **F04** | Coach James Fitzgerald | `TestTier1Feature04CoachJamesFitzgerald` | 5 | Black Belt (2019), 15+ yr Taekwondo vet, awarded by Marinakis & Ting, `james.png` asset. |
| **F05** | Coach Sam Chew | `TestTier1Feature05CoachSamChew` | 5 | Black Belt, Asian Open 2nd, Australian National 1st, Worlds 3rd, Judo background, `sam.jpg` asset. |
| **F06** | Coach Nikki Lloyd-Griffiths | `TestTier1Feature06CoachNikkiLloydGriffiths` | 5 | Black Belt, ADCC Trials 1st, IBJJF Con 1st, Boa Super 8 1st, `nikki.png` asset. |
| **F07** | Coach Mee Jaemmanee | `TestTier1Feature07CoachMeeJaemmanee` | 5 | Head Muay Thai Coach, 102 pro bouts, Krabi gym heritage, traditional Thai clinch, dedicated individual card. |
| **F08** | Coach Kahow Lee | `TestTier1Feature08CoachKahowLee` | 5 | Muay Thai Coach, technical progression specialist, striking adaptation bio, `muaythai-kahow.jpg` asset. |
| **F09** | Coach Sotir Kichukov | `TestTier1Feature09CoachSotirKichukov` | 5 | Muay Thai & MMA Coach, ONE Championship vet, 15-9 pro MMA record, Bulgarian heritage, cage transitions. |
| **F10** | Authentic Youth Staff & FOH | `TestTier1Feature10YouthStaffAndEradicateThreeBens` | 5 | Eradicate synthetic "Three Bens"; attribute Benjamin Tran (Kids Coach) & Donny Harris (Front of House). |
| **F11** | Glen Waverley Schedule | `TestTier1Feature11GlenWaverleySchedule` | 6 | Full 6-day weekly schedule in `IMMERSION_SCHEDULE.gw`: 6am, 12pm, 4:15pm, 5pm, 6pm, 7:30pm; static fallback. |
| **F12** | Ringwood Schedule | `TestTier1Feature12RingwoodSchedule` | 6 | Full 6-day weekly schedule in `IMMERSION_SCHEDULE.rw`: Mon 10:15am Pro, Wed 8pm ADCC, Fri 6pm MMA, split kids. |
| **F13** | Schedule Rendering & CSS | `TestTier1Feature13ScheduleRenderingAndCSS` | 5 | `.hidden { display: none !important; }` in CSS, dynamic card styling alignment, filter button markup. |
| **F14** | BJJ Curriculum & Anatomy | `TestTier1Feature14BJJCurriculumAndAnatomy` | 5 | 3-part class structure (Warm-up, Tech, Rolling), rotating curriculum, safety culture, 2 Black Belts on mat. |
| **F15** | Muay Thai & MMA Curriculum | `TestTier1Feature15MuayThaiAndMMACurriculum` | 5 | Art of 8 Limbs, pad/bag work, optional technical sparring, invite-only MMA prerequisites. |
| **F16** | Kids Bullyproof Curriculum | `TestTier1Feature16KidsBullyproofCurriculum` | 5 | 33 non-violent techniques, split brackets (4-7 vs 8-14), continuous school holiday training, adult pathway. |
| **F17** | Consultation Pricing Policy | `TestTier1Feature17ConsultationPricingPolicy` | 5 | Fit-first consultation model, zero lock-in contracts, flexible pause/suspension, simple cancellation, referrals. |
| **F18** | Free Trial Onboarding Flow | `TestTier1Feature18FreeTrialOnboardingFlow` | 5 | 4-step sequence (Form -> Call -> Attire/Prep -> Class & Tour), loaner gear provided, barefoot on mats. |
| **F19** | Dedicated Subpages | `TestTier1Feature19DedicatedSubpages` | 5 | `meet-the-team.html` and `contact-us.html` present, rendered with authentic data, and linked in navigation. |
| **F20** | E2E Test Suite Infrastructure | `TestTier1Feature20E2ETestSuiteInfrastructure` | 5 | Test suite layout, master runner, `TEST_INFRA.md`, `TEST_READY.md`, standard library compliance. |

### Tier 2: Boundary & Corner Cases (`TestTier2BoundaryAndCornerCases`)
- Sunday closed behavior at both locations across schedules, text, and hours.
- Friday Glen Waverley boundary: exactly 1 session: 5:00pm–7:00pm Open Mat (unstaffed facility).
- Friday Ringwood boundary: exactly 1 session: 6:00pm Intermediate MMA (invite-only).
- Saturday Ringwood split kids timings: 9:00am (4-7 yrs, 30m) vs 9:30am (8-14 yrs, 45m).
- Ringwood specialty sessions: Monday 10:15am Pro Training, Wednesday 8:00pm Wrestling / ADCC.
- Strict age bracket boundary separation: 4–7 years vs 8–14 years (no vague "Kids 5-12" tags).
- Missing/empty attribute enforcement: `alt` on `<img>`, valid `href` on core navigation `<a>`.
- Form validation: `required` attributes enforced on name, email, and phone inputs.
- Phone number purity: zero partial fragments of dummy `0491` in HTML.
- Operating hours range validation: valid start and closing windows.

### Tier 3: Cross-Feature Combinations (`TestTier3Combinations`)
- Location switching + discipline filter state interaction in `immersion-engine.js`.
- Floating drawer contact information matching static footer landlines on every page.
- Discipline subpages coach attribution matching master coaching roster.
- Program matcher on `index.html` routing to authentic discipline landing pages.
- Lead capture location selection routing between Glen Waverley and Ringwood expectations.
- Navigation structure uniformity across all core and subpages.
- Discipline slug taxonomy alignment between schedule data and UI filters (`bjj`, `muaythai`, `mma`, `kids`).

### Tier 4: Real-World Scenarios (`TestTier4Scenarios`)
- Scenario 1: Newcomer beginner journey (reassurance, FAQs, free trial lead capture, 4-step onboarding).
- Scenario 2: Parent youth bullyproof discovery (33 techniques, age brackets, continuous holiday operations, youth coaches).
- Scenario 3: Striker & fighter pathway (Art of 8 Limbs, pro coach credentials, pad work, optional sparring, MMA cage control).
- Scenario 4: Facility & schedule scout (180sqm Zebra mats, S&C gym, operating hours, bus and train transit).
- Scenario 5: Full-Site Link & Asset Crawler (recursively crawls every `<a>`, `<img>`, `<script>`, and `<link>` tag; ensures zero 404s, zero broken anchors, and zero missing assets).

---

## 4. Execution & Invocation Commands

All tests can be executed directly from the project root using standard Python:

```bash
# 1. Run complete test suite (Tiers 1-4)
python tests/run_all_tests.py

# 2. Run specific tier
python tests/run_all_tests.py --tier 1
python tests/run_all_tests.py --tier 2
python tests/run_all_tests.py --tier 3
python tests/run_all_tests.py --tier 4

# 3. Run milestone-specific tests during implementation
python tests/run_all_tests.py --milestone 1   # Data Architecture & Timetable Engine
python tests/run_all_tests.py --milestone 2   # Coaches Roster & Team Subpage
python tests/run_all_tests.py --milestone 3   # Programs, Policies, Contact & Phone Eradication
python tests/run_all_tests.py --milestone 4   # E2E Final Verification & Scenarios

# 4. Verbose output
python tests/run_all_tests.py -v
```

---

## 5. Authoritative Expected Output Derivation

Expected outputs are derived strictly from the official ground truth documented in:
- `ORIGINAL_REQUEST.md` (Approved user request & requirements)
- `PROJECT.md` (Master architecture, 20-feature inventory, interface contracts)
- Live scrape of `https://immersionmma.com.au/` documented in `spec_miner_survey_1/handoff.md` and `spec_miner_survey_2/handoff.md`
- Codebase placeholder audit documented in `explorer_survey_3/handoff.md`

---

## 6. Defect Escalation Protocol

When tests fail:
1. Determine if failure is due to an implementation defect (missing data, synthetic placeholder, unstyled classes) or test bug.
2. If implementation defect: document failing test method name, observed vs expected values, and escalate to the implementing agent responsible for the corresponding milestone.
3. If test bug: fix test code only (adhering strictly to test_writer QA scope).
