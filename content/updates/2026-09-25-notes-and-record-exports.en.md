---
id: 2026-09-25-notes-and-record-exports
publishedAt: 2026-09-25
locale: en
author: LiqGuard Team
release: 0.3.1
type: Improvement
title: Write longer notes and export clearer records
description: More room for Pro notes, clearer saving feedback, and CSV and Excel exports that match the calculator display.
---
We made it easier to manage notes alongside your calculations and review saved records outside the calculator.

## More room for Pro notes

Pro has no length limit for ordinary personal note writing. Keep the reasoning behind your calculations and things to check alongside number sets, order records, and account snapshots. Free supports up to 1,000 characters per note.

Existing longer notes are preserved. After switching to Free, you can still read them and make edits that do not increase their length.

You can paste up to 50,000 characters at a time. Excessive save requests or automated bulk input may be limited. See [Pricing](/en/pricing) for plan details.

## Clearer note-saving feedback

Changes are saved in sequence when you keep typing before an earlier save finishes. If saving fails, a message and a **Retry save** button appear.

If another window has changed the same note, a conflict message explains what happened. Copy your current text somewhere safe, then reopen the note.

## Cleaner CSV and Excel exports

We removed record IDs, account slot IDs, snapshot titles, automatic snapshot local dates, and an internal calculation-type column from exports. Account slot names, saved times, notes, and calculation values remain available.

Numbers now follow the calculator's display rules.

- Amounts, prices, and contract counts are rounded to whole numbers.
- Leverage and contract multipliers use up to two decimal places, without unnecessary trailing zeros.
- Margin rates retain the precision entered.
- Liquidation buffers reflect the long or short direction. The buffer rate is left blank once the liquidation price has been reached or passed.

These changes affect export presentation only. Stored source values and values used for calculations are unchanged. Calculation values remain numeric cells in Excel, so you can sort them or use them in further calculations.

## Small interface improvements

We refined the placement of the privacy details button, the fonts used for subscription status and annual savings badges, and the alignment of note icons.
