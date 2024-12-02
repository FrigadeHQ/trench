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

<h1 align="center">Open-Source Analytics Infrastructure</h1>

  <p align="center">
    <br />
    <a href="https://docs.trench.dev" rel="dofollow"><strong>Documentation</strong></a> · 
   <a href="https://trench.dev" rel="dofollow"><strong>Website</strong></a> · 
   <a href="https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A"><strong>Slack Community</strong></a> · 
    <a href="https://demo.trench.dev"><strong>Demo</strong></a>
    <br/>
    <br/>
  </p>

## 🌊 What is Trench?

Trench is an event tracking system built on top of Apache Kafka and ClickHouse. It can handle large event volumes and provides real-time analytics. Trench is no-cookie, GDPR, and PECR compliant. Users have full control to access, rectify, or delete their data.

Our team built Trench to scale up the real-time event tracking pipeline at <a href="https://frigade.com?utm_source=github-trench-readme" target="_blank">Frigade</a>.

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="/img/trench-cover.png">
    <img src="/img/trench-cover.png" width="100%" alt="Trench Code Snippet" />
  </picture>

## ⭐ Features

- 🤝 Compliant with the Segment API (Track, Group, Identify)
- 🐳 Deploy quickly with a single production-ready Docker image
- 💻 Process thousands of events per second on a single node
- ⚡ Query data in real-time
- 🔗 Connect data to other destinations with webhooks
- 👥 Open-source and MIT Licensed

## 🖥️ Demo

**Live demo:**
[https://demo.trench.dev](https://demo.trench.dev)

**Video demo:**

Watch the following demo to see how you can build a basic version of Google Analytics using Trench and Grafana.

https://github.com/user-attachments/assets/e3f64590-6e7e-41b9-b425-7adb5a1e19b1

## 🚀 Quickstart

Trench has two methods of deployment:

1. **Trench Self-Hosted**: An open-source version to deploy and manage Trench on your own infrastructure.
2. **Trench Cloud**: A fully-managed serverless solution with zero ops, autoscaling, and 99.99% SLAs.

### 1. Trench Self-Hosted 💻

Follow our self-hosting instructions below and in our [quickstart guide](https://docs.trench.dev/quickstart) to begin using Trench Self-Hosted.

If you have questions or need assistance, you can join our [Slack group](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A) for support.

#### Quickstart

1. **Deploy Trench Dev Server**:
   The only prerequisite for Trench is a system that has Docker and Docker Compose installed [see installation guide](https://docs.docker.com/compose/install/). We recommend having at least 4GB of RAM and 4 CPU cores for optimal performance if you're running a production environment.

   After installing Docker, you can start the local development server by running the following commands:

   ```sh
   git clone https://github.com/frigadehq/trench.git
   cd trench/apps/trench
   cp .env.example .env
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate --renew-anon-volumes
   ```

   The above command will start the Trench server that includes a local ClickHouse and Kafka instance on `http://localhost:4000`. You can open this URL in your browser and you should see the message `Trench server is running`. You shouldupdate the `.env` file to change any of the configuration options.

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
    'http://localhost:4000/events'
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
     "queries": [
       "SELECT COUNT(*) FROM events WHERE userId = '550e8400-e29b-41d4-a716-446655440000'"
     ]
   }' \
    'http://localhost:4000/queries'
   ```

   Sample query result:

   ```json
   {
     "results": [
       {
         "count": 5
       }
     ],
     "limit": 0,
     "offset": 0,
     "total": 1
   }
   ```

### 2. Trench Cloud ☁️

If you don't want to selfhost, you can get started with Trench in a few minutes via:
* our [Cloud web interface](app.trench.dev/sign-up)
* our [Cloud quickstart guide](https://docs.trench.dev/cloud-quickstart)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/img/trench-dashboard-dark.png">
  <img src="/img/trench-dashboard.png" width="100%" alt="Trench Code Snippet" />
</picture>

## 🔗 Links

- [Website](https://trench.dev?utm_campaign=github-readme)
- [Documentation](https://docs.trench.dev/)
- [Slack community](https://join.slack.com/t/trench-community/shared_invite/zt-2sjet5kh2-v31As3yC_zRIadk_AGn~3A)

## 📚 Authors

Trench is a project built by [Frigade](https://frigade.com).

## 📄 License

MIT License
