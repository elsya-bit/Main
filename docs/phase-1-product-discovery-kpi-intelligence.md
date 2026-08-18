# Phase 1 — Product Discovery & KPI Intelligence Report
## Woolworths × Snapes Logistics VIC — Performance & Continuous Improvement Platform

**Prepared:** 18 August 2026
**Source of truth:** `Snapes_Logistics_VIC_Transport_KPI_June_2026.xlsx`
**Workbook origin:** `snapesau-my.sharepoint.com/personal/rod_snapes_com_au/Documents/aaa Clients/Woolworths/` — last modified 14 June 2026 via Excel Online
**Status:** Discovery only. No application code, schema, or component has been written.

---

### Evidence key — used throughout

| Tag | Meaning |
|---|---|
| **[FACT]** | Directly present in the workbook |
| **[CALC]** | Computed by us from workbook data; method stated |
| **[INTERP]** | Our reading of what the evidence means |
| **[REC]** | Our recommendation |
| **[ASSUME]** | Working assumption, not evidenced |
| **[CONFIRM]** | Must be confirmed by Snapes or Woolworths before build |

Nothing in this report invents a Woolworths requirement, a contractual service level, a root cause, or a system capability. Where evidence is absent, it says so.

---

# 1. Executive Summary

## 1.1 The one-sentence finding

The existing workbook is a **weekly compliance return, not a performance conversation** — and its headline KPI has been saturated at 100% for so long that it can no longer distinguish a good month from a bad one.

## 1.2 What the data actually shows

**[CALC]** Across the 310 unique weeks of current-format history (7 Jun 2020 – 31 May 2026):

- **287 of 310 weeks (92.6%) recorded DIFOT of exactly 100%.**
- **0 of 72 months** fell below a 98% DIFOT threshold. Only **4 individual weeks** did.
- **Four of the nine operational exception fields have recorded zero, every single week, for six years**: damages per consignment, delivery issues, packaging issues, unauthorised returns. A fifth — urgent 24-hour collection misses — has been non-zero exactly once, in July 2020.

**[FACT]** Meanwhile, the workbook's own cell comments — written by the Woolworths-side author — document, over the same period: a vehicle breakdown en route, a driver refusing a pickup, consignments delivered to the *wrong store* on at least four separate occasions, an 11-store rollout missed, a 6-store rollout missed, equipment left exposed to overnight theft, and pallets for scrapping not collected.

**[INTERP]** Those events happened. The KPI grid did not record them. They survive only as free-text comments attached to cells, invisible to any chart, filter, or trend. **The richest operational intelligence in this workbook is the part that was never a KPI.**

## 1.3 What should actually be built

Not a spreadsheet-to-dashboard conversion. The spreadsheet's numeric layer is largely a flat line; converting it to charts produces six years of flat lines.

**[REC]** Build a **shared exception and commitment ledger with a performance frame around it.** The centre of gravity is the thing the workbook proves both parties already do informally — describe an incident, explain it, agree what happens next — and which currently lives in Excel comment threads with no owner, no due date, and no closure.

The MVP is three things:

1. **A weekly submission form** that replaces the current one and, critically, *forces an exception record whenever a count is non-zero* — turning "1 late delivery" into "1 late delivery, here is which consignment, why, and what we're doing".

2. **An exception & corrective action register** — the comment threads, structured, owned, dated, and closable, visible to both parties.
3. **A Woolworths-facing performance view** built around volume, normalised exception rates, and open commitments — with DIFOT present but *deliberately demoted* from hero metric to one line among several, because at 99.90% lifetime it carries almost no information.

## 1.4 The uncomfortable recommendation

**[REC]** Snapes should propose to Woolworths that **DIFOT stops being the headline number.** Six years at 99.90% is either a genuinely outstanding operation, a definition too narrow to catch failure, or under-reporting. **[CALC]** The comment evidence shows it is at least partly the second: a consignment delivered to Ascot Vale instead of Union Road Metro was recorded in the *late deliveries* column, because the workbook has no "delivered to wrong location" field — even though it has an unused "unauthorised returns" field that has been zero for six years.

A metric that cannot go down is not a performance metric. It is reassurance. Woolworths does not need more reassurance; it needs to know that when something goes wrong, Snapes catches it, records it, owns it, and closes it. That is what the platform should prove.

## 1.5 What must not be built

No AI summarisation, no predictive analytics, no relationship score, no benchmarking, no notification engine, no complex approval workflow. **[INTERP]** Every one of these would sit on top of a dataset whose main characteristic is that its exception fields are empty. Fix the capture first.

---

# 2. Current-State Assessment

## 2.1 Workbook anatomy

**[FACT]** Four worksheets, one visible:

| Sheet | State | Extent | Role |
|---|---|---|---|
| `Snapes Logistics VIC Transport ` (note trailing space) | Visible | A1:U313 populated (312 data rows) | **Current reporting.** Weekly rows, 7 Jun 2020 – 31 May 2026 |
| `Transport KPI` | Hidden | A1:FD16 populated | **Legacy reporting.** KPIs as rows, 158 weekly columns, 2 Jul 2017 – 5 Jul 2020 |
| `Sheet1` | Hidden | Empty | None |
| `Sheet2` | Hidden | A1:P156 | **Flattened copy** of `Transport KPI`, 155 weeks, 2 Jul 2017 – 14 Jun 2020 |

**[FACT]** The workbook carries two saved AutoFilter views (`Filter 1`, `ym`) over `A1:U313`, an AutoFilter on the visible sheet, and nine hidden text-box shapes containing no text.

## 2.2 How the process appears to work

**[FACT] Inputs.** Column A of the visible sheet is `Timestamp`; column B is `Week Ending Sunday Date:`. Timestamps are typically 4–7 days before or after the week-ending date, and are absent on the first two rows. Column O carries a constant `3PL` value of `Snapes Logistics VIC` on every row.

**[INTERP]** This is a form-capture pattern — Microsoft Forms or a similar submission tool writing one row per weekly submission, with the `3PL` column existing so multiple carriers could theoretically report into the same sheet. Only one carrier ever has. **[CONFIRM]** Whether an actual form exists, or whether rows are typed directly.

**[FACT] Calculations.** Only two calculated columns exist, both partial and both outside the reported area:

- **Column P** — `=1-(D{n}/C{n})`, i.e. `1 − late ÷ consignments`. Present on rows 2–3, 58–134, **136–217**. Absent on row 135, and on **every row from 218 to 313** — the most recent 96 weeks, nearly two years, have **no DIFOT calculated at all**.
- **Column Q** — `=1-(E{n}/D{n})`, i.e. `1 − pallets ÷ late deliveries`. **This formula is meaningless.** **[CALC]** Of its 54 populated rows, 51 return either `#DIV/0!` or a large negative number (e.g. −495.3, −895). It appears to be a mis-dragged copy of column P.

**[INTERP]** The reporting layer of this workbook is broken and has been for some time. Whatever number is presented in the monthly KPI meeting is being derived elsewhere — by hand, by a filter, or verbally.

**[FACT] Outputs.** There is no summary sheet, no chart, no pivot, and no monthly rollup anywhere in the workbook. The visible sheet is a raw weekly log.

**[INTERP]** The monthly Woolworths meeting is prepared *from* this file, not *in* it. **[CONFIRM]** What artefact is actually presented in the first-Monday meeting.

**[FACT] Targets.** The current sheet stores **no target for any KPI.** The legacy sheet stores three mutually inconsistent DIFOT targets simultaneously — see §5.1.

## 2.3 The comment layer — the workbook's most valuable content

**[FACT]** 26 threaded comments, authored between July 2020 and March 2026, by two named people:

- **Mark Milham** — authors all incident narratives, in Woolworths' voice ("as advised by Snapes", "Confirmed to Snapes 17/10", "did not occur as per Snapes booking"). **[INTERP]** The Woolworths-side stakeholder.
- **Furqan Fareed** — authors the one substantive Snapes reply.

**[FACT]** Comments are anchored almost exclusively to **column D — late deliveries** (D4, D14, D19, D28, D79, D86, D87, D96, D111, D176, D201, D221, D229, D230, D232, D233, D234, D243, D247, D256, D260, D261, D265). Two are anchored to A1 and B296, and one to E51.

**[FACT]** Two comments are **assigned tasks** with recorded assignment history:

- E51 (Jun 2021): *"@jeffrey@snapes.com.au @operations@snapes.com.au Hi Jeff, can you please complete this field?"* — assigned to Jeffrey, then **reassigned to operations two months later**.
- B296 (Mar 2026): *"@furqan@snapes.com.au Hi Furqan, can you please update for February for our catch up today."* — marked done.

**[INTERP]** Woolworths is chasing Snapes for data completeness *inside the spreadsheet, on the morning of the meeting*. This is a direct, evidenced product requirement: **submission timeliness and completeness must be visible and enforced before the meeting, not chased during it.**

**[FACT]** One comment thread contains a genuine two-sided exchange (D265, June 2025):

> **Woolworths:** *"11/6: Epsom equipment return did not occur. equipment needed to be picked up yesterday as they had access to a forklift which is now no longer available and also the fencing has now been taken down meaning the equipment has been left exposed to possible theft overnight."*
>
> **Snapes (Furqan, 30/6):** *"All good but the job was booked as a routine pallet transfer into Bulk, and no truck was scheduled on the Epsom side last week. We also weren't informed that forklift access was limited to yesterday or that fencing would be removed overnight—had we known, we would've sent a dedicated vehicle."*

**[INTERP]** This single exchange is the strongest product signal in the entire file. It shows: an incident with real commercial consequence; a genuine difference of view about cause; a 19-day reply latency; information asymmetry as the actual root cause; and **no recorded resolution or corrective action.** The platform's exception model must support exactly this — two perspectives, a shared cause category, and a closure — without forcing a blame verdict.

## 2.4 Formatting that carries business meaning

**[FACT]** Column P is block-shaded: bright green across rows 109–134 (weeks ending 3 Jul 2022 – 25 Dec 2022) and orange across rows 161–214 (2 Jul 2023 – 7 Jul 2024). **[INTERP]** These are financial-year band markers, applied inconsistently and abandoned after mid-2024.

**[FACT]** Rows 309–313 (the five weeks ending 3–31 May 2026) are shaded yellow across columns A–G. **[INTERP]** A "recent / not yet reviewed" flag — a manual, undocumented workflow state. **[REC]** This is the evidence that a real submission status model is needed (§24).

---

# 3. Historical Data Assessment

## 3.1 Coverage

**[CALC]**

| Era | Sheets | Period | Weeks | Consignments | Pallet spaces |
|---|---|---|---|---|---|
| **Era 1 — legacy** | `Transport KPI`, `Sheet2` | 2 Jul 2017 – 5 Jul 2020 | 158 columns / 155 rows | 12,526 | 101,817 |
| **Era 2 — current** | visible sheet | 7 Jun 2020 – 31 May 2026 | 310 unique | 33,104 | 187,290 |
| **Combined** | | 2 Jul 2017 – 31 May 2026 | ~464 | ~45,600 | ~289,000 |

**[CALC]** The eras overlap on exactly two weeks — 7 Jun 2020 and 14 Jun 2020 — and the shared values for consignments, late deliveries and pallets are **identical**. This is a clean, verifiable join point.

## 3.2 Data quality register

| # | Finding | Evidence | Severity | Impact |
|---|---|---|---|---|
| DQ-1 | **Four exception fields are zero for all 310 weeks** — damages, delivery issues, packaging issues, unauthorised returns | **[CALC]** | **Critical** | Either the operation has never had one of these in six years, or they are not being captured. Comments prove incidents occurred. |
| DQ-2 | **Duplicate week** — W/E 30 May 2021 submitted **three times** (timestamps 28 May, 7 Jul, 4 Aug 2021) with byte-identical values | **[FACT]** | High | Naive import inflates that week 3×: 303 consignments instead of 101. |
| DQ-3 | **Four missing weeks** — 20 Dec 2020, 27 Dec 2020, 3 Jan 2021, 2 Jan 2022 | **[CALC]** | Medium | All Christmas/New Year. Likely genuine shutdown, but indistinguishable from a missed submission. |
| DQ-4 | **One week ending on a Monday** — 21 Dec 2020, against 311 Sundays | **[FACT]** | Low | Breaks strict weekly bucketing. |
| DQ-5 | **Column Q formula is nonsense** — `1−(pallets ÷ late)`; 51 of 54 rows are `#DIV/0!` or large negatives | **[FACT]** | High | Must not be migrated. |
| DQ-6 | **DIFOT column stops calculating at row 217** (week ending 7 Jul 2024) | **[FACT]** | High | The last ~96 weeks have no calculated DIFOT in the file. |
| DQ-7 | **Blank ≠ zero, inconsistently** — demurrage *count* blank for the last 6 weeks; outstanding invoices blank for 11 of the last 13 weeks | **[CALC]** | High | Two weeks (10 & 17 May 2026) have a demurrage **value** ($1,113.75 and $552.75) with a **blank count**. |
| DQ-8 | **Legacy fractional consignment count** — 0.1 consignments recorded W/E 5 Jan 2020, with 0 pallets | **[FACT]** | Medium | A placeholder to avoid `#DIV/0!` in the legacy DIFOT formula. Produces DIFOT = 1 from nothing. |
| DQ-9 | **Denominator collapse** — 8 weeks have fewer than 10 consignments; W/E 4 Jan 2026 has **zero** | **[CALC]** | High | A single miss in a 1-consignment week = 0% DIFOT. A 0-consignment week = divide-by-zero. |
| DQ-10 | **Sheet2 is a rounded duplicate of Transport KPI** — invoice values differ ($5,521.53 vs $5,522) | **[CALC]** | Medium | Two sources of truth for the same 155 weeks. |
| DQ-11 | **Demurrage count and value disagree** — 36 weeks have a value, 34 have a count | **[CALC]** | Medium | Cannot reliably derive average cost per incident. |
| DQ-12 | **Outstanding-invoice value repeats identically across consecutive weeks 8 times** | **[CALC]** | Low | Carried forward rather than re-measured, or genuinely static. Unclear which. |

## 3.3 Structural continuity — can the eras be compared?

**[FACT]** The KPI definitions changed materially between eras.

| Legacy field (2017–2020) | Current field (2020–2026) | Change |
|---|---|---|
| Total number of deliveries (consignment notes) | Same | Continuous |
| Number of late deliveries | Same | Continuous |
| **Number of damaged goods on arrival** | **Total number of damages per consignment** | **Definition changed** — "on arrival" vs "per consignment" |
| DIFOT `=(del − late − damaged)/del` | **No stored formula**; stray column P uses `1 − late/del` | **Formula changed — damages dropped** |
| Number of pallets (spaces) despatched | Volume — total number of pallet spaces despatched | Continuous |
| Number of issues (that relate to delivery) | Total number of delivery issues (accidents/breakdowns/dock issues) | Scope broadened |
| 24 Hr Collection Notice (misses) | Same | Continuous |
| **Incidents reported (safety related)** | **— removed —** | **Dropped** |
| Packing Issues | Total number of packaging issues | Renamed |
| Outstanding invoices unpaid ($) (>30 days) | Finance — outstanding invoice amount ($) (>30 days only) | Continuous |
| — | **Total number of futile deliveries** | **Added** |
| — | **Total number of demurrage incidents** | **Added** |
| — | **Total demurrage value (AUD)** | **Added** |
| — | **Total number of unauthorised returns** | **Added** |

**[INTERP]** Three consequences:

1. **DIFOT is not comparable across the join without restatement.** Legacy DIFOT deducts damages; current practice does not. Because damages are recorded as zero in every period of both eras, the two formulas happen to produce identical results — **but only by accident.** If damages are ever captured properly, the definitions diverge.

2. **Safety incident reporting was silently dropped in June 2020.** The legacy sheet recorded it (one non-zero week, 13 Oct 2019). The current sheet has no equivalent field. **[CONFIRM]** Was this a deliberate agreement, or attrition?
3. **Legacy notes were dropped.** The legacy sheet carries two standing operating constraints as row labels — *"No stock to be stored in your sheds at any time"* and *"Communication to come from EPM only for PNP despatches. Everything else to come from EL."* **[FACT]** Neither appears in the current sheet. **[INTERP]** These are contractual/operational rules, not KPIs, and they were lost in the format change. **[CONFIRM]** Whether both still apply.

