export class PaginatedResponse<T> {
  results: T[]
  next: string | null
  previous: string | null
}
