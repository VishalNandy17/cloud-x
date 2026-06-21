import { Module } from '@nestjs/common';
import { PrometheusModule } from 'nestjs-prometheus';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [PrometheusModule.register()],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
