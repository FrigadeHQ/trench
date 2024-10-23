# analytics-plugin-trench

## Important note for the initial release

If your project is using Typescript, you'll get an error when trying to use custom methods defined in this plugin: `Property 'trench' does not exist on type 'Plugins'`.
Custom methods are working fine, base library needs a change in typing for the `plugins` array.  
You can track the issue [HERE](https://github.com/DavidWells/analytics/issues/266).

## What's that

This is a small plugin for [DavidWells/analytics](https://github.com/DavidWells/analytics) library. It handles all basic `analytics` library methods (`initialize`, `page`, `track`, `identify`, `group`, and `loaded`).

## Installation

1. `npm i analytics-plugin-trench`
2. In `analytics` init, add Trench in the plugins array. Example config:
