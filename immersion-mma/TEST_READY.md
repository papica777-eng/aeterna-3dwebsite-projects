# TEST_READY.md — Immersion MMA E2E Automated Test Suite

**Status**: READY FOR MILESTONE VERIFICATION  
**Author**: `test_writer_e2e` (Test Suite Author & QA Specialist)  
**Parent**: Project Orchestrator (`ef69b275-4d53-417c-a06a-84e2ac6cc51d`)  
**Timestamp**: 2026-10-31T09:40:00Z  

---

## 1. Test Suite Overview

An automated, opaque-box, 4-tier End-to-End (E2E) test harness has been designed and implemented in `tests/`.
The test suite validates 100% of the 20 features defined in `PROJECT.md`, derived from primary authentic data extracted from `https://immersionmma.com.au/`.

### Test Files Created:
1. `tests/__init__.py`: Package initialization.
2. `tests/test_utils.py`: Shared testing utilities, HTML/CSS/JS loaders, Node.js AST parser for `IMMERSION_SCHEDULE`, and asset existence verification.
3. `tests/test_tier1_features.py`: **Tier 1 Feature Coverage** — 20 test classes, 103 test methods (>=5 tests per feature covering all 20 features in `PROJECT.md`).
4. `tests/test_tier2_boundaries.py`: **Tier 2 Boundary & Corner Cases** — 12 test methods covering Sunday closure, unstaffed Friday GW open mat, Friday RW intermediate MMA, split Saturday kids timings, missing alt/href attributes, phone regex purity, and form validation.
5. `tests/test_tier3_combinations.py`: **Tier 3 Cross-Feature Interactions** — 10 test methods verifying location toggling + discipline filters, drawer contacts matching footer landlines, coach attribution consistency, program matcher routing, and brand uniformity.
6. `tests/test_tier4_scenarios.py`: **Tier 4 Real-World User Journeys & Crawler** — 5 comprehensive scenario methods including a full-site link and asset crawler (auditing all `<a>`, `<img>`, `<script>`, `<link>` tags for zero 404s, broken anchors, or missing files).
7. `tests/run_all_tests.py`: Master test runner supporting `--all`, `--tier <1-4>`, `--milestone <1-4>`, and `-v` flags. Exits with 0 on pass or 1 on failure.
8. `TEST_INFRA.md`: Project infrastructure and architecture document.

---

## 2. How to Run the Tests

Run the test suite directly from the project root:

```bash
# Run all tests (Tiers 1-4)
python tests/run_all_tests.py

# Run by tier
python tests/run_all_tests.py --tier 1
python tests/run_all_tests.py --tier 2
python tests/run_all_tests.py --tier 3
python tests/run_all_tests.py --tier 4

# Run by implementation milestone
python tests/run_all_tests.py --milestone 1   # Milestone 1: Timetable & CSS Engine
python tests/run_all_tests.py --milestone 2   # Milestone 2: Coaches Roster & Team Subpage
python tests/run_all_tests.py --milestone 3   # Milestone 3: Programs, Policies & Phone Eradication
python tests/run_all_tests.py --milestone 4   # Milestone 4: Final Scenarios & Link Crawler

# Verbose output
python tests/run_all_tests.py -v
```

---

## 3. Baseline Test Run Results (Pre-Migration Codebase)

Executed command: `python tests/run_all_tests.py`

```
================================================================================
EXECUTION SUMMARY
================================================================================
Total Tests Run : 129
Passed          : 73 (56.6%)
Failed          : 56
Errors          : 0
Skipped         : 0
Elapsed Time    : 2.43s
================================================================================
```

### Result Analysis:
- **Zero Syntax / Runtime Errors**: All 129 tests execute cleanly without runtime crashes or missing dependencies.
- **73 Passing Tests**: Baseline structural integrity, existing core pages, basic styling, and asset dimensions pass.
- **56 Failing Tests**: Strictly correspond to the unmigrated synthetic placeholder data, missing coaches, synthetic timetables, and missing subpages identified in the survey phase.

---

## 4. Implementation Defects to Escalate (Target Milestones)

The 57 failing tests provide an authoritative, automated checklist for the implementation agents:

### Milestone 1: Data Architecture & Timetable Engine
* **IMMERSION_SCHEDULE in `immersion-engine.js`**: Contains synthetic 5-slot GW and 4-slot RW templates. Must be updated with authentic 6-day schedules (Mon/Wed 6am MT, Tue/Thu 6am BJJ, 12pm No-Gi/MT, 4:15pm Kids, 5pm Comp/Open Mat, 6pm, 7:30pm for GW; Mon 10:15am Pro, Wed 8pm ADCC, Fri 6pm MMA, split kids 9am vs 9:30am for RW).
* **CSS Display Alignment in `immersion-brutal.css`**: Missing `.hidden { display: none !important; }`. This causes timetable discipline filtering to fail. Dynamic card classes (`.day-column-card`, `.class-slot-item`, `.slot-discipline-badge`) require styling or engine class alignment.
* **Static Fallback in `locations-timetables.html`**: `#gw-static-schedule` fallback table contains fictional classes.

### Milestone 2: Coaches Roster & Team Subpage
* **Coach Lee Ting**: Has photo `assets/images/coaches/lee.jpg` on disk but is omitted from HTML cards and JS engine.
* **Coach Mee Jaemmanee & Coach Kahow Lee**: Collapsed into a single combined card ("Coach Mee & Kahow") and share a single photo. Must be separated into distinct profiles.
* **Coach Sotir Kichukov**: ONE Championship veteran (15-9 pro MMA record) completely missing from card grids and rosters.
* **Synthetic "Three Bens" Persona**: Fictional concierge folklore appears in `index.html`, `kids-bullyproof.html`, and `immersion-engine.js`. Must be replaced with authentic Kids Coach Benjamin Tran and Front of House Donny Harris.
* **`meet-the-team.html` Subpage**: Does not exist. Must be created with complete coaching roster and linked in navigation.

### Milestone 3: Programs, Policies, Contact & Phone Eradication
* **Placeholder Phone `0491 570 069`**: 32 occurrences in HTML and JS. Must be completely eradicated and replaced with `(03) 8555 9881` (GW) and `(03) 9879 6052` (RW).
* **Official Emails**: `glenwaverley@immersionmma.com.au` and `ringwood@immersionmma.com.au` missing from footers and contacts.
* **Curriculums**: BJJ 3-part class structure and rotating syllabus; Muay Thai Art of 8 Limbs and optional sparring; Kids 33 non-violent techniques and continuous school holiday guarantee.
* **Policies**: Consultation pricing model, zero lock-in contracts, flexible pause/suspension, simple cancellation, and uncapped referral rewards.
* **`contact-us.html` Subpage**: Does not exist. Must be created with detailed addresses, phone numbers, opening hours, transit directions (routes 623, 885, 850, 902 SMARTBUS, 742), and maps.
