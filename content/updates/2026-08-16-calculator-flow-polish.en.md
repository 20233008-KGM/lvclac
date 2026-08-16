---
id: 2026-08-16-calculator-flow-polish
publishedAt: 2026-08-16
locale: en
author: LiqGuard Team
release: v0.2.0-beta
type: Improvement
title: Polished the calculation flow and input guidance
description: Reduced small points of friction across the first-visit flow, narrow-screen inputs, and order-preview history.
---
This release focuses on the small points of friction that can appear while entering and reviewing a calculation, rather than changing the result or formula. We reviewed the flow for first-time visitors, narrower screens, and users comparing several order scenarios.

## What changed in this release

### See the calculator first on a new visit

The calculator is visible immediately on a first visit instead of being covered by guidance. You can start with the values you have, then reopen the step-by-step guidance whenever it is useful.

### More reliable margin inputs on narrow screens

We adjusted the layout so margin inputs do not shift sideways or overflow on narrower screens. Fixed-margin inputs now follow the same stable layout.

### Clearer guidance and order-preview behavior

Guidance around input fields no longer appears on top of other guidance. Order previews remain temporary calculations: canceling one leaves no activity entry behind, so history shows confirmed orders only.

### Clearer supported-futures scope and examples

We refined the supported-futures scope and the wording of margin and contract examples to match the current public calculator. Actual margin, contract multiplier, and trading-unit conditions can vary by instrument and provider, so check the latest terms from the relevant exchange, broker, or securities firm before placing an order.

## No impact on calculation results

Liquidation, margin, and leverage formulas are unchanged, as is existing saved data. This release improves only the experience of starting a calculation, entering values, and reviewing order scenarios.
