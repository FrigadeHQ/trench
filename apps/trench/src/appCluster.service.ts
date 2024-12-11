import * as _cluster from 'cluster'
import * as os from 'os'
import { Injectable, Logger } from '@nestjs/common'

const cluster = _cluster as unknown as _cluster.Cluster // typings fix

const numCPUs = os.cpus().length

@Injectable()
export class AppClusterService {
  private static readonly logger = new Logger(AppClusterService.name)
  static clusterize(callback: Function): void {
    if (cluster.isPrimary) {
      this.logger.log(`Primary server started on ${process.pid} (using ${numCPUs} processes).`)
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
      }
      cluster.on('exit', (worker, code, signal) => {
        this.logger.log(`Worker ${worker.process.pid} died. Restarting`)
        cluster.fork()
      })
    } else {
      const nodeNumber = cluster.worker.id
      this.logger.log(`Cluster server started on ${process.pid}`)
      callback(nodeNumber)
    }
  }
}
