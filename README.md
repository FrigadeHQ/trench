<br />
<div align="center">
  <a href="https://trench.dev?utm_source=github" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/img/trench-dark.png">
    <img alt="Trench Logo" src="/img/trench-light.png" width="220"/>
  </picture>
  </a>
</div>

<br/>

<h1 align="center">Open-Source Event Tracking Infrastructure</h1>

  <p align="center">
    <br />
    <a href="https://docs.trench.dev" rel="dofollow"><strong>Documentation</strong></a> · 
   <a href="https://docs.trench.dev" rel="dofollow"><strong>Website</strong></a> · 
   <a href="https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A"><strong>Join Our Slack</strong></a>
    <br/>
    <br/>
  </p>

## 🌊 What is Trench?

Trench is an event tracking system built on top of Apache Kafka and Clickhouse. It can handle large event volumes and provides real-time analytics. Our team built Trench to scale up the real-time event tracking pipeline at <a href="https://frigade.com?utm_source=github-trench-readme" target="_blank">Frigade</a>.

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/img/trench-cover.png">
    <img src="/img/trench-cover.png" width="100%" alt="Trench Code Snippet" />
  </picture>

## ⭐ Features

- 🤝 Compliant with the Segment API (Track, Group, Idenfity)
- 🐳 Deploy quickly with a single production-ready Docker image
- 💻 Process thousands of events per second on a single node
- ⚡ Query data in real-time
- 🔗 Connect data to other destinations with webhooks
- 👥 Open-source and MIT Licensed


## 🚀 Quickstart

Trench has two methods of deployment:

1. **Trench Self-Hosted**: An open-source version that allows you to deploy and manage Trench on your own infrastructure.
2. **Trench Cloud**: A fully-managed serverless solution with zero ops, autoscaling, 99.99% SLAs.

### 1. Trench Self-Hosted

Follow our self-hosting instructions below and in our [quickstart guide](https://docs.trench.dev/quickstart) to begin using Trench Self-Hosted.

If you have questions or need assistance, you can join our [Slack group](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A) for support.

#### Quickstart

First, install and start the server by running the following command:

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

### 2. Trench Cloud

Request access to Trench Cloud from our [website](https://trench.dev) to get started with the fully-managed version of Trench.


## 🔗 Links

- [Website](https://trench.dev?utm_campaign=github-readme)
- [Documentation](https://docs.trench.dev/)
- [Slack community](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A)

## 📚 Authors

Trench is a project built by [Frigade](https://frigade.com).


## 📄 License

MIT License

