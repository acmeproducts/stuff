# Market Navigator reusable chart API

The reusable component is `market-navigator-rebuild-chart.js`. It contains the qualified Turn 28 painter, controls, generated view and scoped CSS. It can mount into an empty Element without loading the Market Navigator application or creating NOW/Analyze navigation.

```js
const chart = MNChart.mount(document.querySelector('#chart'), {
  view: 'series',
  anchor: 'qqq',
  series: ['qqq', 'wti'],
  horizon: '1YR',
  display: 'horizon',
  canvas: { width: 612, height: 280, pixelRatio: 'auto' }
}, {
  metadata: qualifiedMetadata,
  getSeries: id => qualifiedCollection.getSeries(id)
});
await chart.whenReady();
await chart.configure({ horizon: '5D', display: 'fixed' });
await chart.resize({ width: 740, height: 310, pixelRatio: 2 });
const state = chart.getSnapshot();
chart.setVisible(false);
chart.setVisible(true);
chart.destroy();
```

`metadata` supplies an immutable admitted collection: `derived`, `def`, `health`, `catalog` and `sourceRegistry`. `getSeries(id)` supplies canonical native observations from that same collection. The component clones and freezes metadata/native results; every instance owns its selected series, horizon, display, axes, controls, inspection, paint and event lifecycle. The backend publisher is responsible for collection validation/recovery before admission; a chart never fabricates missing observations.

Public options:

| Option | Meaning |
| --- | --- |
| `view` | `overview` (the three governed indices), `index`, or `series` |
| `anchor` | Initial root series/index; must occur in an explicit series list |
| `series` | Unique known IDs in exact display order; the first becomes anchor when none is supplied |
| `horizon` | `1D`, `5D`, `MTD`, `YTD`, `1YR`, `3YR`, `5YR` |
| `display` | `fixed` or `horizon`, using actual canonical reference values |
| `representation` | `indexed`, `dual`, or `native`; a common native axis requires compatible measurements |
| `axes` | `auto`, or explicit left/right series assignments, `indexed`/`native` scale, optional label and paired finite min/max bounds |
| `canvas` | Width/height in CSS pixels or `auto`; backing resolution uses explicit pixelRatio or device ratio |
| `controls` | `full` or `none` for a generated view |
| `activeSeries`, `emphasis` | Selection/emphasis within this chart |
| `expandedComponents`, `hiddenComponents` | Index-component presentation |
| `comparisonSeries`, `addCategory` | Preserve comparison membership and Add category when restoring a chart |
| `clockIndex` | Governed index defining the requested canonical horizon window |

For example, the same object draws governed indices on the left and QQQ's actual native USD values on the right:

```js
axes: {
  left: { series: ['risk', 'growth'], scale: 'indexed', min: 90, max: 110 },
  right: { series: ['qqq'], scale: 'native', label: 'QQQ USD' }
}
```

`getOptions()` and `getSnapshot()` return detached copies. `configure()` and `resize()` return readiness promises. Invalid option patches reject before changing state. Failed data-service requests reject `whenReady()` and can be retried with `configure({})`. Destroy aborts ownership, disconnects observers, cancels timers/frames, clears handlers and removes a generated surface. It preserves application-owned NOW/Analyze markup. The legacy `getState()`/`update()` inspection adapter remains for existing recovery diagnostics; new consumers use the public contract above.

Optional services supply `window(horizon, clockIndex)`, `available(id, horizon, clockIndex)`, `colors(ids)`, `style(id)`, `paletteName()`, `onInfo(snapshot, button)`, `onAction(action, snapshot, canvas)`, `actions`, `onChange({options, snapshot})` and `onError(error)`. Without action callbacks the corresponding controls are hidden. Metadata contains no mutable chart state. Existing application services preserve canonical data, configured styles, AI and exports.

NOW and Analyze mount through public options/configuration. Analyze's session policy remains in application navigation: normal NOW creates, Library parks, NOW restores, and X destroys. A generated custom display has no Analyze creation control.

Review the three independent custom displays at `http://127.0.0.1:8785/market-navigator-rebuild-custom.html`. The demonstration uses the same qualification broker, pins all charts to one admitted generation and resizes explicit canvases for the available container width.

Qualification includes Chrome/Edge standalone execution with no application globals, exact CSS/backing canvas dimensions, independently verified native/indexed values and explicit-axis plotted coordinates, low-frequency source dates, snapshot isolation, overview restoration, asynchronous failure/retry, 25 destroy/remount cycles, and a third instance beside NOW/Analyze without changing either session. Physical Windows 11/Android and owner AI-prose acceptance remain separate.
