import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Compute } from '@google-cloud/compute';
import { Monitoring } from '@google-cloud/monitoring';
import { Storage } from '@google-cloud/storage';

export interface GCPResourceConfig {
  machineType: string;
  sourceImage: string;
  zone: string;
  projectId: string;
  network: string;
  subnetwork: string;
  serviceAccount?: string;
  metadata?: Record<string, string>;
  tags?: string[];
  labels?: Record<string, string>;
}

export interface GCPResourceMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  diskReadOps: number;
  diskWriteOps: number;
  networkReceivedBytes: number;
  networkSentBytes: number;
  timestamp: Date;
}

@Injectable()
export class GCPCloudService {
  private readonly logger = new Logger(GCPCloudService.name);
  private compute: Compute;
  private monitoring: Monitoring;
  private storage: Storage;
  private projectId: string;

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    this.projectId = this.configService.get<string>('GCP_PROJECT_ID');
    
    if (!this.projectId) {
      this.logger.warn('GCP project ID not configured');
      return;
    }

    const keyFilename = this.configService.get<string>('GCP_SERVICE_ACCOUNT_KEY');

    this.compute = new Compute({
      projectId: this.projectId,
      keyFilename,
    });

    this.monitoring = new Monitoring({
      projectId: this.projectId,
      keyFilename,
    });

