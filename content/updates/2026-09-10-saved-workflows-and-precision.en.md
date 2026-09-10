---
id: 2026-09-10-saved-workflows-and-precision
publishedAt: 2026-09-10
locale: en
author: LiqGuard Team
release: v0.3.0-beta
type: Improvement
title: Expanded saved calculations and records, with more precise rate inputs
description: Cloud number sets, record exports, and Pro checkout improvements, alongside more precise margin rates and clearer current-price guidance.
---
This post brings together the changes since the August 16 update. We expanded the tools for saving calculations, returning to them later, and organizing simulated orders and account records. We also fixed margin rates being rounded when an input was confirmed.

## Save calculations and pick up where you left off

Sign-in, My Page, and cloud number sets are now connected to the public calculator. A number set keeps a group of calculator inputs together. You can choose local or cloud storage, rename saved sets, and switch between them. Cloud values can be loaded in another browser using the same account.

- A named active number set appears at the top of the input panel.
- You can copy calculation values between sets and keep notes for each set.
- Pausing saving and deleting a number set are separate actions. Deletion confirmation explains whether linked records will also be removed.

## Review and export order and account records

Signed-in users can review simulated order records and account snapshots in the records view. Filter by number set and date range, then export the records you need as CSV or Excel files. Export column headings can be in Korean or English.

We arranged records and notes so they can be reviewed together, and made saved times and number sets clearer in the recent records on My Page. Daily recording can also be managed per number set. See [Pricing](/en/pricing) for plan-specific storage limits and automatic recording availability.

## A clearer path from sign-in to Pro

We connected Pro subscription checkout and subscription management through Paddle. Choosing Pro while signed out now opens sign-in first, so your account is connected before checkout begins. We also strengthened how subscription status is updated after payment.

## Keep the margin rate you entered

Maintenance and initial margin rates are no longer rounded to three decimal places. Entering `0.4995` keeps that value after pressing Enter or leaving the field, and after saving and loading it again. Small rates such as `0.0000001` are also displayed as ordinary decimals.

This fix applies to the value used in calculations as well as the input display. A value previously rounded and saved as `0.5` cannot recover its original digits automatically. Re-enter the precise rate if needed.

## Clearer current-price guidance and result labels

We replaced outdated scenario-price instructions with guidance that matches the current behavior. Once the account is set up, update Current price when only the market price has changed. Press Enter or click outside the field to reflect the price-change P&L in account equity.

The displayed notional value is based on entry price, with clearer explanations of how margin and leverage use current price. We also removed automatic index-futures unit conversion inferred solely from the size of an input. English formula terminology and the layout of longer button labels were refined.

## A cleaner calculator screen

We removed fixed developer controls for language and instrument selection, a duplicate mobile introduction, and an unnecessary storage notice on the feedback board. Language links remain in the page footer. The test-account reset feature was also removed from My Page.
