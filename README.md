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

<h1 align="center">Open-Source Infrastructure for Tracking Events</h1>

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

1. **Trench Self-Hosted**: An open-source version to deploy and manage Trench on your own infrastructure.
2. **Trench Cloud**: A fully-managed serverless solution with zero ops, autoscaling, 99.99% SLAs.

### 1. Trench Self-Hosted

Follow our self-hosting instructions below and in our [quickstart guide](https://docs.trench.dev/quickstart) to begin using Trench Self-Hosted.

If you have questions or need assistance, you can join our [Slack group](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A) for support.

#### Quickstart

1. **Deploy Trench**:
   The only prerequisite for Trench is a system that has Docker and Docker Compose installed [see installation guide](https://docs.docker.com/compose/install/). We recommend having at least 4GB of RAM and 4 CPU cores for optimal performance if you're running a production environment.

   After installing Docker, you can start the local development server by running the following commands:

   ```sh
   git clone https://github.com/frigadehq/trench.git
   cd trench
   pnpm install
   cd apps/trench
   cp .env.example .env
   pnpm install
   pnpm dev
   ```

   The above command will start the Trench server that includes a local Clickhouse and Kafka instance on `http://localhost:4000`. You can update the `.env` to change any of the configuration options.

2. **Send a sample event**:
   You can find and update the default public and private API key in the `.env` file. Using your public API key, you can send a sample event to Trench as such:

   ```sh
   curl -i -X POST \
      -H "Authorization:Bearer public-d613be4e-di03-4b02-9058-70aa4j04ff28" \
      -H "Content-Type:application/json" \
      -d \
   '{
     "events": [
       {
         "userId": "550e8400-e29b-41d4-a716-446655440000",
         "type": "track",
         "event": "ConnectedAccount",
         "properties": {
           "totalAccounts": 4,
           "country": "Denmark"
         },
       }]
   }' \
    'https://sandbox.trench.dev/events'
   ```

3. **Querying events**:
   You can query events using the `/events` endpoint (see [API reference](https://docs.trench.dev/api-reference/events-get) for more details).

   You can also query events directly from your local Trench server. For example, to query events of type `ConnectedAccount`, you can use the following URL:

   ```sh
   curl -i -X GET \
      -H "Authorization: Bearer private-d613be4e-di03-4b02-9058-70aa4j04ff28" \
      'http://localhost:4000/events?event=ConnectedAccount'
   ```

   This will return a JSON response with the event that was just sent:

   ```json
   {
     "results": [
       {
         "uuid": "25f7c712-dd86-4db0-89a8-d07d11b73e57",
         "type": "track",
         "event": "ConnectedAccount",
         "userId": "550e8400-e29b-41d4-a716-446655440000",
         "properties": {
           "totalAccounts": 4,
           "country": "Denmark"
         },
         "timestamp": "2024-10-22T19:34:56.000Z",
         "parsedAt": "2024-10-22T19:34:59.530Z"
       }
     ],
     "limit": 1000,
     "offset": 0,
     "total": 1
   }
   ```

4. **Execute raw SQL queries**:
   Use the queries endpoint to analyze your data. Example:

   ```sh
   curl -i -X POST \
      -H "Authorization:Bearer public-d613be4e-di03-4b02-9058-70aa4j04ff28" \
      -H "Content-Type:application/json" \
      -d \
   '{
     "query": "SELECT COUNT(*) FROM events WHERE userId = '550e8400-e29b-41d4-a716-446655440000'"
   }' \
    'http://localhost:4000/queries'
   ```

   Sample query result:

   ```json
   {
     "count": 5
   }
   ```

## Demo

In the Demo below, we show you how to build a mini version of Google Analytics using Trench and Grafana

https://github.com/user-attachments/assets/e3f64590-6e7e-41b9-b425-7adb5a1e19b1

## Trench Cloud

Request access to Trench Cloud from [our website](https://trench.dev?utm_campaign=github-readme) to get started with the fully-managed version of Trench.

## 🔗 Links

- [Website](https://trench.dev?utm_campaign=github-readme)
- [Documentation](https://docs.trench.dev/)
- [Slack community](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A)

## 📚 Authors

Trench is a project built by [Frigade](https://frigade.com).

## 📄 License

MIT License
