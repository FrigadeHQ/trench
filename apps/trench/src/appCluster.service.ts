import * as _cluster from 'cluster'
import * as os from 'os'
import { Injectable } from '@nestjs/common'

const cluster = _cluster as unknown as _cluster.Cluster // typings fix

const numCPUs = os.cpus().length

@Injectable()
export class AppClusterService {
  static clusterize(callback: Function): void {
    if (cluster.isPrimary) {
      console.log(`Primary server started on ${process.pid} (using ${numCPUs} processes).`)
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
      }
      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting`)
        cluster.fork()
      })
    } else {
      const nodeNumber = cluster.worker.id
      console.log(`Cluster server started on ${process.pid}`)
      callback(nodeNumber)
    }
  }
}
