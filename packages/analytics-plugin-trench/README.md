# analytics-plugin-trench

A plugin for [analytics.js](https://github.com/DavidWells/analytics) that sends events to [Trench](https://github.com/frigadehq/trench).

## Installation

1. `npm i analytics-plugin-trench`
2. In `analytics` init, add Trench in the plugins array. Example config:

```ts
import analytics from 'analytics';
import trench from 'analytics-plugin-trench';

analytics({
  plugins: [trench()],
});
```