---

# 4. KPI Inventory

Every measure present in either era. **Historical coverage** and **data quality** are **[CALC]**; **business value** and **recommended status** are **[REC]**.

| # | KPI (as named) | Definition (as determinable) | Calculation | Unit | Freq | Target | Source | Coverage | Quality | Business value | Recommended status | Client-facing | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K1 | DIFOT – total number of deliveries (consignment notes) | Count of consignment notes despatched in the week | Manual count | count | Weekly | none | **[ASSUME]** TMS/consignment register | 2017-07 → 2026-05, complete | **High** | The service denominator and the primary activity measure | **Keep** — promote to a headline volume metric | Yes | Named "DIFOT –" but it is a volume field |
| K2 | DIFOT – total number of late deliveries | Count of consignments not delivered on the due date/time | Manual count | count | Weekly | none | Woolworths notification + Snapes records | 2017-07 → 2026-05, complete | **Medium** | The only exception field with real signal | **Keep + Modify** — must carry an exception record | Yes | Comments show it absorbs *wrong-address* and *missed-pickup* events too |
| K3 | DIFOT (derived) | Legacy: `(del − late − damaged)/del`. Current: `1 − late/del`, partial | Formula | % | Weekly | conflicting | Derived | 2017-07 → 2024-07 then stops | **Low** (formula stops, definitions differ) | Contractual service headline | **Modify + Clarify** — restate, re-target, demote | Yes | 92.6% of weeks = exactly 100% |
| K4 | Volume – total pallet spaces despatched | Pallet spaces despatched in the week | Manual count | pallet spaces | Weekly | "Document Only" (legacy) | **[ASSUME]** TMS | 2017-07 → 2026-05, complete | **High** | Best available measure of work done | **Keep** — promote to co-headline | Yes | Diverges sharply from consignment count from 2025 |
| K5 | Urgent – 24 Hr Collection Notice (misses – not given by 3PL) | Collections where <24h notice was given | Manual count | count | Weekly | "Document Only" | Snapes ops | 2017-07 → 2026-05 | **Very low** — non-zero **once** in 464 weeks | Measures *Woolworths'* notice discipline | **Clarify then Keep or Remove** | Possibly | A Woolworths-accountable field, effectively dormant |
| K6 | Transport Ops – total number of damages per consignment | Damaged goods | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Very low** — **zero, all 310 weeks** | High if real | **Clarify — capture is failing** | Yes | Legacy equivalent also zero for all 155 weeks. Nine years, zero damages. |
| K7 | Transport Ops – total number of delivery issues (accidents/breakdowns/dock issues) | Operational disruptions | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Very low** — **zero, all 310 weeks** | High if real | **Clarify — capture is failing** | Yes | A vehicle breakdown is documented in a comment (Nov 2021) but recorded here as zero |
| K8 | Transport Ops – total number of packaging issues | Packaging failures | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Very low** — **zero, all 310 weeks** | Low–medium | **De-emphasise or Remove** | No | Also zero across all 155 legacy weeks |
| K9 | Transport Ops – total number of futile deliveries | Deliveries attempted but not completed | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Medium** — 142 events / 88 weeks, then stops | **High** — cost and root-cause rich | **Keep + Modify** — normalise, require reason | Yes | Zero for 12 consecutive months Apr 2025 – Mar 2026 |
| K10 | Transport Ops – total number of demurrage incidents | Detention events | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Medium** — blank last 6 weeks | High — direct cost, often client-side cause | **Keep + Modify** | Yes | Count and value disagree |
| K11 | Transport Ops – total demurrage value (AUD) | $ value of detention | Manual $ | AUD | Weekly | none | **[ASSUME]** Finance/invoicing | 2020-06 → 2026-05 | **Medium** | High — makes cost of delay visible | **Keep** | Yes | FY26 = $3,488 on 48 weeks, the highest FY on record |
| K12 | Transport Ops – total number of unauthorised returns | Stock returned without authority | Manual count | count | Weekly | none | Snapes ops | 2020-06 → 2026-05 | **Very low** — **zero, all 310 weeks** | Medium | **Clarify or Remove** | Possibly | Would have captured the "sent to store instead of 3PL" events |
| K13 | Finance – outstanding invoice amount ($) (>30 days only) | Snapes invoices unpaid beyond 30 days | Manual $ | AUD | Weekly | "Document Only" | **[ASSUME]** Snapes AR | 2017-07 → 2026-05; 11 blanks recently | **Medium–High** | **High** — and it measures *Woolworths*, not Snapes | **Keep + Reframe** | Yes | Collapsed from $170,779 weekly average (2022) to $291 (2025) |
| K14 | Incidents reported (safety related) — *legacy only* | Safety incidents | Manual count | count | Weekly | "Document Only" | Snapes WHS | 2017-07 → 2020-06 only | **Low** — one non-zero week | **High** for a transport relationship | **Reinstate** | Yes | Silently dropped June 2020 |
| K15 | 3PL / Carrier | Reporting entity | Constant | text | Weekly | n/a | n/a | All rows | High | Structural | **Keep** as a dimension | No | Always `Snapes Logistics VIC` |
| K16 | Timestamp | Submission datetime | Form capture | datetime | Weekly | n/a | Form | 310 of 312 rows | Medium | **High** — proves timeliness | **Keep + Promote** | Yes | Currently invisible; should drive an on-time-submission indicator |

---

# 5. KPI Challenge

## 5.1 DIFOT — the target problem

**[FACT]** The legacy sheet holds **three different DIFOT targets at once**:

- Cell `B7`, on the DIFOT row: **0.95**
- Cell `B8`, labelled "DIFOT Target": **0.98**
- Every one of the 158 weekly cells in row 8: **0.99**

**[FACT]** The current sheet holds **no target at all.**

**[INTERP]** Nobody can currently state, from this file, what DIFOT target Snapes is held to. Any dashboard that displays "Target: 98%" would be inventing it. **[CONFIRM] — this is the single most important open question in the entire discovery.**

## 5.2 The saturation problem

**[CALC]** Current-era DIFOT distribution across 310 weeks:

| Band | Weeks | Share |
|---|---:|---:|
| Exactly 100% | 287 | 92.6% |
| 99.00% – 99.99% | 7 | 2.3% |
| 98.00% – 98.99% | 12 | 3.9% |
| Below 98% | 4 | 1.3% |
| Below 95% | 1 | 0.3% |

**[CALC]** Lifetime weighted DIFOT: **99.90%** (33 late from 33,104 consignments). Legacy era: **99.81%**. Longest zero-late streak: **89 consecutive weeks** (24 Jul 2022 – 31 Mar 2024). Weeks since the last late delivery as at 31 May 2026: **48**.

**[INTERP]** A KPI that reads 100% in 93% of periods has almost no decision value. Charting it monthly produces a flat line at the top of the axis for six years. Woolworths learns nothing from it, and Snapes gets no credit for improvement because there is no headroom.

**[REC]** Keep DIFOT — it is contractual and Woolworths will expect it — but **display it as a status line, not a hero chart**, and pair it with the metrics that actually move.

## 5.3 The denominator problem

**[CALC]** 8 weeks have fewer than 10 consignments; **W/E 4 Jan 2026 has zero**. In a 1-consignment week (five such weeks exist), a single miss produces DIFOT = 0%. In a 0-consignment week, the formula divides by zero — which is exactly why the legacy sheet contains a **fabricated 0.1 consignments** on 5 Jan 2020.

**[REC]** DIFOT must never be displayed for a period below a minimum-volume floor. Show "Insufficient volume (n=1)" instead of a number. **[REC]** Report DIFOT monthly and rolling-13-week as the primary views; weekly DIFOT is statistically fragile and should be drill-down only.

## 5.4 The absent-exception problem

**[CALC]** Zero for all 310 weeks: damages (K6), delivery issues (K7), packaging issues (K8), unauthorised returns (K12). Non-zero once in 464 weeks: 24hr collection misses (K5).

**[FACT]** Over the same period, the comment layer records — among others:

- *"Vehicle breakdown on route to the delivery this morning. Additional truck was dispatched to cross load and recover."* (Nov 2021) → K7 recorded **0**
- *"Lansell Plaza – driver refused to pick up 28/8."* (Aug 2020) → K7 recorded **0**
- *"Union Road Metro: DSCs 3505593, 3505594, 3717686 Delivered to Ascot Vale store instead of Union Road Metro"* (Apr 2024) → K12 recorded **0**
- *"IWP 4078809 sent to store instead of 3PL."* ×3 (Jan 2025) → K12 recorded **0**
- *"Bread Prop R/Out – 11 stores not delivered by 16/10/23"* (Oct 2023) → recorded as late deliveries
- *"Long Life Rollout – missed 6 stores which had to be delivered before 18/7/22"* (Jul 2022) → the 6 late deliveries in the worst week on record

**[INTERP]** The exception taxonomy does not match the failures the operation actually has. Woolworths' real complaints are: **wrong location, missed collection, missed date on a rollout programme, and equipment not recovered.** Only one of those maps to an existing field.

**[REC]** Replace four dormant fields with a **single exception record carrying a category picklist** built from the categories the comments prove are real (see §18.2). Counting fields become derived counts, not manual entry.

## 5.5 KPI-by-KPI verdict

| KPI | Meaningful? | Actionable? | Contextualised? | Redundant? | Misleading? | Level | Woolworths cares? | Verdict |
|---|---|---|---|---|---|---|---|---|
| K3 DIFOT | Weakly — saturated | Only when it moves | No — no target stored | No | **Yes** — fragile at low volume | Executive, as a status line | **Yes**, contractually | **Modify, demote, re-target** |
| K2 Late deliveries | Yes | Yes, with a reason | Absolute only | No | Yes at low volume | Executive + drill | Yes | **Keep, normalise, force exception record** |
| K1 Consignments | Yes | Yes | Yes | No | Alone, yes (see §9) | Executive | Yes | **Keep, promote** |
| K4 Pallet spaces | Yes | Yes | Yes | No | Alone, yes | Executive | Yes | **Keep, promote** |
| K9 Futile | Yes — cost + cause | Highly | No — absolute only | No | Yes | Performance page | **Yes** — often client-side cause | **Keep, normalise per 100 consignments** |
| K10/K11 Demurrage | Yes | Yes | Value gives context | Partly (count vs value) | Count alone, yes | Performance page | Yes — it costs someone money | **Keep, lead with value** |
| K13 Outstanding >30d | Yes | Yes | Yes | No | No | Executive, own section | Yes — it is *their* obligation | **Keep, reframe as shared** |
| K6 Damages | Cannot tell — never captured | No | No | No | **Yes** — zero implies perfection | Drill-down | Yes | **Clarify capture, then keep normalised** |
| K7 Delivery issues | Cannot tell | No | No | Overlaps late | Yes | Drill-down | Yes | **Fold into exception categories** |
| K8 Packaging issues | No evidence of use | No | No | Yes | Yes | — | Unknown | **De-emphasise; capture via exception only** |
| K12 Unauthorised returns | Cannot tell | No | No | No | Yes | Drill-down | Probably | **Clarify — likely mislabelled** |
| K5 24hr collection misses | Yes in principle | Yes | No | No | Yes | Drill-down | It measures *them* | **Clarify definition, then keep** |
| K14 Safety incidents | **Yes, highly** | Yes | No | No | No | Executive | **Yes** | **Reinstate** |
| K16 Timestamp | Yes | Yes | Yes | No | No | Trust indicator | Yes — B296 proves it | **Promote to on-time-submission** |

---

# 6. Proposed KPI Framework

**[REC]** Five layers. Nothing is a KPI unless it changes a decision or a conversation.

### Layer 1 — Activity (what work was done)
- **A1 Consignments delivered** — absolute + rolling 13-week + YoY
- **A2 Pallet spaces despatched** — absolute + rolling 13-week + YoY
- **A3 Average pallet spaces per consignment** *(new, derived)* — the profile/mix indicator

### Layer 2 — Service reliability (was it done right)
- **S1 DIFOT %** — restated, with a minimum-volume floor and a stated target
- **S2 Late consignments** — absolute, with a mandatory exception record
- **S3 Service exception rate per 100 consignments** *(new, derived)* — all client-visible exceptions, normalised
- **S4 Futile delivery rate per 100 consignments** *(new, derived)*

### Layer 3 — Operational cost & friction (what it cost, and to whom)
- **C1 Demurrage value (AUD)** with **C2 demurrage incidents**
- **C3 Average demurrage cost per incident** *(new, derived)*
- **C4 24-hour collection notice misses** — Woolworths-accountable
- **C5 Outstanding invoices >30 days (AUD)** — Woolworths-accountable

### Layer 4 — Safety & compliance
- **H1 Safety incidents** *(reinstated from legacy)*
- **H2 Damages** — normalised per 1,000 pallet spaces once capture is fixed

### Layer 5 — Accountability & improvement *(entirely new — no workbook equivalent)*
- **G1 Open corrective actions** / **G2 Overdue corrective actions**
- **G3 Actions closed since last review**
- **G4 Repeat-issue count** — exceptions in the same category within 90 days
- **G5 On-time weekly submission %** — derived from the existing Timestamp field
- **G6 Data completeness %** — populated required fields ÷ expected

**[REC]** Layer 5 is where the platform's value actually lives. Layers 1–4 already exist in Excel. Layer 5 does not exist anywhere.

---

# 7. KPI Calculation Dictionary

Every proposed calculation, in full. Where we recommend a denominator, the reasoning is stated.

### S1 — DIFOT %

- **Purpose:** Contractual service-level compliance for delivery-in-full-on-time.
- **Formula:** `(consignments − late consignments − consignments short/damaged on arrival) ÷ consignments`
- **Numerator:** Consignments delivered complete and on time
- **Denominator:** **Consignments (consignment notes)** — *not* pallets, *not* items. **Rationale:** the on-time commitment is made per consignment note; a delivery is on time or it is not, regardless of how many pallets it carries. **[FACT]** This also matches both eras of history, preserving comparability.
- **Unit:** % to 2 dp · **Aggregation:** Volume-weighted — `1 − Σlate ÷ Σconsignments` across the period. **Never average weekly percentages.**
- **Frequency:** Monthly primary; rolling 13-week secondary; weekly drill-down only
- **Target methodology:** **[CONFIRM]** Must be agreed with Woolworths. **[REC]** Until agreed, display **"Target: not yet agreed"** rather than a guessed figure. **[REC]** Once agreed, propose 99.5% based on **[CALC]** nine-year weighted actual of 99.87% — a 98% target is not a stretch for this operation and would signal nothing.
- **Interpretation:** Below target = investigate; at 100% = confirm the exception capture is working, not just that nothing was reported.
- **Limitations:** Saturated (§5.2). Depends entirely on Woolworths raising a miss — **[INTERP]** several comments say "*as advised by Snapes*", suggesting Snapes self-reports some misses, but others are Woolworths-detected.
- **Edge cases:** Zero consignments → suppress, do not show 0% or 100%. Fewer than the volume floor → show count, not percentage.
- **Required source data:** consignment count, late count, damaged/short count, all per week.

### S3 — Service Exception Rate per 100 consignments *(new)*

- **Purpose:** One normalised number that stays honest as volume changes — the fix for "2 damages" meaning different things at 100 vs 5,000 deliveries.
- **Formula:** `(Σ client-visible exceptions ÷ Σ consignments) × 100`
- **Numerator:** Count of exception records flagged client-visible: late, wrong location, missed collection, futile, damage, packaging, unauthorised return. **Excludes** demurrage and outstanding invoices — see limitations.
- **Denominator:** **Consignments.** **Rationale:** each of these exception types attaches to a *consignment event*, so the consignment is the true exposure unit. Pallets would understate the rate as consignment size grows — **[CALC]** which is exactly what is happening (§9.1).
- **Unit:** exceptions per 100 consignments, 2 dp · **Aggregation:** ratio of sums · **Frequency:** monthly + rolling 13-week
- **Target methodology:** **[REC]** No target initially. Baseline for two quarters, then agree one. Setting a target on a metric whose inputs have been zero for six years would be meaningless.
- **Interpretation:** Direction matters more than level in year one.
- **Limitations:** **[INTERP]** Will *rise sharply* when capture improves. This is a genuine adoption risk and must be pre-framed with Woolworths (§30). **Do not** launch this metric without that conversation.
- **Edge cases:** Zero-consignment weeks excluded from both numerator and denominator.

