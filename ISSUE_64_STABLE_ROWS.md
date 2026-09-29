# Experimental stable rows for upstream issue #64

This branch preserves the tested row-recycling workaround for [chuunibian/delta#64](https://github.com/chuunibian/delta/issues/64). It is an experimental branch, not a proposed pull request.

Delta uses React Arborist's default container, which renders a `react-window` list keyed by node ID. As the viewport moves, that list replaces row elements. In the full-screen Linux WebKitGTK 2.52.6 test, the replacements coincided with recurring frame gaps of roughly 280–301 ms.

The Vite hook on this branch substitutes a bounded list adapter for Arborist's internal `react-window` import. The adapter keeps row slots mounted as their item indices change. It updates their positions synchronously on scroll so large scrollbar jumps do not leave blank frames. The tree row also delays its hover-path update until scrolling settles, since updating the header on every recycled node caused the long frame gaps to return.

In the earlier diagnostic worktree, the full-screen `/tmp` scan kept 114 styled tree rows mounted. A 30-step wheel replay had no frame gap over 33 ms (maximum 24 ms). Subsequent synchronous-scroll drag probes had no sampled blank frames or gaps over 33 ms. Expansion, selection, basic keyboard navigation, and drag event delivery were checked there. This extracted branch passes `npm run build`, but has not received a new interactive scroll test.

The Vite hook depends on Arborist's private `default-container.js` import and may break with a dependency update. The adapter also needs wider validation for nested trees, resizing, focus, selection, keyboard navigation, and drag/drop before it could be considered for a PR. The separate touchpad momentum setting is in [PR #65](https://github.com/chuunibian/delta/pull/65); this branch does not include it.
