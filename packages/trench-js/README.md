# trench-js

A JavaScript library for tracking events and page views to Trench.

## Installation

```bash
npm install trench-js
```

## Usage

```javascript
import Trench from 'trench-js';

const trench = new Trench({
  publicApiKey: 'YOUR_PUBLIC_API_KEY',
  server: 'your-trench-server.com',
});
```

```javascript
trench.track('page_view', {
  url: 'https://example.com',
});
```