### S4 — Futile Delivery Rate per 100 consignments *(new)*

- **Purpose:** Futile deliveries are pure waste and usually have an assignable cause on one side or the other.
- **Formula:** `(futile deliveries ÷ consignments) × 100`
- **Denominator:** **Consignments.** **Rationale:** a futile delivery is one failed *attempt at a consignment*.
- **[CALC] Historic baseline:** 142 futile deliveries over 33,104 consignments = **0.43 per 100**. Peak month Aug 2021 at **2.30 per 100**; zero recorded Apr 2025 – Mar 2026.
- **Limitations:** **[INTERP]** The 12-month zero run is suspicious given six prior years of steady low-level occurrence. **[CONFIRM]** Genuinely eliminated, or no longer recorded?

### A3 — Average Pallet Spaces per Consignment *(new)*

- **Purpose:** The single most revealing derived measure in this dataset. Explains why "volume" is up or down depending on which number you look at.
- **Formula:** `Σ pallet spaces ÷ Σ consignments`
- **Unit:** pallet spaces/consignment, 1 dp · **Aggregation:** ratio of sums · **Frequency:** monthly + rolling 52-week
- **[CALC] Evidence:** 4.42 (52 weeks to Jun 2024) → 6.53 (to Jun 2025) → **8.81** (52 weeks to 31 May 2026). Peak month Nov 2025 at **18.4**.
- **Interpretation:** Rising = fewer, larger consignments — a structural mix shift toward bulk/project work. **[INTERP]** Consistent with the comment evidence of programme rollouts (bread props, long-life, bakery prep). **[CONFIRM]** with Snapes operations.
- **Limitations:** A ratio of two manually counted fields; inherits both fields' quality. **Not** a performance metric — do not put it next to DIFOT.

### C3 — Average Demurrage Cost per Incident *(new)*

- **Formula:** `Σ demurrage value ÷ Σ demurrage incidents`
- **[CALC] Historic:** $7,760.02 across 52 incidents = **$149.23 average**.
- **Limitations:** **[CALC]** 36 weeks carry a value but only 34 carry a count, and two recent weeks have a value with a blank count. **[REC]** Do not publish this metric until the count/value pairing is enforced at entry.

### H2 — Damage Rate

- **Question posed in the brief:** deliveries, pallets, items, or consignments as denominator?
- **[REC] Denominator: pallet spaces**, expressed **per 1,000 pallet spaces.** **Rationale:** damage is a function of *how much freight was handled*, not how many paperwork events occurred. **[CALC]** Consignment size in this account varies from 1 to 21 pallets per consignment; a per-consignment damage rate would make a 21-pallet consignment look identical in exposure to a 1-pallet one. Items would be the theoretically ideal denominator, but **[FACT]** the workbook does not capture item counts and there is no evidence Snapes can obtain them — so items are rejected as unavailable, not as wrong.
- **Do not publish until capture is fixed.** **[CALC]** Nine years of zero damages across 289,000 pallet spaces is not a credible baseline.

### G5 — On-Time Weekly Submission %

- **Purpose:** Trust and process discipline. Directly evidenced as a Woolworths concern (comment B296).
- **Formula:** `weeks submitted by the agreed cut-off ÷ weeks due × 100`
- **Source:** The existing **Timestamp** column — **[FACT]** already captured, never used.
- **[CONFIRM]** What the agreed cut-off is. **[ASSUME]** Wednesday following week-end, pending confirmation.

### G4 — Repeat Issue Count

- **Formula:** Count of exceptions whose `(category, site)` pair also occurred in the preceding 90 days.
- **Purpose:** Answers "has the issue repeated?" — **[REC]** the single best evidence that a corrective action worked.
- **Limitation:** Requires a site/store field that **[FACT]** does not exist today. Comments reference stores by name constantly (Mornington East, Albert Park, Castlemaine, Epsom, Croydon, Spring Farm, Moruya, Hampton, Seaford). **[REC]** Add a site field to the exception record.

---

# 8. Historical Insights

Facts, then interpretation, then hypotheses — kept strictly separate.

## 8.1 Observed fact

**[CALC]**

| Financial year (Jul–Jun, by week-ending) | Weeks | Consignments | Late | DIFOT | Pallet spaces | Pallets/consignment | Futile | Demurrage $ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| FY2018 (legacy) | 52 | 2,965 | 6 | 99.80% | 30,590 | 10.3 | – | – |
| FY2019 (legacy) | 53 | 3,492 | 15 | 99.57% | 28,426 | 8.1 | – | – |
| FY2020 (both) | 54 | 6,352 | 4 | 99.94% | 44,718 | 7.0 | – | – |
| FY2021 | 50 | 6,209 | 3 | 99.95% | 32,411 | 5.2 | 48 | $800.75 |
| FY2022 | 51 | 7,758 | 7 | 99.91% | 36,678 | 4.7 | 37 | $1,062.75 |
| FY2023 | 52 | 5,653 | 6 | 99.89% | 31,311 | 5.5 | 37 | $774.39 |
| FY2024 | 53 | 4,358 | 1 | 99.98% | 19,111 | 4.4 | 7 | $234.48 |
| FY2025 | 52 | 5,608 | 15 | 99.73% | 37,560 | 6.7 | 12 | $1,399.55 |
| FY2026 (48 wks, part) | 48 | 3,235 | **0** | **100.00%** | 28,302 | **8.7** | 1 | **$3,488.10** |

**[CALC]** Rolling 52-week comparison to 31 May 2026 vs the preceding 52 weeks:

| Measure | Prior 52 wks | Latest 52 wks | Change |
|---|---:|---:|---:|
| Consignments | 5,628 | 3,482 | **−38.1%** |
| Pallet spaces | 36,127 | 30,682 | **−15.1%** |
| Pallets per consignment | 6.42 | 8.81 | **+37.2%** |
| Late consignments | 14 | **1** | −92.9% |
| Futile deliveries | 12 | 1 | −91.7% |
| Demurrage value | $1,399.55 | $3,488.10 | **+149.2%** |

## 8.2 Interpretation

**[INTERP] I1 — The account is restructuring, not simply shrinking.** Consignments fell 38% year-on-year while pallet spaces fell only 15%, and pallets per consignment rose 37%. Snapes is moving nearly as much freight in far fewer, much larger movements. Whether this is good or bad news depends on how Snapes is paid — **[CONFIRM]**.

**[INTERP] I2 — Service performance is at an all-time high on the current definition.** Zero late consignments across all 48 recorded weeks of FY2026 to date. **[INTERP]** Given §5.4, this needs to be presented carefully: it may reflect genuine excellence, a smaller and simpler task, or thinner exception capture. Probably all three.

**[INTERP] I3 — Demurrage is the one deteriorating metric.** FY2026 demurrage value is **2.5× the previous worst full year**, on lower volume. **[CALC]** Two single weeks in April 2026 account for $1,821.60. This is the only genuine negative signal in the current data, and it is invisible in the workbook because nothing aggregates it.

**[INTERP] I4 — Accounts receivable transformed in 2023.** **[CALC]** Weekly average outstanding >30 days: 2020 $61,598 · 2021 $90,548 · 2022 **$170,779** (peak $462,154.63, W/E 12 Jun 2022) · 2023 $3,402 · 2024 $3,501 · 2025 **$291** · 2026 $497. **[INTERP]** Something structural changed in the payment relationship at the start of 2023. **[CONFIRM]** whether this reflects a genuine payment-process improvement or a change in how the field is measured — the two are indistinguishable in the data, and it matters, because as a "what went well" story it is the strongest in the file.

**[INTERP] I5 — There is no evidence that service degrades under volume pressure.** **[CALC]** Pearson r between weekly consignments and weekly late count = **0.09** (n=310) — no meaningful relationship. Splitting the 310 weeks into volume quartiles:

| Volume quartile | Weeks | Consignments | Late | Late rate |
|---|---:|---:|---:|---:|
| Q1 (lowest) | 77 | 3,241 | 3 | 0.093% |
| Q2 | 77 | 5,744 | 10 | 0.174% |
| Q3 | 77 | 7,758 | 9 | 0.116% |
| **Q4 (highest)** | 79 | 16,361 | 11 | **0.067%** |

The busiest quartile has the *lowest* late rate. **[INTERP]** Snapes handles peak volume at least as well as quiet weeks. This is a defensible, evidence-backed claim Snapes can make to Woolworths — and it directly answers the brief's question "does service performance deteriorate during peak-volume periods?" with **no, on this data**.

**[INTERP] I6 — Seasonality is real and consistent.** **[CALC]** Average pallet spaces per week by calendar month across six years: Nov **1,101** · Oct **885** · Feb 719 · Mar 659 · May 646 · Aug 532 · Sep 531 · Apr 505 · Jun 493 · Jul 454 · Dec 429 · **Jan 268**. October–November is the peak; January is roughly a quarter of peak. **[REC]** Any month-on-month comparison must be seasonally framed or it will mislead — a January drop is not a performance problem.

**[INTERP] I7 — The worst week on record is fully explained by the comment layer.** **[CALC]** W/E 17 Jul 2022: 73 consignments, 6 late, DIFOT 91.78% — the only week below 95% in six years. **[FACT]** Comment on D111: *"Long Life Rollout - missed 6 stores which had to be delivered before 18/7/22"* with all six DSC numbers listed. **[INTERP]** This proves the model works: a single programme event, not a systemic failure. It also proves that **the existing data alone does not explain failures — the comment does.** Any platform that migrates the numbers and drops the comments destroys the only explanatory layer in the file.

## 8.3 Hypotheses requiring investigation

**[ASSUME] H-A** — The rise in pallets per consignment reflects a shift toward project/rollout work (bakery prep, bread props, long-life, store refits) and away from routine store-to-store movements. Supported circumstantially by comment content; **not proven**.

**[ASSUME] H-B** — The 2026 demurrage spike relates to the same shift: larger loads at sites with constrained access or unloading resource. The Epsom comment thread describes exactly this failure mode. **Not proven** — demurrage records carry no site or cause.

**[ASSUME] H-C** — The 12-month futile-delivery zero run (Apr 2025 – Mar 2026) is a reporting lapse rather than a genuine elimination, given the field ran at a steady low level for the preceding five years and one reappeared in Apr 2026.

**[ASSUME] H-D** — Consignment volume decline reflects Woolworths reallocating work, changing store programmes, or a network change, not Snapes losing share. **No evidence either way in the workbook.** This is the highest-stakes unknown in the account and should be asked directly, not inferred.

---

# 9. Growth & Volume Intelligence

## 9.1 Which measure best evidences growth?

**[CALC]** The two available volume measures tell **opposite stories** over the last two years:

- Consignments: FY2022 7,758 → FY2026 (annualised) ~3,500 — **down ~55%**
- Pallet spaces: FY2022 36,678 → FY2026 (annualised) ~30,660 — **down ~16%**

**[REC] Pallet spaces despatched is the primary growth measure.** It is closest to actual freight moved and least distorted by how work is packaged into consignment notes. **[REC] Consignments is the secondary measure**, reported alongside, because it is the DIFOT denominator and the service-exposure unit.

**[REC]** Never show one without the other, and always show **A3 pallets per consignment** beside them. **[INTERP]** Showing consignments alone would tell Woolworths the relationship halved. Showing pallets alone would soften a real decline. Showing both plus the ratio tells the truth: *the work is consolidating into larger movements.*

## 9.2 Growth and performance must be visually separate

**[REC]** Volume & Growth occupies its own page and its own band of the executive view. It must never share an axis, a card row, or a colour scale with service metrics. **[INTERP]** A rising volume chart placed next to a green DIFOT badge implies a causal claim the data does not support.

## 9.3 The three questions the brief asks, answered from the data

| Question | Answer | Evidence |
|---|---|---|
| Are volumes increasing while service performance remains stable? | **No — volumes are decreasing while service performance is at its best recorded level.** | **[CALC]** §8.1 |
| Are volumes increasing while exception rates decline? | **No.** Both volume and exceptions are declining together. | **[CALC]** §8.1 |
| Does service performance deteriorate during peak-volume periods? | **No evidence of this.** The highest-volume quartile has the lowest late rate. | **[CALC]** §8.2 I5 |

**[INTERP]** Snapes should go into the next KPI meeting knowing that the growth story is *not* a growth story. It is a **consolidation** story. Presenting it as growth would be the fastest way to lose credibility; presenting it accurately, with the pallets-per-consignment ratio, positions Snapes as the party that understands its own account better than the client does.

---

# 10. Normalised vs Absolute Performance

**[REC]** Normalise where the denominator is logically valid and volume genuinely varies. Do not normalise for the sake of sophistication.

| Metric | Show absolute | Show normalised | Denominator | Verdict |
|---|---|---|---|---|
| Late consignments | **Yes** — small integers, and each one is a real event with a name | Yes, secondary | per 100 consignments | **Both.** Absolute leads; DIFOT already carries the rate. |
| Damages | Yes | **Yes, lead with rate** | per 1,000 pallet spaces | **Both**, once capture is fixed |
| Futile deliveries | Yes | **Yes** | per 100 consignments | **Both** |
| All client-visible exceptions | Yes | **Yes — this is S3** | per 100 consignments | **Both** |
| Demurrage | **Value in AUD** | Cost per incident | incidents | **Absolute value leads.** A dollar figure needs no normalising. |
| 24hr collection misses | **Yes** | No | — | **Absolute only.** Denominator would be *collection requests*, which **[FACT]** is not captured. Do not invent it. |
| Outstanding invoices >30d | **Yes, AUD** | No | — | **Absolute only.** Normalising a debtor balance by delivery count is meaningless. |
| Safety incidents | **Yes** | No | — | **Absolute only.** A rate per delivery trivialises safety. |
| Pallet spaces / consignments | **Yes** | Ratio to each other only | — | **Absolute + A3 ratio** |

**[REC]** Where both are shown, the pattern is one line: **`3 futile deliveries · 0.43 per 100 consignments · 0.31 prior period`** — absolute first because it is concrete, rate second because it is comparable.

---

# 11. Product Vision

**[REC]**

> A single, shared, always-current record of how the Woolworths × Snapes operation is performing — where every number can be traced to its source, every exception has an owner and an end date, and the monthly meeting starts from agreed facts instead of assembling them.

Three shifts:

1. **From a return to a record.** Today Snapes submits data *to* Woolworths. Tomorrow both parties look at the same record, and Woolworths-accountable items (collection notice, invoice ageing) sit in it as equals.

2. **From counting to closing.** The workbook counts things. It has no concept of an issue being *resolved*. The platform's defining feature is that an exception has a lifecycle.
3. **From monthly retrospective to weekly visibility.** Data is already captured weekly. **[FACT]** It is simply never seen weekly. Publishing the same data on a weekly cadence is close to zero additional effort and is the single highest-leverage change available.

**What it is not:** a TMS, a track-and-trace portal, an invoicing system, a BI tool, or a replacement for the relationship.

---

# 12. User Journeys

### J1 — Snapes Operations: weekly submission
- **Goal:** Record the week in under five minutes, once, correctly.
- **Steps:** Open current week (pre-created, pre-dated) → enter 8 counts → any non-zero exception count forces at least one exception record (date, category, reference, site, description) → validation runs → save as Draft → submit for review.
- **Information required:** consignment count, pallet spaces, late, futile, demurrage count + value, collection-notice misses, damages, safety incidents; per-exception detail.
- **Decision enabled:** none — this is capture. The design goal is **zero decisions** at this step.

### J2 — Snapes Management: review and publish
- **Goal:** Confirm the week is accurate and decide what Woolworths sees before it is visible.
- **Steps:** Review submitted week → see auto-flagged anomalies (volume outside expected range, exception with no owner, zero-value week) → set client-visible vs internal on each exception → assign owners and due dates → publish.
- **Decision enabled:** Is this ready to be seen by the client? What needs an action before the client asks?
- **[REC]** This step is the product's insurance policy against the "accidentally exposed internal information" risk (§30).

