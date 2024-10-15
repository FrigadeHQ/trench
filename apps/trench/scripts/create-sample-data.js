const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const crypto = require('crypto')

// Configuration
const TOTAL_CALLS = 5000000 // Total number of calls to make
const PARALLEL_THREADS = 10 // Number of parallel threads
const CALLS_PER_THREAD = Math.ceil(TOTAL_CALLS / PARALLEL_THREADS)
const API_URL = 'http://localhost:4001/events'
const COUNTRIES = [
  'Denmark',
  'USA',
  'Canada',
  'Germany',
  'France',
  'India',
  'Australia',
  'Spain',
  'Brazil',
  'Mexico',
  'Japan',
  'South Korea',
  'Italy',
  'South Africa',
  'Sweden',
  'Norway',
  'Finland',
  'Netherlands',
  'New Zealand',
]
const EVENTS = [
  'ConnectedAccount',
  'LoggedIn',
  'ViewedPage',
  'PurchasedItem',
  'ClickedButton',
  'SignedUp',
  'AddedToCart',
  'Searched',
  'UpdatedProfile',
  'LoggedOut',
]

// Function to generate random data
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)]
const getRandomString = (length) => crypto.randomBytes(length).toString('hex')

// Function to make the API call
async function makeApiCall() {
  try {
    const userId = getRandomString(5)
    const country = getRandomItem(COUNTRIES)
    const event = getRandomItem(EVENTS)

    const data = {
      events: [
        {
          userId,
          event,
          properties: {
            totalAccounts: Math.floor(Math.random() * 10) + 1,
            country,
          },
          type: 'track',
        },
      ],
    }

    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Error making API call:', error.message)
  }
}

// Worker function
async function workerFunction(calls) {
  for (let i = 0; i < calls; i++) {
    await makeApiCall()
  }
  parentPort.postMessage(`Worker completed ${calls} calls`)
}

// Main thread logic
if (isMainThread) {
  const startTime = Date.now()
  console.log(`Start time: ${new Date(startTime).toISOString()}`)

  let completedCalls = 0

  for (let i = 0; i < PARALLEL_THREADS; i++) {
    const worker = new Worker(__filename, {
      workerData: CALLS_PER_THREAD,
    })

    worker.on('message', (msg) => {
      console.log(msg)
      completedCalls += CALLS_PER_THREAD
      if (completedCalls === TOTAL_CALLS) {
        const endTime = Date.now()
        console.log(`End time: ${new Date(endTime).toISOString()}`)
        const durationInSeconds = (endTime - startTime) / 1000
        const averageQPS = TOTAL_CALLS / durationInSeconds
        console.log(`Average QPS: ${averageQPS.toFixed(2)}`)
        console.log(`Total time: ${durationInSeconds} seconds`)
        console.log(`Total records inserted: ${TOTAL_CALLS}`)
      }
    })

    worker.on('error', (err) => {
      console.error(`Worker error: ${err}`)
    })
  }
} else {
  workerFunction(workerData)
}
