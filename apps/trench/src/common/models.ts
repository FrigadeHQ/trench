import { ApiProperty } from '@nestjs/swagger'

export class PaginatedResponse<T> {
  results: T[]
  @ApiProperty({
    type: Number,
    description: 'The limit of the pagination.',
    nullable: true,
  })
  limit: number | null
  @ApiProperty({
    type: Number,
    description: 'The offset of the pagination.',
    nullable: true,
  })
  offset: number | null
  @ApiProperty({
    type: Number,
    description: 'The total number of results. If `null`, the total is unknown.',
    nullable: true,
  })
  total: number | null
}