### J3 — Woolworths Operational User (the Mark Milham journey)
- **Goal:** Know what happened, and whether the things I raised are being dealt with.
- **Steps:** Land on Overview → read "What Requires Attention" → open an exception → read description, cause, owner, due date, status → add a comment if the record is incomplete or contested.
- **Information required:** the incident, its consignment reference, its store, what is being done, by whom, by when.
- **Decision enabled:** Do I need to escalate this, or is it handled?
- **[REC]** This user must be able to **comment on an exception**. **[FACT]** The workbook proves they already do, in cell comments — removing that capability would be a downgrade from Excel.

### J4 — Woolworths Management / Executive
- **Goal:** In under a minute, know whether this relationship needs my attention.
- **Steps:** Overview → four status lines → one attention band → stop, or open Monthly Review.
- **Decision enabled:** Escalate, or leave it alone.

### J5 — Monthly KPI Meeting (first Monday)
- **Goal:** Run the meeting from one screen and leave with agreed actions.
- **Steps:** Open Meeting Mode for the closed month → work the sequence (§17) → capture new actions live → close the meeting with actions owned and dated → the record becomes "last review" for the next cycle.
- **Decision enabled:** What are we each committing to before next month?

---

# 13. Information Architecture

**[REC] Six pages. Not eleven.**

The brief's candidate list included Overview, Performance, Volume & Growth, Exceptions, Actions, Continuous Improvement, Monthly Review, Historical Reporting, KPI Definitions, Data Entry, Administration. **[REC]** We reject four of these as standalone pages:

- **Continuous Improvement** — folds into Actions as a second record type. **[INTERP]** With no improvement initiatives in existence today, a dedicated page would launch empty and stay empty.
- **Historical Reporting** — a time-range control on Performance and Volume, not a page. A separate "history" page implies the main pages only show now, which is wrong.
- **Administration** — a settings drawer, not a navigation item. Two organisations and a handful of users do not need an admin section.
- **Exceptions** and **Actions** — merged. **[INTERP]** An exception without an action is an unresolved complaint; an action without an exception is a task with no context. Separating them forces users to hold the link in their head.

### The six pages

| # | Page | Purpose | Primary audience | Questions answered | Main components | Drill-downs | Deliberately excluded |
|---|---|---|---|---|---|---|---|
| 1 | **Overview** | Answer "how are we doing" in 10 seconds and "does anything need me" in 30 | Woolworths exec + ops | How is Snapes performing? Anything needing attention? What changed since last review? | Since Our Last Review band · 4 status lines · What Requires Attention · 13-week trend · Open commitments | Any element → its page | No charts beyond one trend. No KPI grid. No volume breakdowns. |
| 2 | **Performance** | Service reliability in depth | Woolworths ops, Snapes mgmt | DIFOT trend? Exception rate? Where is it concentrated? Getting better? | DIFOT trend + target band · exception rate trend · exception category breakdown · rolling comparison · volume-floor notices | Point on chart → that period's exceptions | No volume growth charts. No financials. |
| 3 | **Volume & Growth** | Operational activity and mix | Both, exec-weighted | How much work? Growing or shrinking? What kind of work? Seasonal? | Pallet spaces trend (primary) · consignments trend (secondary) · pallets-per-consignment ratio · YoY comparison · seasonal profile · peak periods | Period → weekly detail | **No service metrics whatsoever.** Enforced separation. |
| 4 | **Exceptions & Actions** | The accountable record | Both, ops-weighted | What went wrong? Why? Who owns it? When is it due? Is it closed? Has it repeated? | Filterable exception register · action register · repeat-issue indicator · status distribution · overdue band | Exception → full record + comments + linked actions | Internal-only fields hidden from client view. No aggregate KPIs. |
| 5 | **Monthly Review** | The meeting itself | Both, live in the meeting | Everything, in the right order | Sequenced meeting pack (§17) | Every section expands | Nothing outside the review month unless comparative |
| 6 | **KPI Definitions** | Trust infrastructure | Both | What does this number mean? How is it calculated? Where does it come from? When did the definition change? | Definition cards · formula · source · target + who set it · history coverage · known limitations · change log | Definition → periods affected by a change | No data. Definitions only. |

**Plus, not in client navigation:** **Weekly Entry** (Snapes only) and **Settings** (Snapes admin only).

**[REC]** Woolworths users see 6 items. Snapes users see 8. That is the whole navigation.

---

# 14. Dashboard Component Specification

Every component, with the reason its visualisation type is right.

| # | Component | Purpose | Audience | Metric / data | Visualisation | Why this format | Interaction | Drill-down | Default period | Comparison | Business question |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | **Status line** | State a KPI with its target and verdict in one line | All | Any Layer 1–4 KPI | **Single line of text**: value · target · status word · delta. **Not a card, not a gauge.** | **[REC]** A giant number in a box is the "vanity metric" the brief warns against. A line reads faster, stacks denser, and forces context to sit beside the value | Click → source page | Yes | Current month | Prior month + same month last year | "What is this number and is it OK?" |
| C2 | **Since Our Last Review band** | Frame the whole page in the client's own time-unit | Woolworths | Deltas since last published review | Horizontal band, 4–6 status lines + one sentence | Mirrors how the relationship actually works: monthly cycles, not calendar months | Click any → detail | Yes | Since last review date | Previous review period | "What changed since we last spoke?" |
| C3 | **Attention band** | Surface exceptions rather than making the client find them | Woolworths | Rule-triggered items | Ordered list, most material first. **Explicitly renders "Nothing requires attention" when empty** | **[REC]** An empty state that says nothing is wrong is more trustworthy than a hidden section. Hiding it makes users wonder what else is hidden | Click → record | Yes | Current | – | "Is anything wrong?" |
| C4 | **Trend line with target band** | Show direction and whether it is inside tolerance | Both | DIFOT, exception rate | Line + shaded target band + volume-floor markers | **[REC]** Line, not bar: these are continuous rates over time. The shaded band replaces a threshold line so "inside/outside" is pre-attentive | Hover → period detail; click → exceptions | Yes | Rolling 13 months | Prior year same period | "Are we improving?" |
| C5 | **Dual volume chart** | Show activity honestly | Both | Pallet spaces + consignments | Bars = pallet spaces (primary axis); line = consignments (secondary axis) | **[REC]** Two different units, one time axis. Bars for the primary quantity, a line for the count that contextualises it. **[CALC]** Justified because the two measures diverge — plotting only one misrepresents the account | Toggle either series; select range | Yes | Rolling 24 months | Prior 12 months | "Is the work growing?" |
| C6 | **Ratio strip** | Explain the divergence in C5 | Both | Pallets per consignment | Thin sparkline + current value | **[REC]** Deliberately small. It is an explanatory footnote to C5, not a headline — sizing it larger would imply it is a performance measure | Hover | No | Rolling 24 months | Prior year | "Why do those two lines diverge?" |
| C7 | **Exception register** | The accountable record | Both | Exception records | **Table** | **[REC]** Exceptions are read one at a time, by reference number, with text. A chart of 3 exceptions is decoration. **[FACT]** The workbook's comments are already prose — respect that | Filter, sort, search, expand | Row → full record | Current month | – | "What went wrong and what's happening?" |
| C8 | **Action register** | Prove issues become action | Both | Corrective actions | **Table**, grouped by status, overdue first | Same reasoning as C7 | Filter, sort, expand | Action → linked exception | Open + closed this period | – | "Are commitments being delivered?" |
| C9 | **Exception category breakdown** | Show where problems concentrate | Both | Exceptions by category | **Horizontal bar**, absolute counts, rate shown as text | **[REC]** Horizontal bar for category labels of varying length. **No pie chart** — **[CALC]** with typical monthly exception counts in low single digits, a pie implies precision that does not exist | Click bar → filtered register | Yes | Rolling 12 months | – | "What kind of problems do we have?" |
| C10 | **Seasonal profile** | Prevent seasonal misreadings | Both | Avg pallet spaces by calendar month | Small multiples or a 12-point line, current year overlaid on the six-year average | **[REC]** Overlay is essential: the point is comparison to normal, not the shape itself | Hover | No | 12 months vs 6-yr average | 6-yr average | "Is this month low, or is January always low?" |
| C11 | **Commitment tracker** | One-glance accountability | Woolworths exec | Open / overdue / closed-this-period | **Three status lines** | **[REC]** Three integers. Any chart here is over-engineering | Click → register | Yes | Since last review | Prior period | "Are they doing what they said?" |
| C12 | **Data provenance footer** | Trust | All | Last updated, submitted by, approved by, completeness %, source | **Persistent footer strip** on every data page | **[REC]** Trust is a product requirement (§22). Provenance in a hidden "about" page is provenance nobody reads | Click → KPI Definitions | Yes | – | – | "Can I rely on this?" |
| C13 | **Commentary panel** | Snapes' narrative, clearly attributed | Both | Free text, authored + dated | Text block with author and timestamp, visually distinct from data | **[REC]** Must look like commentary, not data. **[INTERP]** Blurring the two is how a dashboard starts feeling like marketing | Read; Woolworths may reply | No | Current period | – | "What does Snapes say about this?" |
| C14 | **Definition card** | Kill "where did that number come from?" | Both | KPI metadata | Structured card | Reference material, read once, returned to under doubt | Expand | To affected periods | – | – | "What does this actually measure?" |

**Deliberately not built:** gauges, speedometers, traffic-light grids, heat maps, radar charts, pie charts, sparkline walls, animated counters, a relationship score, and any chart of a metric that has been zero for six years.

---

# 15. Executive Overview Design

**[REC]** The 10 / 30 / 120-second contract.

**10 seconds — "How is Snapes performing?"**
Four status lines, one row, fixed order, always present: **Service · Volume · Exceptions · Commitments.** Each carries value, comparison, and a status word. No sparklines, no icons, no colour blocks larger than a status dot.

**30 seconds — "Is anything requiring my attention?"**
One attention band directly beneath, listing only rule-triggered items, most material first. When empty it says so explicitly. **[REC]** Maximum five items; if more qualify, show the top five and a count.

**Attention rules — [REC], all thresholds [CONFIRM]:**

1. DIFOT below agreed target for the period *(blocked until the target is confirmed)*

2. Any exception open more than 14 days without an owner
3. Any corrective action past its due date

4. Any exception category recurring within 90 days
5. Demurrage value more than 50% above the trailing 12-month monthly average

6. Weekly submission missing or late
7. Outstanding invoices >30 days above an agreed threshold

8. Data completeness below 100% for the period

**120 seconds — "What happened, why, and what is being done?"**
The 13-month DIFOT and exception-rate trend, then the open-commitment list. Every element is a link. **[REC]** The Overview never explains — it routes.

**Excluded from Overview by design:** the volume chart (it lives on its own page), any financial detail, any breakdown, and any metric currently reading zero.

---

# 16. "Since Our Last Review"

**[REC]** The most important single component in the product, and the one with no Excel equivalent.

**Anchor:** the date the last monthly review was held — **[FACT]** first Monday of the month — not the calendar month boundary. **[INTERP]** This matters: Woolworths thinks in "since we last spoke", and anchoring to it makes the platform feel like a continuation of the conversation rather than a report.

**Structure — seven blocks, in this order:**

1. **Period** — "Since our review on Monday 6 July 2026 · 4 weeks · Reporting month June 2026"

2. **Performance** — DIFOT, exception rate, both vs the prior review period
3. **Volume** — pallet spaces and consignments moved, vs prior period and same period last year

4. **What went well** — **[REC]** maximum two items, each with a number attached. **[INTERP]** Unlimited "what went well" is where a client-facing dashboard turns into self-promotion. Two, evidenced, is credible; six is a sales pitch.
5. **Exceptions** — count by category, each linked

6. **Commitments** — closed since last review / still open / overdue
7. **Next focus** — one or two items Snapes is prioritising, authored, not generated

**[REC]** Blocks 1–3, 5 and 6 are computed. Blocks 4 and 7 are authored by Snapes and reviewed before publication. **[REC]** Every authored block is visibly attributed and dated so Woolworths can always tell narrative from measurement.

**[REC]** If a period has zero exceptions and zero open actions, the section says so plainly. It does not fill the space.

---

# 17. Monthly Meeting Mode

**[FACT]** The meeting is held on the first Monday of each month.

## 17.1 Recommended sequence — revised from the brief

The brief proposed ten sections. **[REC]** We recommend nine, reordered, with reasoning for each change:

| # | Section | Change from brief | Reasoning |
|---|---|---|---|
| 1 | **Since Our Last Review** | unchanged | Correct opener. Frames everything. |
| 2 | **Previous Commitments** | **moved up from #8** | **[REC]** The strongest possible signal. Opening with "here is what we said we would do, and here is what we did" earns the right to present performance. **[INTERP]** Leaving it at #8 means the meeting spends 40 minutes on numbers before proving accountability — which is precisely the dynamic the platform exists to change. |
| 3 | **Volume & Growth** | **moved up, ahead of performance** | **[REC]** Context before judgement. **[CALC]** With pallets-per-consignment up 37% year-on-year, service numbers are uninterpretable until everyone knows what kind of work was done. |
| 4 | **Executive Performance** | merged with "Service Reliability" | **[REC]** The brief's #2 and #4 are the same conversation. Splitting them creates a duplicate discussion. |
| 5 | **Exceptions** | unchanged | – |
| 6 | **Root Causes** | **merged into Exceptions as an in-record field** | **[REC]** A separate root-cause section invites abstract discussion. **[FACT]** The comment layer shows cause is discussed *per incident* (Epsom, Union Road, Long Life). Keep it there. |
| 7 | **New Corrective Actions** | unchanged | Captured live in the meeting. |
| 8 | **Continuous Improvement** | unchanged | – |
| 9 | **Forward Look** | unchanged | Known peaks, planned programmes, seasonal expectations. **[CALC]** October–November is the demonstrable peak — this is where that gets discussed. |

## 17.2 Meeting Mode behaviour

**[REC]**

- **Frozen data.** Opening Meeting Mode for a month locks that month's figures. **[INTERP]** Numbers changing mid-meeting is fatal to trust.
- **One screen per section**, forward/back navigation, section list always visible.
- **Live capture.** New actions are recorded during the meeting, in the record, with owner and due date. **[REC]** This is the feature that removes the most Snapes admin — no post-meeting minutes to transcribe.
- **Meeting close** stamps the review date, which becomes the anchor for the next "Since Our Last Review".
- **Export to PDF** for the file. **[REC]** Necessary, not optional — **[INTERP]** some attendees will always want a document, and refusing to provide one makes the platform an obstacle.

---

# 18. Exception & Corrective Action Framework

## 18.1 The exception record

**[REC]** Field-by-field, with visibility. Categories are derived from **[FACT]** the actual comment content, not from a generic 3PL taxonomy.

| Field | Type | Required | Client-visible | Notes |
|---|---|---|---|---|
| Exception ID | auto | yes | Yes | – |
| Reporting week | date | yes | Yes | Links to the weekly submission |
| Date occurred | date | yes | Yes | **[FACT]** Often differs from the reporting week — e.g. a comment on the W/E 21 Jun 2020 row describes an event on 5/6 |
| Reference | text | yes | Yes | DSC / DTS / IWP / C-number. **[FACT]** Every substantive comment carries one |
| Site / store | text | yes | Yes | **[FACT]** Named in nearly every comment; **[FACT]** no field exists today |
| Category | picklist | yes | Yes | See below |
| KPI affected | derived | auto | Yes | – |
| Impact | picklist | yes | Yes | Minor / Moderate / Significant — **[REC]** three levels only |
| Impact description | text | no | Yes | e.g. *"Shopfitter had no work"* — **[FACT]** verbatim from the record |
| Description | text | yes | Yes | What happened |
| Cause category | picklist | yes | Yes | See §18.3 |
| Cause detail | text | no | Yes | – |
| Accountable party | picklist | yes | Yes | Snapes / Woolworths / Shared / Third party / Undetermined |
| Client commentary | text | no | **Yes** | Snapes' explanation to Woolworths |
| Internal commentary | text | no | **No** | Snapes-only |
| Client response | text | no | Yes | **[REC]** Woolworths may reply. **[FACT]** They already do, in cell comments |
| Corrective action(s) | link | conditional | Yes | Required when impact ≠ Minor |
| Status | picklist | yes | Yes | Open / Under investigation / Action agreed / Closed |
| Repeat flag | derived | auto | Yes | Same category + site within 90 days |
| Recorded by / at | auto | yes | Yes | – |

