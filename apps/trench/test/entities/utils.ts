import { v4 as uuidv4 } from 'uuid'
import * as request from 'supertest'

export const API_ROOT = 'https://127.0.0.1:4001'

const PRIVATE_API_KEY = 'private-0a8a9885-5691-41d3-aa30-f7bc673d8bc7'

export function authenticatedGet(path: string) {
  return request(API_ROOT)
    .get(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + PRIVATE_API_KEY)
}

export function authenticatedPost(path: string) {
  return request(API_ROOT)
    .post(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + PRIVATE_API_KEY)
}

export function authenticatedPut(path: string) {
  return request(API_ROOT)
    .put(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + PRIVATE_API_KEY)
}

export function getRandomID(): string {
  return uuidv4()
}
