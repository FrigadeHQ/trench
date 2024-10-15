<img src="/img/trench-cover.png" width="100%" alt="Trench Code Snuppet" />

<div align="center"><strong>Trench</strong></div>
<div align="center">Open source infrastructure for tracking events.<br />Built with Kafka and Clickhouse for highly available and scalable tracking and analytics.</div>
<br />
<div align="center">
<a href="https://trench.dev">Website</a> 
<span> · </span>
<a href="https://github.com/FrigadeHQ/trench">GitHub</a> 
<span> · </span>
<a href="">Community</a>
<span> · </span>
<a href="https://docs.trench.dev">Docs</a></div>

## Introduction

Trench is a powerful event tracking system built with Kafka and Clickhouse. It's designed to handle event volumes at scale and provide real-time analytics.

## Quickstart

To install and start the server, simply run the following command:

```bash
git clone git@github.com:FrigadeHQ/trench.git && cd trench/apps/trench && cp .env.example .env && docker-compose up --build --force-recreate --renew-anon-volumes -d
```

This will start the server on port 4000. You can now send your first event:

```bash
curl -i -X POST \
   -H "Authorization:Bearer my-public-api-key" \
   -H "Content-Type:application/json" \
   -d \
'{
  "events": [
    {
      "userId": "abc123",
      "event": "ConnectedAccount",
      "properties": {
        "totalAccounts": 4,
        "country": "Denmark"
      },
      "type": "track"
    }]
}' \
 'http://localhost:4000/events'
```

Now, you can query the data using SQL over HTTP (make sure to use your private API key):

```bash
curl -i -X POST \
   -H "Authorization:Bearer my-private-api-key" \
   -H "Content-Type:application/json" \
   -d \
'{
  "queries": [
  	"SELECT COUNT(*) as totalRows FROM events"
  ]
}' \
 'http://localhost:4000/queries'
```

This will example will return the total number of events in the system:

```json
{
  "results": [
    {
      "totalRows": 1
    }
  ]
}
```

## Documentation and going further

Trench can do a lot more than this. Check out the [docs](https://docs.trench.dev) to learn more.

## Authors

Trench is a project built by [Frigade](https://frigade.com).

## License

MIT License