## 18.2 Exception categories — evidence-derived

**[REC]** Built from **[FACT]** the 26 comments:

1. **Late delivery** — missed date or time slot *(most common; e.g. "Missed delivery date of 23/4")*

2. **Delivered to wrong location** — *"Delivered to Ascot Vale store instead of Union Road Metro"*; *"sent to Norwest instead of Scoresby"*; *"IWP sent to store instead of 3PL"* — **[INTERP]** at least six documented instances; **currently has no field and is recorded as "late"**
3. **Missed collection / pickup** — *"Missed pick up from Highett"*; *"driver refused to pick up"*; *"6 Pallets for scrapping not collected"*

4. **Equipment / asset not recovered** — *"Epsom equipment return did not occur"*
5. **Programme / rollout miss** — *"11 stores not delivered by 16/10/23"*; *"missed 6 stores"* — **[INTERP]** materially different from a single late delivery: one root cause, many failures

6. **Vehicle / operational disruption** — *"Vehicle breakdown on route"*
7. **Futile delivery**

8. **Demurrage / detention**
9. **Damage**

10. **Packaging**
11. **Documentation / data error** — *"Data Entry error"*; *"address changed in DSC"*

12. **Collection notice not given** — Woolworths-accountable
13. **Safety incident**

**[INTERP]** Categories 2, 3, 4, 5 and 11 account for a large share of the documented incidents and **none of them exists in the current KPI set.** Meanwhile categories 9 and 10 have fields that have recorded zero for six years. The taxonomy is close to inverted.

## 18.3 Cause categories — and language

**[REC]** Neutral, factual, non-accusatory:
Scheduling / allocation · Resource availability · Vehicle or equipment failure · Site access or constraint · Information not available at booking · Booking or documentation error · Third-party carrier · Volume or capacity · External (weather, traffic, incident) · Under investigation · Undetermined

**[REC]** Language rules, enforced in field labels and help text:

- The field is **"Accountable party"**, never "At fault" or "Responsible for the failure"
- **"Undetermined"** is always available and is a legitimate final state
- **"Shared"** exists because **[FACT]** the Epsom exchange is exactly that: a routine booking on one side, unstated access constraints on the other
- **[REC]** Both parties' accounts are stored side by side. The system never resolves a disagreement — it records both and moves to the action.

---

# 19. Corrective Actions

## 19.1 The action record

**[REC]**

| Field | Client-visible | Notes |
|---|---|---|
| Action ID | Yes | – |
| Linked exception(s) | Yes | Many-to-one supported — **[FACT]** one rollout miss produced six failures |
| Action description | Yes | What will be done |
| Owner (person) | Yes | A named person |
| Owner organisation | Yes | Snapes / Woolworths / Joint |
| Agreed date | Yes | – |
| Due date | Yes | – |
| Status | Yes | See below |
| Completion date | Yes | – |
| Completion note | Yes | What was actually done |
| Effectiveness check date | Yes | **[REC]** Default: agreed date + 90 days |
| Effectiveness outcome | Yes | Effective / Not effective / Too early to tell |
| Recurrence since | Derived | Auto-linked from repeat flags |

## 19.2 Statuses — four, not seven

**[REC]** `Agreed` → `In progress` → `Completed` → `Verified effective`
Plus two terminal exits: `Superseded` and `Not proceeding` (both require a reason).

**[REC]** Rejected: "Pending approval", "Awaiting review", "On hold", "Escalated". **[INTERP]** With a handful of actions per month between two organisations, every additional status is a state someone has to maintain and nobody reads.

## 19.3 The seven questions the framework answers

| Question | Answered by |
|---|---|
| What happened? | Exception record: description + reference + site |
| What action was agreed? | Action description |
| Who owns it? | Owner + owner organisation |
| When is it due? | Due date |
| Is it completed? | Status + completion date |
| Was it effective? | Effectiveness check + outcome |
| Has the issue repeated? | Derived repeat flag on category + site within 90 days |

**[INTERP]** The last two are what separate this from a task list, and they are the reason "effectiveness check" is a scheduled date rather than a judgement made at closure.

---

# 20. Continuous Improvement Framework

**[REC]** A second record type inside Exceptions & Actions — **not a separate page, not a separate module.**

**Distinction:** a *corrective action* fixes something that broke. An *improvement initiative* changes how the operation works when nothing has necessarily broken.

| Field | Client-visible | Notes |
|---|---|---|
| Initiative ID / title | Yes | – |
| Problem or opportunity | Yes | **[REC]** Free text, but must reference either a recurring exception category or a measurable current state |
| Expected benefit | Yes | **[REC]** Must name a metric it should move |
| Owner + organisation | Yes | Snapes / Woolworths / Shared |
| Status | Yes | Proposed / Agreed / In progress / Delivered / Measured / Discontinued |
| Start date, target date | Yes | – |
| Latest update + date | Yes | **[REC]** Stale-flag after 60 days without an update |
| Measurable result | Yes | Before/after on the named metric |
| Linked exceptions | Yes | – |

**[REC]** Two hard rules:

1. **No initiative may be created without naming the metric it should move.** Otherwise it becomes an activity log.

2. **[FACT] The workbook contains no improvement initiatives.** We have invented none. The structure launches empty, and **[REC]** the section is hidden from the client view until the first initiative is agreed — an empty "Continuous Improvement" page on a client dashboard actively damages credibility.

---

# 21. Relationship Health Framework

**[REC] No score. No index. No 0–100. No traffic light for "the relationship".**

**[INTERP]** Any composite score requires weighting service against volume against accountability. There is no defensible basis for those weights, and Woolworths would be right to distrust a number invented by the supplier being measured. Worse, it invites optimisation of the score rather than the operation.

**[REC]** Instead: a **five-dimension evidence panel**, each dimension showing a plain-language state and the single number that supports it, with no aggregation.

| Dimension | Question | Evidence shown | Source |
|---|---|---|---|
| **Service reliability** | Are agreed levels being met? | DIFOT vs target, exception rate, direction over 12 months | S1, S3 |
| **Operational activity** | Is the work growing, stable, or consolidating? | Pallet spaces YoY, consignments YoY, pallets/consignment | A1, A2, A3 |
| **Issue resolution** | Do problems get closed? | Exceptions raised vs closed, median days to close | Exception register |
| **Commitment delivery** | Are agreed actions completed on time? | Actions due vs completed on time, overdue count | Action register |
| **Improvement** | Is the operation getting better? | Initiatives delivered, measured results, repeat-issue trend | Initiative register |

**[REC]** Presentation: five rows, each one line of evidence plus one sentence of authored narrative, on the Overview page below the fold and in Meeting Mode. **[REC]** A dimension with no data says **"Not yet measured"** — never a default green.

**[INTERP]** This is more credible than a score precisely because it refuses to summarise. A supplier that says "issue resolution: 4 raised, 3 closed, median 12 days, one still open at 31 days" is more trusted than one that says "Relationship health: 87".

---

# 22. Client Trust — as a product requirement

**[REC]** Specific mechanisms, each answering a specific reason a client distrusts a supplier's dashboard.

| Trust risk | Mechanism |
|---|---|
| "Where did this number come from?" | **C12 provenance footer** on every data page: last updated, submitted by, approved by, source, completeness. Every KPI value links to its definition card. |
| "Has this been edited since I saw it?" | **Amendment log.** Any change to a published figure requires a reason, is timestamped and attributed, and is visible to Woolworths. **[REC]** Non-negotiable — the single strongest trust mechanism in the product. |
| "Are they only showing me the good news?" | **Underperformance is never hidden.** Periods below target render in the same place, same prominence, same detail as periods above. **[REC]** The attention band renders even when empty, so the client knows it is always running. |
| "What are they not telling me?" | **Data completeness indicator** per period. **[REC]** A period with a blank field shows as incomplete rather than silently treating blank as zero — **[CALC]** exactly the DQ-7 failure mode present in the workbook today. |
| "Did they change the definition to make it look better?" | **KPI change log** on every definition card, with the date and the periods affected. **[FACT]** Definitions have already changed once, in June 2020, undocumented. |
| "Are they even submitting on time?" | **G5 on-time submission %**, visible to Woolworths. **[FACT]** They already chase this manually. |
| "Is anything actually being done?" | **Action register with due dates and overdue counts**, visible without asking. |
| "Can I challenge something?" | **Comment on any exception**, as Woolworths, with a visible Snapes response and a response-time indicator. **[FACT]** The Epsom thread took 19 days to answer. |
| "Do the numbers reconcile to what I know?" | **Export the underlying weekly rows** behind any figure. **[REC]** Anything a client cannot export, they will not fully trust. |

**[REC]** One design principle above all: **the platform must be as willing to show a bad month as a good one, in the same format.** If the design only looks good when performance is good, Woolworths will notice within two cycles.

---

# 23. UX Principles, and Mobile vs Desktop

## 23.1 Interface principles

**[REC]** The interface should read as **an operational record, not a product.**

- **Typography carries the hierarchy, not colour.** Colour is reserved for status, and only three states exist: neutral, attention, breach.
- **No metric appears without its comparison.** A number alone is a vanity metric; a number with a target and a prior period is information.
- **Density over decoration.** These users read spreadsheets daily. Whitespace that halves the information per screen is not premium — it is slow.
- **The empty state is a feature.** "No exceptions this period" is a result and must be stated, not represented by an absence.
- **Nothing animates.** **[INTERP]** Motion in a performance record implies the numbers are a performance.
- **No gamification, no badges, no streaks.** **[CALC]** A "48 weeks without a late delivery" streak is factually true and would still be wrong to badge — it invites the operation to protect the streak rather than report honestly.

## 23.2 Desktop vs mobile

**[ASSUME]** The working environment is desktop/laptop; Woolworths management may review from a phone or tablet.

| Screen | Desktop | Tablet | Phone |
|---|---|---|---|
| Overview | Full: status lines, attention band, trend, commitments | Full, stacked | **Status lines + attention band + commitment counts only.** Trend collapses to a "view trend" link |
| Performance | Full | Full, charts reflow | **Single DIFOT figure, exception rate, and the category list.** Charts collapse behind a tap |
| Volume & Growth | Full dual-axis | Full | **Three figures with YoY deltas.** The dual-axis chart is not attempted on a phone |
| Exceptions & Actions | Full table | Table, fewer columns | **Card list** — one exception per card: reference, site, category, status, owner, due date |
| Monthly Review | Primary environment | Usable | **Read-only.** Live action capture is desktop/tablet only |
| Weekly Entry | Primary environment | Usable | **Not supported.** **[REC]** Do not build phone data entry — a 14-field weekly form with conditional exception records is a desktop task, and a degraded mobile version invites incomplete submissions |

**[REC]** The mobile question to answer is "does anything need me?" — not "let me analyse this". Everything that does not serve that question collapses.

---

# 24. Weekly Data Entry Experience

## 24.1 Field model

**[REC]**

| Group | Field | Type | Required | Validation |
|---|---|---|---|---|
| Period | Week ending (Sunday) | system | auto | Pre-created; cannot be typed; duplicate blocked |
| Activity | Consignments despatched | integer | **yes** | ≥0; soft warning outside trailing-13-week range |
| Activity | Pallet spaces despatched | integer | **yes** | ≥0; soft warning if pallets/consignment outside 2–20 |
| Service | Late consignments | integer | **yes** | ≥0; **each unit requires an exception record** |
| Service | Delivered to wrong location | integer | **yes** | as above |
| Service | Missed collections | integer | **yes** | as above |
| Service | Futile deliveries | integer | **yes** | as above |
| Service | Damages | integer | **yes** | as above *(staged — see §30)* |
| Service | Packaging issues | integer | **yes** | as above |
| Safety | Safety incidents | integer | **yes** | as above *(staged)* |
| Cost | Demurrage incidents | integer | **yes** | must pair with value |
| Cost | Demurrage value (AUD) | currency | **yes** | ≥0; must pair with count |
| Cost | 24hr collection notice misses | integer | **yes** | ≥0 |
| Finance | Outstanding invoices >30 days | currency | **yes** | ≥0 |
| Narrative | Week commentary | text | no | Optional context |

**Calculated, never entered:** DIFOT, exception rate, futile rate, pallets per consignment, all rolling values.

## 24.2 Workflow

**[REC] Draft → Submitted → Approved → Published.** Four states, one approval gate.

**[REC]** This is the right level of workflow, not over-engineering, for three evidenced reasons:

1. **[FACT]** Rows 309–313 are manually yellow-highlighted — Snapes is already tracking an informal "not yet reviewed" state. The workflow formalises something that exists.

2. **[FACT]** Comments E51 and B296 show data being chased and reassigned. A submitted-but-unapproved state makes that visible instead of invisible.
3. **[REC]** Internal commentary and cause attribution must never reach the client unreviewed. The approval gate is the control.

**[REC]** What we deliberately do *not* add: a second approver, a Woolworths acceptance step, a reopening workflow, or per-field sign-off. **[INTERP]** One person enters, one person approves, published is published, corrections go through the amendment log.

## 24.3 Entry experience rules

- **Pre-created weeks.** The week exists before anyone opens it; the operator never chooses a date. **[CALC]** Eliminates DQ-2, DQ-3 and DQ-4 outright.
- **Enter once.** Nothing typed in the weekly form is retyped in the meeting pack.
- **Exception records inline**, in the form, at the moment the count is entered — not a separate task afterwards. **[INTERP]** This is the single most important UX decision in the product: an exception captured later is an exception not captured.
- **Live calculated preview** so the operator sees the DIFOT their entry produces before submitting.
- **Blocking vs warning:** structural errors block (missing required field, unmatched exception count, unpaired demurrage). Judgement calls warn (unusual volume, all-zero week) and can be overridden with a note.

---

# 25. Data Quality & Governance

## 25.1 Essential controls — MVP, non-negotiable

**[REC]**

1. **Required fields** — consignments, pallet spaces, and each exception count. Blank is not submittable.

2. **Blank ≠ zero.** Explicit "0" entry required; a skipped field blocks submission. **[CALC]** Directly addresses DQ-7.
3. **Duplicate week prevention** — one submission per week-ending date, enforced at the data layer. **[CALC]** Addresses DQ-2.

4. **Missing period detection** — the system knows which weeks are due and flags gaps. **[CALC]** Addresses DQ-3.
5. **Week-ending date validation** — Sundays only, system-generated, not typed. **[CALC]** Addresses DQ-4.

6. **Negative value prevention** on all counts and values.
7. **Percentage validation** — no derived percentage may exceed 100% or fall below 0%; violations block publication rather than rendering. **[CALC]** Addresses DQ-5.

8. **Denominator floor** — DIFOT suppressed below the minimum-volume threshold; zero-consignment weeks never produce a percentage. **[CALC]** Addresses DQ-8 and DQ-9.
9. **Exception count reconciliation** — if late = 3, exactly three exception records must exist. Counts become derived, not typed.

10. **Demurrage pairing** — a value requires a count and vice versa. **[CALC]** Addresses DQ-11.
11. **Created by / updated by / timestamps** on every record.

12. **Publication status** — Draft / Submitted / Approved / Published. Woolworths sees only Published.
13. **Amendment reason** — mandatory on any change to a published figure.

## 25.2 Nice-to-have — Phase 2

Outlier warnings against trailing averages · soft warning on an all-zero exception week · reasonableness check on pallets-per-consignment · bulk import validation · scheduled completeness digest · field-level change history · configurable validation thresholds.

## 25.3 Explicitly not recommended

**[REC]** Automated data-quality scoring, ML anomaly detection, mandatory dual approval on every week, and per-field permissions. **[INTERP]** All add friction to a five-minute weekly task performed by one or two people.