    this.storage = new Storage({
      projectId: this.projectId,
      keyFilename,
    });
  }

  async provisionResource(config: GCPResourceConfig): Promise<string> {
    try {
      this.logger.log(`Provisioning GCP VM with machine type: ${config.machineType}`);

      const instanceName = `dcloudx-vm-${Date.now()}`;
      const zone = this.compute.zone(config.zone);

      const instanceConfig = {
        machineType: config.machineType,
        disks: [
          {
            boot: true,
            autoDelete: true,
            initializeParams: {
              sourceImage: config.sourceImage,
            },
          },
        ],
        networkInterfaces: [
          {
            network: `projects/${this.projectId}/global/networks/${config.network}`,
            subnetwork: `projects/${this.projectId}/regions/${config.zone.split('-')[0]}-${config.zone.split('-')[1]}/subnetworks/${config.subnetwork}`,
            accessConfigs: [
              {
                type: 'ONE_TO_ONE_NAT',
                name: 'External NAT',
              },
            ],
          },
        ],
        serviceAccounts: config.serviceAccount ? [
          {
            email: config.serviceAccount,
            scopes: [
              'https://www.googleapis.com/auth/cloud-platform',
            ],
          },
        ] : undefined,
        metadata: config.metadata ? {
          items: Object.entries(config.metadata).map(([key, value]) => ({
            key,
            value,
          })),
        } : undefined,
        tags: config.tags ? {
          items: config.tags,
        } : undefined,
        labels: config.labels,
      };

      const [instance] = await zone.createVM(instanceName, instanceConfig);
      
      this.logger.log(`Successfully provisioned GCP VM: ${instanceName}`);
      return instanceName;
    } catch (error) {
      this.logger.error(`Failed to provision GCP resource: ${error.message}`);
      throw error;
    }
  }

  async decommissionResource(instanceName: string, zone: string): Promise<void> {
    try {
      this.logger.log(`Decommissioning GCP VM: ${instanceName}`);

      const vm = this.compute.zone(zone).vm(instanceName);
      await vm.delete();

      this.logger.log(`Successfully decommissioned GCP VM: ${instanceName}`);
    } catch (error) {
      this.logger.error(`Failed to decommission GCP resource: ${error.message}`);
      throw error;
    }
  }

  async getResourceStatus(instanceName: string, zone: string): Promise<string> {
    try {
      const vm = this.compute.zone(zone).vm(instanceName);
      const [instance] = await vm.get();

      return instance.metadata.status || 'unknown';
    } catch (error) {
      this.logger.error(`Failed to get GCP resource status: ${error.message}`);
      throw error;
    }
  }

  async getResourceMetrics(instanceName: string, zone: string, startTime: Date, endTime: Date): Promise<GCPResourceMetrics> {
    try {
      const metrics = await Promise.all([
        this.getMetric('compute.googleapis.com/instance/cpu/utilization', instanceName, zone, startTime, endTime),
        this.getMetric('compute.googleapis.com/instance/memory/utilization', instanceName, zone, startTime, endTime),
        this.getMetric('compute.googleapis.com/instance/disk/read_ops_count', instanceName, zone, startTime, endTime),
        this.getMetric('compute.googleapis.com/instance/disk/write_ops_count', instanceName, zone, startTime, endTime),
        this.getMetric('compute.googleapis.com/instance/network/received_bytes_count', instanceName, zone, startTime, endTime),
        this.getMetric('compute.googleapis.com/instance/network/sent_bytes_count', instanceName, zone, startTime, endTime),
      ]);

      return {
        cpuUtilization: metrics[0],
        memoryUtilization: metrics[1],
        diskReadOps: metrics[2],
        diskWriteOps: metrics[3],
        networkReceivedBytes: metrics[4],
        networkSentBytes: metrics[5],
        timestamp: endTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get GCP resource metrics: ${error.message}`);
      throw error;
    }
  }

  private async getMetric(metricType: string, instanceName: string, zone: string, startTime: Date, endTime: Date): Promise<number> {
    try {
      const request = {
        name: `projects/${this.projectId}`,
        filter: `metric.type="${metricType}" AND resource.labels.instance_name="${instanceName}" AND resource.labels.zone="${zone}"`,
        interval: {
          startTime: {
            seconds: Math.floor(startTime.getTime() / 1000),
          },
          endTime: {
            seconds: Math.floor(endTime.getTime() / 1000),
          },
        },
        aggregation: {
          alignmentPeriod: {
            seconds: 300, // 5 minutes
          },
          perSeriesAligner: 'ALIGN_MEAN',
          crossSeriesReducer: 'REDUCE_MEAN',
        },
      };

      const [timeSeries] = await this.monitoring.listTimeSeries(request);

      if (!timeSeries || timeSeries.length === 0) {
        return 0;
      }

      const points = timeSeries[0].points;
      if (!points || points.length === 0) {
        return 0;
      }

      // Return the most recent data point
      const latestPoint = points[points.length - 1];
      return latestPoint.value?.doubleValue || 0;
    } catch (error) {
      this.logger.warn(`Failed to get metric ${metricType}: ${error.message}`);
      return 0;
    }
  }

  async listResources(zone?: string): Promise<any[]> {
    try {
      const instances = [];

      if (zone) {
        const [instancesInZone] = await this.compute.zone(zone).getVMs();
        instances.push(...instancesInZone);
      } else {
        const [zones] = await this.compute.getZones();
        
        for (const zoneObj of zones) {
          const [instancesInZone] = await zoneObj.getVMs();
          instances.push(...instancesInZone);
        }
      }

      return instances.map(instance => ({
        instanceName: instance.name,
        machineType: instance.metadata.machineType,
        zone: instance.metadata.zone,
        status: instance.metadata.status,
        creationTimestamp: instance.metadata.creationTimestamp,
        labels: instance.metadata.labels,
        tags: instance.metadata.tags,
        networkInterfaces: instance.metadata.networkInterfaces,
      }));
    } catch (error) {
      this.logger.error(`Failed to list GCP resources: ${error.message}`);
      throw error;
    }
  }

  async getResourceInfo(instanceName: string, zone: string): Promise<any> {
    try {
      const vm = this.compute.zone(zone).vm(instanceName);
      const [instance] = await vm.get();

      return {
        instanceName: instance.name,
        machineType: instance.metadata.machineType,
        zone: instance.metadata.zone,
        status: instance.metadata.status,
        creationTimestamp: instance.metadata.creationTimestamp,
        labels: instance.metadata.labels,
        tags: instance.metadata.tags,
        networkInterfaces: instance.metadata.networkInterfaces,
        disks: instance.metadata.disks,
        serviceAccounts: instance.metadata.serviceAccounts,
        metadata: instance.metadata.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get GCP resource info: ${error.message}`);
      throw error;
    }
  }

  async startResource(instanceName: string, zone: string): Promise<void> {
    try {
      this.logger.log(`Starting GCP VM: ${instanceName}`);

      const vm = this.compute.zone(zone).vm(instanceName);
      await vm.start();

      this.logger.log(`Successfully started GCP VM: ${instanceName}`);
    } catch (error) {
      this.logger.error(`Failed to start GCP resource: ${error.message}`);
      throw error;
    }
  }

  async stopResource(instanceName: string, zone: string): Promise<void> {
    try {
      this.logger.log(`Stopping GCP VM: ${instanceName}`);

      const vm = this.compute.zone(zone).vm(instanceName);
      await vm.stop();

      this.logger.log(`Successfully stopped GCP VM: ${instanceName}`);
    } catch (error) {
      this.logger.error(`Failed to stop GCP resource: ${error.message}`);
      throw error;
    }
  }

  async restartResource(instanceName: string, zone: string): Promise<void> {
    try {
      this.logger.log(`Restarting GCP VM: ${instanceName}`);

      const vm = this.compute.zone(zone).vm(instanceName);
      await vm.reset();

      this.logger.log(`Successfully restarted GCP VM: ${instanceName}`);
    } catch (error) {
      this.logger.error(`Failed to restart GCP resource: ${error.message}`);
      throw error;
    }
  }

  async uploadToStorage(bucketName: string, fileName: string, fileBuffer: Buffer, contentType?: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      await file.save(fileBuffer, {
        metadata: {
          contentType: contentType || 'application/octet-stream',
        },
      });

      this.logger.log(`Successfully uploaded ${fileName} to GCS bucket ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to upload to GCS: ${error.message}`);
      throw error;
    }
  }

  async downloadFromStorage(bucketName: string, fileName: string): Promise<Buffer> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      const [data] = await file.download();
      return data;
    } catch (error) {
      this.logger.error(`Failed to download from GCS: ${error.message}`);
      throw error;
    }
  }

  async deleteFromStorage(bucketName: string, fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      await file.delete();

      this.logger.log(`Successfully deleted ${fileName} from GCS bucket ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete from GCS: ${error.message}`);
      throw error;
    }
  }
}
