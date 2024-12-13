import { ApiProperty } from '@nestjs/swagger'
import { PaginatedResponse } from 'src/common/models'

export class QueriesDTO {
  @ApiProperty({
    type: [String],
    description: 'The queries to execute.',
    example: ['SELECT COUNT(*) FROM events WHERE event = "UserSignedUp"'],
  })
  queries: string[]
}

export class PaginatedQueryResponse extends PaginatedResponse<any> {
  @ApiProperty({
    type: [Object],
    description: 'The results of the queries, returned in the same order as the queries.',
    example: [
      {
        results: [{ count: 3485241 }],
      },
    ],
  })
  results: any[]
}