---

# 26. KPI Data Dictionary

**[REC]** The implementation-ready specification. `Target source` records *who set the target and when* — **[FACT]** currently unanswerable for every KPI, which is why the column exists.

| ID | Name | Description | Business purpose | Source | Numerator | Denominator | Formula | Unit | Target | Target source | Freq | Aggregation | Client visibility | Owner | Historical availability | Limitations | Clarification required |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | Consignments delivered | Consignment notes despatched | Activity + service denominator | Weekly entry (**[ASSUME]** TMS) | – | – | Direct count | count | none | – | Weekly | Sum | Yes | Snapes Ops | 2017-07 → present | Manual count | Source system? |
| A2 | Pallet spaces despatched | Pallet spaces despatched | Primary volume measure | Weekly entry | – | – | Direct count | spaces | none | – | Weekly | Sum | Yes | Snapes Ops | 2017-07 → present | Manual count | Source system? |
| A3 | Pallet spaces per consignment | Average consignment size | Explains volume divergence | Derived | Σ pallet spaces | Σ consignments | A2 ÷ A1 | ratio | none | – | Monthly | Ratio of sums | Yes | Snapes Ops | 2017-07 → present | Not a performance measure | Driver of the increase? |
| S1 | DIFOT % | Delivered in full, on time | Contractual service level | Derived | A1 − S2 − H2count | A1 | (A1−late−damaged)÷A1 | % | **not agreed** | **[FACT] unknown — 0.95/0.98/0.99 all present** | Monthly | Volume-weighted | Yes | Snapes Ops | 2017-07 → present | Saturated; fragile below floor | **Target; damages in or out** |
| S2 | Late consignments | Consignments not delivered on the due date/time | Service failure count | Weekly entry + exception records | – | – | Direct count | count | none | – | Weekly | Sum | Yes | Snapes Ops | 2017-07 → present | Absorbs wrong-location and missed-collection events today | Definition of "late" |
| S3 | Service exception rate | Client-visible exceptions per 100 consignments | Volume-neutral service view | Derived | Σ client-visible exceptions | Σ consignments | ×100 | per 100 | none yet | – | Monthly | Ratio of sums | Yes | Snapes Ops | **From go-live only** | Will rise as capture improves | Pre-frame with Woolworths |
| S4 | Futile delivery rate | Futile deliveries per 100 consignments | Waste and cause | Derived | Σ futile | Σ consignments | ×100 | per 100 | none | – | Monthly | Ratio of sums | Yes | Snapes Ops | 2020-06 → present | 12-month zero run unexplained | Real or unrecorded? |
| C1 | Demurrage value | AUD detention cost | Cost of delay | Weekly entry | – | – | Direct sum | AUD | none | – | Weekly | Sum | Yes | Snapes Ops | 2020-06 → present | No site or cause captured | Source; who bears it |
| C2 | Demurrage incidents | Detention events | Frequency of delay | Weekly entry | – | – | Direct count | count | none | – | Weekly | Sum | Yes | Snapes Ops | 2020-06 → present | Blank for last 6 weeks | Blank = zero or unknown? |
| C3 | Demurrage cost per incident | Average detention cost | Severity | Derived | C1 | C2 | C1 ÷ C2 | AUD | none | – | Monthly | Ratio of sums | Yes | Snapes Ops | 2020-06 → present | Count/value mismatch | Fix pairing first |
| C4 | 24hr collection notice misses | Collections notified with <24h notice | Client-side notice discipline | Weekly entry | – | – | Direct count | count | none | – | Weekly | Sum | Yes | Snapes Ops | 2017-07 → present | Non-zero once in 464 weeks | Definition; who is accountable |
| C5 | Outstanding invoices >30 days | Snapes invoices unpaid beyond 30 days | Payment performance | Weekly entry (**[ASSUME]** AR) | – | – | Point-in-time balance | AUD | none | – | Weekly | **Latest value, never summed** | Yes | Snapes Finance | 2017-07 → present | Point-in-time, not a flow; 11 recent blanks | What changed in 2023 |
| H1 | Safety incidents | Reportable safety events | Compliance and duty of care | Weekly entry | – | – | Direct count | count | none | – | Weekly | Sum | Yes | Snapes WHS | 2017-07 → 2020-06, **then none** | Dropped from reporting Jun 2020 | Reinstate? |
| H2 | Damage rate | Damages per 1,000 pallet spaces | Freight integrity | Weekly entry + exception | Σ damages | Σ pallet spaces | ×1000 | per 1,000 | none | – | Monthly | Ratio of sums | Yes | Snapes Ops | **Not credibly captured 2017–2026** | Zero across 289,000 pallet spaces | **Zero or not captured?** |
| G1 | Open corrective actions | Actions not yet complete | Accountability | Action register | – | – | Count where status ≠ Completed | count | 0 overdue | **[REC]** joint | Continuous | Point-in-time | Yes | Both | **From go-live** | New | – |
| G2 | Overdue corrective actions | Past due date, not complete | Accountability | Action register | – | – | Count where due < today | count | 0 | **[REC]** joint | Continuous | Point-in-time | Yes | Both | From go-live | New | – |
| G4 | Repeat issue count | Same category + site within 90 days | Effectiveness of corrective action | Derived | – | – | Rule-based | count | 0 | **[REC]** joint | Monthly | Count | Yes | Both | From go-live | Needs a site field | Site naming standard |
| G5 | On-time submission % | Weeks submitted by cut-off | Process discipline and trust | Timestamp field | on-time weeks | weeks due | ×100 | % | 100% | **[REC]** joint | Monthly | Ratio | Yes | Snapes Ops | 2020-06 → present (**[FACT]** never used) | Needs an agreed cut-off | **What is the cut-off?** |
| G6 | Data completeness % | Required fields populated | Trust | Derived | populated required fields | expected fields | ×100 | % | 100% | **[REC]** joint | Weekly | Ratio | Yes | Snapes Ops | From go-live | – | – |

---

# 27. Historical Migration Assessment

**Assessment only. No migration performed.**

## 27.1 What can be migrated

| Source | Period | Records | Confidence | Treatment |
|---|---|---|---|---|
| Visible sheet, cols B–N | 7 Jun 2020 – 31 May 2026 | 310 unique weeks | **High** | Direct map, after de-duplication |
| `Transport KPI` (hidden) | 2 Jul 2017 – 5 Jul 2020 | 158 weeks | **Medium** | Map to a legacy KPI set, flagged as a different definition era |
| Threaded comments | Jul 2020 – Mar 2026 | 26 threads | **High value, manual** | **[REC]** Hand-convert to exception records — see §27.4 |

## 27.2 What cannot be migrated

| Item | Reason |
|---|---|
| **Column Q** | **[FACT]** Formula is `1−(pallets/late)` — 51 of 54 values are errors or nonsense. Discard entirely. |
| **Column P** | **[FACT]** Coverage is partial (rows 2–3, 58–134, 136–217). **[REC]** Do not migrate; recompute from source counts so every period uses one stated method. |
| **`Sheet2`** | **[CALC]** A rounded duplicate of `Transport KPI` differing on invoice values ($5,521.53 vs $5,522). **[REC]** Migrate `Transport KPI` as the source; retain `Sheet2` as an archive file only. |
| **Legacy 5 Jan 2020 row** | **[FACT]** 0.1 consignments, 0 pallets — a `#DIV/0!` workaround. **[REC]** Import as consignments = 0 with a data-quality note; do not import a DIFOT for that week. |
| **Cell fill colours** | **[INTERP]** Undocumented FY banding, applied inconsistently, abandoned mid-2024. No meaning worth preserving. |
| **Legacy "Note:" rows** | **[FACT]** Two operating constraints stored as KPI row labels. Not measures. **[REC]** Extract to an "Operating constraints" reference note; **[CONFIRM]** whether still current. |

## 27.3 Values requiring clarification before import

**[CONFIRM]**

| Item | Question |
|---|---|
| Triplicate week W/E 30 May 2021 | Keep the earliest submission and discard two, or is one of them a mis-dated different week? |
| Four missing weeks (Dec 2020 – Jan 2022) | Genuine shutdown (import as zero-activity) or missed submissions (import as no-data)? These are **not** the same. |
| Six years of zero damages / issues / packaging / unauthorised returns | Import as true zeros, or as **"not captured"**? **[REC]** Import as **not captured** — importing them as zeros would bake a false baseline into every future comparison. |
| 11 blank invoice weeks and 6 blank demurrage-count weeks | Zero or unknown? |
| W/E 21 Dec 2020 (a Monday) | Correct to Sunday 20 Dec, or a genuinely different period? |
| The 2023 collapse in outstanding invoices | Real change, or a change in what was measured? Determines whether it is presentable as an achievement. |

## 27.4 Migration principles

**[REC]**

1. **Import as-recorded.** Never silently correct. Every correction is a separate, logged, reasoned amendment.

2. **Stamp the definition era** on every imported record — `legacy_2017_2020` or `current_2020_2026` — so any cross-era comparison declares itself.
3. **Recompute all derived values** from source counts under the stated formula. Import no calculated fields.

4. **Import "not captured" as null, never zero.** The single most consequential migration decision in this project.
5. **Convert the 26 comments by hand** into exception records with date, reference, site, category and description. **[INTERP]** This is perhaps four hours of work and produces the platform's entire founding exception history — including six documented wrong-location deliveries that currently exist nowhere as data. **[REC]** Do it.

6. **Reconciliation report** before go-live: row counts, period totals, and each excluded record with its reason, agreed with Snapes and shared with Woolworths.

---

# 28. Text Wireframes

Populated with the actual measures, values and incidents found in the workbook. Hierarchy, not decoration.

