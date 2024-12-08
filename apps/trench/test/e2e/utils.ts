import { v4 as uuidv4 } from 'uuid'
import * as request from 'supertest'

export const API_ROOT = 'http://127.0.0.1:4000'

export const PRIVATE_API_KEY = 'private-d613be4e-di03-4b02-9058-70aa4j04ff28'
export const PUBLIC_API_KEY = 'public-d613be4e-di03-4b02-9058-70aa4j04ff28'

export function authenticatedGet(path: string, apiKey?: string) {
  return request(API_ROOT)
    .get(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (apiKey ?? PRIVATE_API_KEY))
}

export function authenticatedPost(path: string, apiKey?: string) {
  return request(API_ROOT)
    .post(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (apiKey ?? PRIVATE_API_KEY))
}

export function authenticatedPut(path: string, apiKey?: string) {
  return request(API_ROOT)
    .put(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (apiKey ?? PRIVATE_API_KEY))
}

export function authenticatedDelete(path: string, apiKey?: string) {
  return request(API_ROOT)
    .delete(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Authorization', 'Bearer ' + (apiKey ?? PRIVATE_API_KEY))
}

export function getRandomID(): string {
  return uuidv4()
}

export async function waitForQueryResults(query: string, privateApiKey?: string) {
  const pollInterval = 100 // 100 ms
  const maxWaitTime = 10000 // 10 seconds
  const startTime = Date.now()

  while (true) {
    const res = await authenticatedGet(`/events?${query}`, privateApiKey)
    if (res.body.results && res.body.results.length > 0) {
      return res.body
    }
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error(`Timeout: No results found within ${maxWaitTime / 1000} seconds`)
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }
}
