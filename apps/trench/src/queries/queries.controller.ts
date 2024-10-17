import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common'
import { QueriesService } from './queries.service'
import { PaginatedQueryResponse, QueriesDTO } from './queries.interface'
import { PrivateApiGuard } from '../middlewares/private-api.guard'
import { PaginatedResponse } from '../common/models'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

@Controller('queries')
@UseGuards(PrivateApiGuard)
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @ApiOperation({ summary: 'Execute queries via SQL. Requires private API key in Bearer token.' })
  @ApiResponse({
    status: 200,
    description: 'The queries have been successfully executed.',
    type: PaginatedQueryResponse,
  })
  @Post()
  async executeQueries(@Body() queriesDto: QueriesDTO): Promise<PaginatedResponse<any>> {
    try {
      const results = await this.queriesService.sendQueries(queriesDto)
      return {
        results,
        limit: 0,
        offset: 0,
        total: queriesDto.queries.length,
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }
}