## 28.1 Executive Overview

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  WOOLWORTHS × SNAPES LOGISTICS VIC          Reporting month: June 2026             │
│  Transport performance                       Published 6 Jul 2026 · Complete       │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SINCE OUR LAST REVIEW — Monday 1 June 2026 · 4 weeks                              │
│                                                                                    │
│  Service          DIFOT 100.00%          Target not yet agreed      On target      │
│  Volume           2,104 pallet spaces    241 consignments           −8% vs May     │
│  Exceptions       1 raised               0.41 per 100 consignments  1 closed       │
│  Commitments      2 open                 0 overdue                  1 closed       │
│                                                                                    │
│  ▸ Full review                                                                     │
├────────────────────────────────────────────────────────────────────────────────────┤
│  WHAT REQUIRES ATTENTION                                                           │
│                                                                                    │
│  ●  Demurrage $1,821.60 in April 2026 — 4.9× the 12-month monthly average          │
│     6 incidents · cause under investigation · owner F. Fareed · due 30 Jun         │
│                                                                                    │
│  ●  Demurrage incident count not recorded for 6 consecutive weeks from 26 Apr      │
│     Value recorded without a count on 10 May ($1,113.75) and 17 May ($552.75)      │
│                                                                                    │
│  ○  No other items require attention this period                                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SERVICE TREND — rolling 13 months                                                 │
│                                                                                    │
│  DIFOT %      Jun25 ▁▁ 99.10   Sep ▔▔ 100.00   Dec ▔▔ 100.00   Mar26 ▔▔ 100.00     │
│               ────────────────────────────────────────────────────────────────     │
│               Target band: not yet agreed — see KPI Definitions                    │
│                                                                                    │
│  Exceptions   0.86 ▁▁▂▁ per 100 consignments                        ▸ Performance  │
│  per 100                                                                           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  OPEN COMMITMENTS                                                                  │
│  ACT-0031  Confirm demurrage cause categories at 2 VIC sites   F. Fareed  30 Jun   │
│  ACT-0029  Agree DIFOT target and volume floor                 Joint      31 Jul   │
│                                                          ▸ Exceptions & Actions    │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Source: Snapes weekly submission · Approved R. Goullet 3 Jul 2026 · Complete      │
│  All figures reconcile to weekly source data ▸ Export ▸ KPI Definitions            │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 28.2 Performance Detail

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE                    Period: Jun 2026 ▾   Compare: Jun 2025 ▾           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  DIFOT                                                                             │
│  100.00%   ·  241 consignments  ·  0 late  ·  Jun 2025: 99.10% (3 late / 332)      │
│  Method: (consignments − late − damaged) ÷ consignments · volume-weighted          │
│  Target: NOT YET AGREED — workbook holds 0.95, 0.98 and 0.99 simultaneously ⚠      │
│                                                                                    │
│  Jun25 99.10 ─ Jul 100 ─ Aug 100 ─ Sep 100 ─ Oct 100 ─ Nov 100 ─ Dec 100           │
│  Jan26 100 ─ Feb 100 ─ Mar 100 ─ Apr 100 ─ May 100 ─ Jun 100                       │
│                                                                                    │
│  ⓘ  DIFOT has been 100% in 287 of the last 310 weeks. Weeks below the volume       │
│     floor are shown as counts, not percentages.  ▸ Why this metric is limited      │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SERVICE EXCEPTION RATE                       0.41 per 100 consignments            │
│  1 exception · 241 consignments · prior period 0.00 · rolling 13-wk 0.28           │
│                                                                                    │
│  BY CATEGORY — rolling 12 months                                                   │
│  Demurrage / detention        ████████████  9                                      │
│  Late delivery                ██  1                                                │
│  Futile delivery              ██  1                                                │
│  Delivered to wrong location  —  0        (category added Jul 2026)                │
│  Missed collection            —  0        (category added Jul 2026)                │
│  Damage                       —  not captured before Jul 2026                      │
│                                                                                    │
│  ⚠  Damages, delivery issues, packaging issues and unauthorised returns were       │
│     recorded as zero in every week from Jun 2020 to May 2026. Treated as           │
│     NOT CAPTURED, not as zero.                    ▸ Data quality note              │
├────────────────────────────────────────────────────────────────────────────────────┤
│  OTHER MEASURES                        This period   Prior   Rolling 13-wk         │
│  Futile deliveries                          0          0         0.02/100          │
│  Demurrage incidents / value                0 / $0     6 / $1,821.60   —           │
│  24hr collection notice misses              0          0         0                 │
│  Outstanding invoices >30 days       $1,466.13    $504.64        —                 │
│  Safety incidents                    not captured — reinstating Jul 2026           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 28.3 Volume & Growth

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  VOLUME & GROWTH               Range: Rolling 24 months ▾    ⓘ No service metrics  │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Pallet spaces despatched          Consignments            Pallets / consignment   │
│  30,682  last 52 weeks             3,482                   8.81                    │
│  −15.1% vs prior 52 weeks          −38.1%                  +37.2%  (6.42 → 8.81)   │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ACTIVITY — bars: pallet spaces (left)   line: consignments (right)                │
│                                                                                    │
│  1800│         ▉                              ▉                                    │
│  1200│    ▉  ▉ ▉ ▉         ▉        ▉  ▉    ▉ ▉ ▉                                  │
│   600│ ▉  ▉  ▉ ▉ ▉ ▉  ▉ ▉  ▉ ▉ ▉ ▉  ▉  ▉ ▉  ▉ ▉ ▉ ▉ ▉ ▉                            │
│      └──────────────────────────────────────────────────────────                   │
│        Jun24        Dec24        Jun25        Dec25        Jun26                   │
│  cons.  ╲___╱‾‾╲______╱‾‾╲_________╲______________╲_____                           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  PALLETS PER CONSIGNMENT     ▁▁▂▂▃▃▄▅▆▇█▇  4.42 → 6.53 → 8.81                       │
│  Fewer, larger movements. Not a performance measure.                               │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SEASONAL PROFILE — this year vs 6-year average, avg pallet spaces per week        │
│  Jan  268 ▎         Apr  505 ▍         Jul  454 ▍         Oct   885 ▊              │
│  Feb  719 ▌         May  646 ▌         Aug  532 ▍         Nov 1,101 █  ← peak      │
│  Mar  659 ▌         Jun  493 ▍         Sep  531 ▍         Dec   429 ▎              │
│  ⓘ January averages 24% of the November peak. Month-on-month falls into            │
│     January are seasonal, not performance.                                         │
├────────────────────────────────────────────────────────────────────────────────────┤
│  PEAK WEEKS ON RECORD          2 Mar 2025  1,923 spaces / 114 consignments (16.9)  │
│                               13 Nov 2022  1,865 / 145 (12.9)                      │
│                                9 Nov 2025  1,789 /  85 (21.0)                      │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 28.4 Exceptions & Actions

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  EXCEPTIONS & ACTIONS    Period: Jun 2026 ▾  Category: All ▾  Status: All ▾        │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Raised 1   Closed 1   Open 0   Overdue 0   Repeat 0                               │
├────────────────────────────────────────────────────────────────────────────────────┤
│  EXCEPTIONS                                                                        │
│  ID       Date    Ref        Site          Category    Impact   Party   Status     │
│  EXC-0042 12 Apr  C-71204    Dandenong Sth Demurrage   Moderate Shared  Closed     │
│    ▸ 3 detention events, $1,162.30. Cause: site access constraint.                 │
│      Snapes: dedicated vehicle now scheduled for this site.                        │
│      Woolworths: acknowledged — dock availability confirmed for future bookings.   │
│      Action ACT-0031 · Closed 30 Jun · Effectiveness check due 12 Jul              │
│                                                                                    │
│  ── MIGRATED FROM WORKBOOK COMMENTS ──────────────────────────────────────────     │
│  EXC-0018 11 Jun 25  —       Epsom         Equipment   Signif.  Shared  Closed     │
│    ▸ Equipment return did not occur; forklift access lost, fencing removed,        │
│      equipment exposed overnight.                                                  │
│      Woolworths (11 Jun): equipment needed pickup previous day.                    │
│      Snapes (30 Jun): booked as routine pallet transfer into Bulk; no truck        │
│      scheduled Epsom side; access constraint not communicated at booking.          │
│      Cause: information not available at booking · Response time 19 days           │
│                                                                                    │
│  EXC-0009 07 Apr 24  3505593 Union Rd Metro Wrong loc. Moderate Snapes  Closed     │
│    ▸ 3 DSCs delivered to Ascot Vale instead of Union Road Metro.                   │
│      ⓘ Originally recorded as "late delivery" — no wrong-location field existed.   │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ACTIONS                                                                           │
│  ID       Action                              Owner        Org     Due     Status  │
│  ACT-0029 Agree DIFOT target and volume floor Joint        Joint   31 Jul  Agreed  │
│  ACT-0031 Confirm demurrage cause at 2 sites  F. Fareed    Snapes  30 Jun  Complete│
│           └ Effectiveness check 12 Jul · Recurrence since: none                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 28.5 Monthly Review / Meeting Mode

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  MONTHLY REVIEW — June 2026            Meeting: Monday 6 July 2026                 │
│  ● Figures locked 1 Jul 2026            1/9  ‹ ›            ▸ Export PDF           │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ● 1  SINCE OUR LAST REVIEW                                                        │
│    2  PREVIOUS COMMITMENTS            ← moved ahead of performance                 │
│    3  VOLUME & GROWTH                 ← context before judgement                   │
│    4  PERFORMANCE & SERVICE RELIABILITY                                            │
│    5  EXCEPTIONS  (cause held in each record)                                      │
│    6  NEW CORRECTIVE ACTIONS          ← captured live in this meeting              │
│    7  CONTINUOUS IMPROVEMENT          ← hidden until first initiative exists       │
│    8  RELATIONSHIP EVIDENCE           ← five dimensions, no score                  │
│    9  FORWARD LOOK                                                                 │
├────────────────────────────────────────────────────────────────────────────────────┤
│  1 · SINCE OUR LAST REVIEW — 1 Jun to 30 Jun 2026 (4 weeks)                        │
│                                                                                    │
│  PERFORMANCE   DIFOT 100.00% · 0 late of 241 · exception rate 0.41/100             │
│  VOLUME        2,104 pallet spaces · 241 consignments · 8.7 per consignment        │
│                                                                                    │
│  WHAT WENT WELL  (max 2, each with a number)                                       │
│    · 48 consecutive weeks with no late consignment — longest run since             │
│      the 89-week run ended March 2024                                              │
│    · Outstanding invoices >30 days averaged $497/week in 2026 against              │
│      $170,779/week in 2022                                                         │
│                                                                                    │
│  EXCEPTIONS      1 raised (demurrage, shared cause) · 1 closed                     │
│  COMMITMENTS     1 closed · 2 open · 0 overdue                                     │
│                                                                                    │
│  NEXT FOCUS      Agree DIFOT target and volume floor · Determine the driver of     │
│                  the April demurrage spike        — R. Goullet, 3 Jul 2026         │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                     ‹ Previous     Next: 2 ›       │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## 28.6 Weekly KPI Entry

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  WEEKLY SUBMISSION          Week ending Sunday 7 June 2026        DRAFT            │
│  Snapes Logistics VIC                        Due Wed 10 Jun · Entered F. Fareed    │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ACTIVITY                                                                          │
│  Consignments (consignment notes) despatched   [    58  ]  required                │
│  Pallet spaces despatched                      [   412  ]  required                │
│                                     ⓘ 7.1 per consignment · typical range 4–12     │
├────────────────────────────────────────────────────────────────────────────────────┤
│  SERVICE — each non-zero count requires an exception record below                  │
│  Late consignments                             [     1  ]  → 1 record required ⚠   │
│  Delivered to wrong location                   [     0  ]                          │
│  Missed collections                            [     0  ]                          │
│  Futile deliveries                             [     0  ]                          │
│  Damages                                       [     0  ]                          │
│  Packaging issues                              [     0  ]                          │
│  Safety incidents                              [     0  ]   (reinstated Jul 2026)  │
├────────────────────────────────────────────────────────────────────────────────────┤
│  COST & FRICTION                                                                   │
│  Demurrage incidents        [  0 ]     Demurrage value  [ $0.00 ]                  │
│                                        ⓘ count and value must agree                │
│  24hr collection notice misses (not given to 3PL)  [  0 ]                          │
│  Outstanding invoices >30 days                     [ $1,466.13 ]                   │
├────────────────────────────────────────────────────────────────────────────────────┤
│  ⚠ EXCEPTION RECORD REQUIRED — 1 late consignment declared, 0 recorded             │
│                                                                                    │
│  + Add exception                                                                   │
│    Date occurred [ 03/06/2026 ]   Reference [ DSC 5661078 ]                        │
│    Site [ Castlemaine ]           Category [ Late delivery      ▾ ]                │
│    Impact [ Moderate ▾ ]          Cause [ Scheduling / allocation ▾ ]              │
│    What happened  [ Delivered 09:29 against a 07:30 booking; missed during ...  ]  │
│    Client commentary  [ Additional vehicle allocated for this run from 10/6.    ]  │
│    Internal note (not visible to Woolworths)  [ ...                             ]  │
│    Accountable party [ Snapes ▾ ]                                                  │
├────────────────────────────────────────────────────────────────────────────────────┤
│  CALCULATED — not entered                                                          │
│  DIFOT 98.28%   ·   Exception rate 1.72 per 100   ·   Pallets/consignment 7.1      │
├────────────────────────────────────────────────────────────────────────────────────┤
│  Save draft            Submit for review →         (published only after approval) │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 29. Woolworths Perspective Critique

## 29.1 As Woolworths Transport / Logistics Manager

**What I care about**
Did my stores get their freight, on the day, at the right address. When something is missed, does someone tell me before I find out from the store. Are the things I raised last month actually fixed. Do I have a reference number I can quote.

**What is missing from the proposal**

1. **My own reference numbers are not first-class.** I write in DSC, DTS, IWP and PO numbers. If I cannot search by `3505593`, I will not use this. → **[REC] Reference is a required, indexed, searchable field.**

2. **No store-level view.** I think in stores — Castlemaine, Epsom, Union Road Metro. **[FACT]** Nine documented incidents name a store. → **[REC] Site is a required field and a first-class filter from MVP.**
3. **No programme/rollout dimension.** **[FACT]** My two worst events were a bread-prop rollout and a long-life rollout, each affecting 6–11 stores. → **[REC] "Programme" as an optional grouping on exceptions; a rollout miss is one cause with many failures.**

4. **Nothing tells me how fast Snapes responds.** **[FACT]** My Epsom comment sat 19 days. → **[REC] Response-time indicator on every exception thread.**
5. **I cannot raise an exception myself.** Today I write a comment and it becomes a record. → **[REC] Woolworths must be able to raise an exception, not just comment on one. This is the single most-requested capability the evidence supports.**

**What feels like Snapes self-promotion**

- "What Went Well" — tolerable at two evidenced items; **[REC]** any more and I stop reading the section.
- A "Relationship Health" panel written by the supplier. **[REC]** Acceptable only because it shows evidence and never a score. If it ever gains a score, it becomes marketing.
- Any DIFOT figure displayed against a target Snapes chose. → **[REC] Show "Target not yet agreed" until it is jointly agreed. That absence is more credible than a convenient number.**

**What creates confidence**
The amendment log. The completeness indicator. The willingness to render "not captured" instead of "0". A visible overdue count. Being able to export the weekly rows behind any figure.

**What would make me question the data**
A dashboard telling me service is perfect when I have a folder of emails about wrong deliveries. **[INTERP]** This is the live risk: **[CALC]** the numbers say 99.90%, the comments say otherwise, and I wrote the comments. → **[REC] The Performance page must carry an explicit, permanent note that four exception fields were not captured 2020–2026 and are being reinstated. Owning that gap is the platform's credibility test.**

**What I would drill into**
An exception → the consignment → the store → what was done → has it happened at that store before.

**What is unnecessary**
Weekly DIFOT percentages at low volume. The seasonal profile beyond one glance. Pallets-per-consignment as anything larger than a footnote.

## 29.2 As Woolworths Senior Management

| Question | Answer from the proposed design | Verdict |
|---|---|---|
| Can I understand performance quickly? | Four status lines, one attention band | **Yes** |
| Is the relationship improving? | Five-dimension evidence panel; service improving, volume consolidating, demurrage worsening | **Yes, honestly** |
| Are there material risks? | **[CALC]** Yes — demurrage up 149% YoY, and four exception categories not captured for six years | **Surfaced, not buried** |
| Is Snapes handling growth effectively? | **[CALC]** Volume is not growing; it is consolidating. The design says so plainly | **Yes — and the honesty is the point** |
| Are problems being resolved? | Action register with owners, due dates, overdue count, effectiveness check | **Yes** |
| Why should I trust these numbers? | Provenance footer, amendment log, completeness %, exportable source, definition change log | **Yes — conditional on the capture gap being disclosed** |

**[INTERP]** The senior-management view fails on exactly one point: a 100% DIFOT badge is not believable to anyone who has read the emails. **[REC]** The fix is not to soften the metric — it is to make the exception register, not DIFOT, the proof of quality.

---

# 30. Snapes Perspective Critique

| Concern | Assessment | Response |
|---|---|---|
| **Will weekly entry create excessive admin?** | **[FACT]** Snapes already submits weekly — 310 submissions over six years. The MVP form has the same fields plus exception detail **only when something went wrong.** **[CALC]** Exceptions occur in roughly 1 week in 4. | **Net-neutral in typical weeks; a few minutes more in exception weeks.** Acceptable. |
| **Can existing information be reused?** | **[FACT]** Consignment counts, pallet spaces and invoice ageing come from existing systems. **[CONFIRM]** whether a TMS export could pre-populate. | **[REC] Assume manual entry for MVP.** Do not make the MVP depend on an integration. |
| **Are we creating duplicate reporting?** | **Risk: yes** — if the Excel file continues in parallel. | **[REC] Hard cutover.** The workbook is archived read-only on go-live. Parallel running guarantees the platform is abandoned. |
| **Will operations actually use it?** | **[FACT]** Comment E51 shows a data-completion request assigned to Jeffrey, reassigned to operations two months later, and evidently never resolved. **[FACT]** Comment B296 shows Woolworths chasing February data in March. | **[INTERP] Adoption is the top delivery risk, above anything technical.** **[REC]** One named owner, a fixed weekly cut-off, and a visible on-time submission metric. |
| **Does management get early warning?** | **[FACT]** Today, no — issues surface at the monthly meeting, or in a comment on the file. | **[REC] The largest single benefit to Snapes.** Internal weekly review before publication means Snapes sees an issue before Woolworths raises it. |
| **Can we prepare for meetings faster?** | **[FACT]** There is no summary artefact in the workbook — the pack is assembled manually each month. | **[REC] Meeting Mode eliminates that preparation entirely.** This is the clearest ROI in the project. |
| **Could the dashboard expose inappropriate internal information?** | **Real risk.** Internal commentary, cause attribution, and draft figures must never leak. | **[REC] Non-negotiable:** internal fields never leave the server for a client session; nothing is client-visible until Published; management approval gate in MVP. |
| **Are we promising data we cannot collect?** | **Yes, in three places.** Damages/issues/packaging/unauthorised returns have never been captured — reinstating them is a real operational change, not a form field. Safety incidents were dropped in 2020. Site and programme fields do not exist today. | **[REC] Stage it.** MVP captures site + reference on exceptions only. Damage and safety reinstatement need a stated internal process and an agreed start date — **[REC] and Woolworths must be told the start date, so the resulting rise is understood as better capture, not worse performance.** |
| **Will exception rates rising make us look worse?** | **[INTERP] Almost certainly yes, in the first two quarters.** | **[REC] Pre-frame it with Woolworths before launch, in writing.** A supplier that says "we are going to start reporting things we previously missed, and our numbers will get worse before they get better" buys more trust than six more years of 100%. |

---

# 31. Revised Recommendation

Changes made after both critiques:

1. **Woolworths can raise an exception directly.** Moved from Phase 2 to **MVP** (§29.1). Without it, the platform is less capable than the Excel comment thread it replaces.

2. **Site/store and Reference are required, indexed and filterable** from MVP (§29.1).
3. **Programme/rollout grouping** added to the exception record as optional (§29.1).

4. **Response-time indicator** on exception threads (§29.1).
5. **Permanent, prominent capture-gap disclosure** on the Performance page (§29.1, §30). The design owns the six-year gap rather than hiding behind 100%.

6. **DIFOT target renders as "Not yet agreed"** until jointly agreed — no invented target ever ships.
7. **Damage and safety reinstatement moved out of MVP** into a staged rollout with an agreed start date communicated to Woolworths (§30).

8. **Continuous Improvement hidden from client view** until a first initiative exists (§20).
9. **Meeting sequence reordered** — commitments second, volume third (§17.1).

10. **Hard cutover from Excel confirmed** as a delivery requirement, not a preference (§30).

---

# 32. MVP Scope and Roadmap

**Principle:** the smallest product that materially improves the Woolworths × Snapes performance conversation.

## 32.1 MVP — Must have

| # | Feature | Why it is in |
|---|---|---|
| M1 | Weekly submission form — 14 fields, validation, Draft → Submitted → Approved → Published | Replaces the current process; fixes DQ-1, 2, 3, 4, 7, 11 |
| M2 | **Mandatory exception record on any non-zero count**, with date, reference, site, category, cause, description, party, client + internal commentary | The core product idea |
| M3 | Corrective action register — 4 statuses, owner, due date, effectiveness check | Turns issues into accountable commitments |
| M4 | **Woolworths can raise and comment on exceptions** | Parity with what Excel comments already allow |
| M5 | Executive Overview — 4 status lines, attention band, 13-month trend, open commitments | The 10/30/120-second contract |
| M6 | Performance page with capture-gap disclosure and volume floor | Service depth, honestly framed |
| M7 | Volume & Growth page — dual-axis, pallets-per-consignment, seasonal profile | The account's real story |
| M8 | Exceptions & Actions register with site, reference, category and repeat flag | The accountable record |
| M9 | Monthly Review / Meeting Mode with locked figures and live action capture | The single biggest efficiency gain for Snapes |
| M10 | Since Our Last Review | Frames every conversation |
| M11 | KPI Definitions page with formula, source, target status, limitations, change log | Trust infrastructure |
| M12 | Provenance footer, amendment log, completeness indicator | Trust infrastructure |
| M13 | Historical import of 310 current-era weeks + 158 legacy weeks + 26 comment-derived exceptions | Day-one history |
| M14 | Client-visible / internal field separation with publication gate | Protects Snapes |
| M15 | Export weekly source data and monthly review to PDF | Nobody trusts what they cannot export |

