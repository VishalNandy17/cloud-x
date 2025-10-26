import { Injectable, Logger } from '@nestjs/common';
import { AWSCloudService } from './providers/aws-cloud.service';
import { AzureCloudService } from './providers/azure-cloud.service';
import { GCPCloudService } from './providers/gcp-cloud.service';

export interface CloudResourceConfig {
  provider: 'aws' | 'azure' | 'gcp';
  config: any;
}

export interface CloudResourceMetrics {
  provider: string;
  metrics: any;
  timestamp: Date;
}

@Injectable()
export class CloudProviderService {
  private readonly logger = new Logger(CloudProviderService.name);

  constructor(
    private awsService: AWSCloudService,
    private azureService: AzureCloudService,
    private gcpService: GCPCloudService,
  ) {}

  async provisionResource(resourceConfig: CloudResourceConfig): Promise<string> {
    this.logger.log(`Provisioning ${resourceConfig.provider} resource`);

    switch (resourceConfig.provider) {
      case 'aws':
        return await this.awsService.provisionResource(resourceConfig.config);
      case 'azure':
        return await this.azureService.provisionResource(resourceConfig.config);
      case 'gcp':
        return await this.gcpService.provisionResource(resourceConfig.config);
      default:
        throw new Error(`Unsupported cloud provider: ${resourceConfig.provider}`);
    }
  }

  async decommissionResource(provider: string, resourceId: string, additionalParams?: any): Promise<void> {
    this.logger.log(`Decommissioning ${provider} resource: ${resourceId}`);

    switch (provider) {
      case 'aws':
        return await this.awsService.decommissionResource(resourceId);
      case 'azure':
        return await this.azureService.decommissionResource(resourceId, additionalParams.resourceGroupName);
      case 'gcp':
        return await this.gcpService.decommissionResource(resourceId, additionalParams.zone);
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }

  async getResourceStatus(provider: string, resourceId: string, additionalParams?: any): Promise<string> {
    switch (provider) {
      case 'aws':
        return await this.awsService.getResourceStatus(resourceId);
      case 'azure':
        return await this.azureService.getResourceStatus(resourceId, additionalParams.resourceGroupName);
      case 'gcp':
        return await this.gcpService.getResourceStatus(resourceId, additionalParams.zone);
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }

  async getResourceMetrics(provider: string, resourceId: string, startTime: Date, endTime: Date, additionalParams?: any): Promise<CloudResourceMetrics> {
    let metrics: any;

    switch (provider) {
      case 'aws':
        metrics = await this.awsService.getResourceMetrics(resourceId, startTime, endTime);
        break;
      case 'azure':
        metrics = await this.azureService.getResourceMetrics(resourceId, additionalParams.resourceGroupName, startTime, endTime);
        break;
      case 'gcp':
        metrics = await this.gcpService.getResourceMetrics(resourceId, additionalParams.zone, startTime, endTime);
        break;
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }

    return {
      provider,
      metrics,
      timestamp: endTime,
    };
  }

  async listResources(provider: string, additionalParams?: any): Promise<any[]> {
    switch (provider) {
      case 'aws':
        return await this.awsService.listResources();
      case 'azure':
        return await this.azureService.listResources(additionalParams?.resourceGroupName);
      case 'gcp':
        return await this.gcpService.listResources(additionalParams?.zone);
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }

  async getResourceInfo(provider: string, resourceId: string, additionalParams?: any): Promise<any> {
    switch (provider) {
      case 'aws':
        return await this.awsService.getResourceInfo(resourceId);
      case 'azure':
        return await this.azureService.getResourceInfo(resourceId, additionalParams.resourceGroupName);
      case 'gcp':
        return await this.gcpService.getResourceInfo(resourceId, additionalParams.zone);
      default:
        throw new Error(`Unsupported cloud provider: ${provider}`);
    }
  }
}
