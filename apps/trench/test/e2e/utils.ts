import { v4 as uuidv4 } from 'uuid'
import * as request from 'supertest'

export const API_ROOT = 'https://127.0.0.1:4001'

const PRIVATE_API_KEY = 'private-d613be4e-di03-4b02-9058-70aa4j04ff28'
const PUBLIC_API_KEY = 'public-d613be4e-di03-4b02-9058-70aa4j04ff28'

export function authenticatedGet(path: string, isPrivate: boolean = true) {
  return request(API_ROOT)
    .get(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (isPrivate ? PRIVATE_API_KEY : PUBLIC_API_KEY))
}

export function authenticatedPost(path: string, isPrivate: boolean = true) {
  return request(API_ROOT)
    .post(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (isPrivate ? PRIVATE_API_KEY : PUBLIC_API_KEY))
}

export function authenticatedPut(path: string, isPrivate: boolean = true) {
  return request(API_ROOT)
    .put(path)
    .trustLocalhost()
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + (isPrivate ? PRIVATE_API_KEY : PUBLIC_API_KEY))
}

export function getRandomID(): string {
  return uuidv4()
}