## 32.2 Phase 2 — Should have

Weekly (not just monthly) client-facing publication cadence · reinstated damage capture, normalised per 1,000 pallet spaces · reinstated safety incident reporting · improvement initiative register made client-visible · repeat-issue analytics by site and category · effectiveness verification workflow · programme/rollout grouping and reporting · on-time submission and completeness trending · configurable attention thresholds · store-level performance view.

## 32.3 Future — Could have

TMS integration to pre-populate consignments and pallet spaces · finance-system integration for invoice ageing · multi-3PL support (**[FACT]** the `3PL` column already anticipates this) · multi-site/state expansion beyond VIC · automated demurrage capture from detention records · scheduled digests · rolling forecast against known programmes.

## 32.4 Explicitly recommended against — with reasons

| Not building | Reason |
|---|---|
| **AI-generated commentary or summaries** | **[CALC]** Four of nine exception fields have been empty for six years. AI over a dataset like this produces confident summaries of nothing. Revisit after four quarters of reliable capture. |
| **Predictive analytics / forecasting** | **[CALC]** 33 late deliveries in six years is not a trainable signal. r=0.09 between volume and lateness. There is nothing to predict. |
| **Relationship score (0–100)** | No defensible weighting exists; a supplier-authored score invites distrust and gaming (§21). |
| **Benchmarking against other 3PLs** | **[FACT]** No comparator data exists. Snapes-sourced benchmarks would not be credible to Woolworths. |
| **Notification / alerting engine** | **[CALC]** ~1 exception per month. Email and a weekly cadence are sufficient. Notifications on a low-event dataset train people to ignore them. |
| **Granular role-based permissions** | Two organisations, a handful of users. Four roles — Snapes ops, Snapes management, Woolworths user, admin — is sufficient. |
| **Multi-stage approval workflow** | One approval gate. **[FACT]** The existing process already stalls on a single reassignment (comment E51); more gates means more stalling. |
| **Real-time / live tracking** | Out of scope — that is a TMS. This is a performance record. |
| **A chart of any metric currently reading zero** | Six flat lines at zero is not information. |

---

# 33. Clarification Register

| # | Item | Status | Blocks |
|---|---|---|---|
| CR-1 | The agreed DIFOT target — 0.95, 0.98 and 0.99 all appear in the workbook | **Unresolved** | Every DIFOT display |
| CR-2 | Whether damages/issues/packaging/unauthorised returns were genuinely zero or never captured | **Unresolved** | Migration semantics; historical baselines |
| CR-3 | The agreed weekly submission deadline | **Unresolved** | On-time submission metric |
| CR-4 | Whether safety incident reporting was deliberately dropped in June 2020 | **Unresolved** | Whether to reinstate |
| CR-5 | Whether the four missing Dec/Jan weeks were shutdowns or missed submissions | **Unresolved** | Import treatment |
| CR-6 | Whether the 2023 collapse in outstanding invoices is real or definitional | **Unresolved** | Whether it is presentable as an achievement |
| CR-7 | Whether the two legacy operating notes (no shed storage; EPM/EL communication protocol) still apply | **Unresolved** | Operating-constraints reference |
| CR-8 | Whether the current sheet is fed by a form or typed directly | **Unresolved** | Cutover design |
| CR-9 | What is actually presented in the first-Monday meeting | **Unresolved** | Meeting Mode design |
| CR-10 | Whether pallets-per-consignment growth reflects a shift to project/rollout work | **Hypothesis** | Volume narrative |
| CR-11 | Whether the 12-month futile-delivery zero run is real | **Unresolved** | Metric credibility |
| CR-12 | Whether the triplicate week (30 May 2021) is a duplicate or three mis-dated weeks | **Unresolved** | Import |
| CR-13 | The definition of "unauthorised returns" | **Unresolved** | Whether to keep the field |
| CR-14 | Who is accountable for a 24hr collection notice miss | **Unresolved** | Accountability model |
| CR-15 | Whether Woolworths wants weekly visibility or prefers monthly | **Unresolved** | Publication cadence |

**Assumptions carried forward, all [ASSUME]:** the 3PL scope is Snapes Logistics VIC only; consignment and pallet counts originate from a Snapes TMS or manual dispatch record; outstanding invoice values originate from Snapes AR; Mark Milham is the primary Woolworths stakeholder and Furqan Fareed the primary Snapes respondent; the monthly meeting is attended by both operational and management representatives.

---

# 34. Questions for Woolworths

## Critical — before build

1. **What is the agreed DIFOT target?** **[FACT]** The workbook holds 0.95, 0.98 and 0.99 simultaneously, and the current sheet holds none. We will not display a target we cannot source. *(CR-1)*

2. **Is DIFOT calculated on consignment notes, with damaged/short deliveries deducted — as the legacy formula did — or on late deliveries only, as current practice does?** They give the same answer today only because damages are recorded as zero. *(CR-2)*
3. **We are reinstating capture of damages, wrong-location deliveries, missed collections and safety incidents. Our reported exception counts will rise. Do you want to agree how that transition is presented before it starts?** *(CR-2)* — **[INTERP]** the highest-trust question in this list.

4. **Would weekly visibility be useful, or does monthly suit your review rhythm?** Data is already captured weekly. *(CR-15)*
5. **Which measure best represents the value of this work to you — pallet spaces, consignments, or something not currently measured?** **[CALC]** Over the last 52 weeks consignments fell 38% while pallet spaces fell 15%. *(CR-10)*

6. **When a collection notice is given with less than 24 hours' warning, or an invoice sits beyond 30 days, is it useful for those to appear in the shared record?** Both are already in the workbook, both are Woolworths-side. *(CR-14)*
7. **Do you want the ability to raise an exception directly, rather than commenting on our submission?**

8. **What is the right escalation threshold — what makes an issue something your management should see?**

## Useful — future enhancement

9. Should performance be viewable by store or by programme/rollout? **[FACT]** Both are named in nearly every incident record.

10. Do the two legacy operating notes still apply? *(CR-7)*
11. Is there a Woolworths-side system that could exchange consignment or delivery data directly?

12. Are there upcoming programmes we should plan capacity around? **[CALC]** Oct–Nov is the demonstrable peak.
13. Are there measures Woolworths reports internally on Snapes that we do not see?

**Deliberately not asked:** anything answerable from the workbook — historical volumes, historical DIFOT, which weeks had late deliveries, what the current fields are.

---

# 35. Questions for Snapes

## Critical — before build

1. **Damages, delivery issues, packaging issues and unauthorised returns have been zero for 310 consecutive weeks, while the comment thread records breakdowns, refused pickups and wrong-address deliveries. Were these genuinely zero, or not captured?** *(CR-2)* — the answer changes the migration, the baselines, and the launch messaging.

2. **Who owns the weekly submission, and who is their backup?** **[FACT]** Comment E51 shows a request assigned to Jeffrey and reassigned to operations two months later.
3. **Who approves data before Woolworths sees it?**

4. **Where do consignment counts and pallet spaces come from — a TMS report, a dispatch sheet, or manual count?** *(CR-8)* Determines whether entry can be pre-populated.
5. **Where does the outstanding-invoice figure come from, and what changed in 2023?** **[CALC]** Weekly average fell from $170,779 (2022) to $291 (2025). *(CR-6)*

6. **Can Snapes reliably capture a site/store and a consignment reference on every exception?** **[FACT]** Woolworths already does, in their comments. This is required from MVP.
7. **Who owns an exception once raised, and who owns a corrective action?**

8. **Is Snapes willing to publish "not captured" for the 2020–2026 exception fields rather than "0"?** **[INTERP]** A commercial decision, not a technical one — and the most important trust decision in the project.

## Important — before go-live

9. Was safety incident reporting deliberately dropped in June 2020? *(CR-4)*

10. Is the 12-month futile-delivery zero run real? *(CR-11)*
11. What caused the April–May 2026 demurrage spike? **[CALC]** $3,488 across FY26 against $1,400 in the whole of FY25.

12. What drove the shift to fewer, larger consignments? *(CR-10)*
13. Should the platform ever cover other Snapes entities or clients? **[FACT]** The `3PL` column suggests it was designed for it.

14. Was the triplicate 30 May 2021 week a duplicate submission? *(CR-12)*
15. What was actually presented in past KPI meetings? *(CR-9)*

---

# 36. Phase 2 Readiness Checklist

Phase 2 (technical architecture and prototyping) should not begin until:

**Product decisions**

- ☐ MVP scope (§32) reviewed and approved by Snapes management
- ☐ The DIFOT demotion decision made — is Snapes willing to stop leading with 99.90%?
- ☐ The "not captured" vs "zero" decision made for the 2020–2026 exception fields
- ☐ The capture-gap disclosure agreed as a permanent product feature
- ☐ Hard cutover from Excel agreed, with a date

**Data decisions**

- ☐ DIFOT target confirmed with Woolworths, or explicitly deferred with "not yet agreed" accepted as the launch state
- ☐ Migration treatment agreed for the triplicate week, the four missing weeks, the Monday week, the 0.1-consignment row, and all blank fields
- ☐ Minimum volume floor for DIFOT display agreed
- ☐ Exception category list reviewed by both Snapes operations and Woolworths
- ☐ Cause category list reviewed and confirmed neutral in language

**Operational decisions**

- ☐ Weekly submission owner and backup named
- ☐ Approver named
- ☐ Weekly submission deadline agreed
- ☐ Exception and action ownership model agreed
- ☐ Source of every MVP field documented (system, report, or manual)

**Client engagement**

- ☐ Woolworths briefed on the platform's intent — shared record, not supplier report
- ☐ The "our exception numbers will rise" conversation held **before** launch
- ☐ Woolworths' ability to raise exceptions and comment agreed
- ☐ Publication cadence agreed (weekly or monthly)

**Explicitly not required before Phase 2:** technology stack, hosting, authentication design, database schema, visual design system, integrations. **[REC]** All are Phase 2 outputs, and none should influence the product decisions above.

---

# 37. Final Quality Test

| Test | Assessment |
|---|---|
| **Client value** — would Woolworths genuinely find this useful? | **Yes.** It answers the questions their own comments show they ask: what happened, where, what is being done. It also gives them something Excel never did — visibility of whether their issues get closed. |
| **Decision value** — does each major metric enable a decision? | **Yes, after the cull.** Every metric retained either changes a conversation or triggers an action. Metrics that did neither (packaging issues, unauthorised returns as counts) were removed or folded into the exception record. |
| **Operational value** — will Snapes identify problems earlier? | **Yes.** Internal weekly review before publication is new; today issues surface at the monthly meeting or in a client comment. |
| **Trust** — does the design make good *and* poor performance transparent? | **Yes, conditionally.** It depends entirely on the "not captured vs zero" decision. If Snapes publishes six years of zeros as zeros, this test fails. |
| **Growth** — can both organisations understand whether activity is growing? | **Yes, and more honestly than today.** The dual measure plus the ratio prevents both the "we halved" and the "we're fine" misreadings. |
| **Accountability** — can an exception be followed to resolution? | **Yes.** Exception → cause → action → owner → due date → completion → effectiveness → recurrence. |
| **Efficiency** — will this reduce monthly reporting work? | **Yes.** **[FACT]** There is no summary artefact in the workbook, so the monthly pack is built by hand each cycle. Meeting Mode removes that, and live action capture removes minutes. |
| **Simplicity** — can an executive understand quickly? | **Yes.** Four status lines and one attention band; six pages total. |
| **Data integrity** — can every displayed number be explained and reproduced? | **Yes for MVP metrics.** Not yet for damage rate or exception rate, which is why both launch as "not captured" / trend-only rather than with fabricated baselines. |

**[REC]** One component was revised as a direct result of this test: the **Continuous Improvement section is hidden from the client view until a first initiative exists** — it failed both the client-value and trust tests as an empty page.

---

# Recommended Decision Before Phase 2

## 1. What we recommend Snapes build

A **shared performance and accountability record** for the Woolworths relationship, whose centre is an **exception and corrective action register**, framed by a deliberately restrained performance and volume view, and used live in the monthly meeting.

Six pages, one submission form, one approval gate. Fifteen MVP features (§32.1). Nine years of history imported with its definition eras stamped and its gaps declared. Twenty-six Excel comments converted by hand into the platform's founding exception history.

The product's promise to Woolworths is not "here are our numbers". It is: **"when something goes wrong, we catch it, we record it, we own it, and we close it — and you can watch us do it."**

## 2. What we recommend Snapes NOT build

A dashboard version of the spreadsheet. AI summaries. Predictive analytics. A relationship score. Benchmarking. A notification engine. Granular permissions. Multi-stage approvals. Real-time tracking. Any chart of a metric that has read zero for six years.

**[CALC]** The evidence for each refusal is in the data: 33 exception events in six years is not a machine-learning dataset, and 92.6% of weeks reading exactly 100% is not a trend worth charting.

## 3. The most important product decision requiring approval

**Will Snapes present its own capture gap to Woolworths?**

**[CALC]** Four exception fields have recorded zero for 310 consecutive weeks. **[FACT]** The workbook's own comments — written by Woolworths — document incidents those fields should have caught. Snapes can migrate those zeros as zeros and ship a dashboard that says the operation has been flawless for six years. Or it can migrate them as *not captured*, disclose the gap on the Performance page, reinstate the capture, and warn Woolworths in advance that the numbers will get worse before they get better.

**[REC]** The second option. It is the only version of this platform that a client who has read their own comment thread will believe. It is also the only version that gives Snapes any headroom to demonstrate improvement — **[INTERP]** you cannot improve on 100%.

**This is a commercial decision, not a design one, and it must be made before anything is built.** Every other design choice follows from it.

## 4. The most important KPI/data questions requiring confirmation

1. **What is the agreed DIFOT target?** Three conflicting values exist; the current sheet has none. *(CR-1)*

2. **Were the four zero-forever fields genuinely zero, or never captured?** *(CR-2)*
3. **Is DIFOT calculated with damages deducted, or on lateness alone?** *(CR-2)*

4. **What changed in 2023 to collapse outstanding invoices from $170,779 to $291 per week?** *(CR-6)*
5. **Can Snapes capture site and consignment reference on every exception?** Woolworths already does.

## 5. Is the available data sufficient to proceed to Phase 2?

**Yes, with two qualifications.**

**Sufficient:** **[CALC]** 465 weeks of continuous history across two eras with a clean, verified two-week join. Volume, service, cost and finance measures all present. A complete data-quality register. Six years of comment evidence establishing the real exception taxonomy, the real stakeholders, and the real failure modes. That is more than enough to design and build the MVP.

**Qualification 1 — the exception dataset is effectively empty.** Historical exception *rates* cannot be baselined, so no exception-rate target can be set at launch. **[REC]** Launch with trend-only display and baseline over two quarters.

**Qualification 2 — CR-1 and CR-2 are blocking for display, not for build.** The platform can be designed and built without them; it cannot honestly *display* DIFOT against a target, or a historical exception baseline, until both are answered. **[REC]** Proceed to Phase 2 in parallel with asking Woolworths.

## 6. What Phase 2 should accomplish

1. **Confirm the eight critical Snapes questions and the eight critical Woolworths questions** (§34–35). Everything else waits on these.

2. **Design the data model** — weekly submission, exception, action, initiative, definition, amendment log — with the definition-era stamp and null-vs-zero distinction built in at the foundation, not bolted on.
3. **Specify the migration** in executable detail, with a reconciliation report agreed before any import runs.

4. **Prototype three screens only** — Executive Overview, Exceptions & Actions, Weekly Entry — and test them with the actual users: the Snapes person who submits, the Snapes manager who approves, and the Woolworths operational stakeholder.
5. **Resolve the target question** with Woolworths and encode it, with its source and agreement date, in the KPI definition.

6. **Define the cutover** — go-live date, archive of the workbook, first published period, first Meeting Mode session.
7. **Do not** select a technology stack before steps 1–4 are complete.

---

**End of Phase 1 Product Discovery & KPI Intelligence Report.**

**Awaiting review and approval before technical architecture and development begin.** No application code, database schema, component, or infrastructure has been created.
