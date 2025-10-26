import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ComputeManagementClient } from '@azure/arm-compute';
import { ResourceManagementClient } from '@azure/arm-resources';
import { MonitorClient } from '@azure/arm-monitor';
import { DefaultAzureCredential } from '@azure/identity';

export interface AzureResourceConfig {
  vmSize: string;
  imageReference: {
    publisher: string;
    offer: string;
    sku: string;
    version: string;
  };
  adminUsername: string;
  adminPassword: string;
  location: string;
  resourceGroupName: string;
  virtualNetworkName: string;
  subnetName: string;
  networkSecurityGroupName: string;
  tags?: Record<string, string>;
}

export interface AzureResourceMetrics {
  cpuPercentage: number;
  memoryPercentage: number;
  diskReadBytes: number;
  diskWriteBytes: number;
  networkInBytes: number;
  networkOutBytes: number;
  timestamp: Date;
}

@Injectable()
export class AzureCloudService {
  private readonly logger = new Logger(AzureCloudService.name);
  private computeClient: ComputeManagementClient;
  private resourceClient: ResourceManagementClient;
  private monitorClient: MonitorClient;
  private subscriptionId: string;

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    this.subscriptionId = this.configService.get<string>('AZURE_SUBSCRIPTION_ID');
    
    if (!this.subscriptionId) {
      this.logger.warn('Azure subscription ID not configured');
      return;
    }

    const credential = new DefaultAzureCredential();

    this.computeClient = new ComputeManagementClient(credential, this.subscriptionId);
    this.resourceClient = new ResourceManagementClient(credential, this.subscriptionId);
    this.monitorClient = new MonitorClient(credential, this.subscriptionId);
  }

  async provisionResource(config: AzureResourceConfig): Promise<string> {
    try {
      this.logger.log(`Provisioning Azure VM with size: ${config.vmSize}`);

      const vmName = `dcloudx-vm-${Date.now()}`;
      const resourceGroupName = config.resourceGroupName;
      const location = config.location;

      // Create virtual machine
      const vmParameters = {
        location,
        osProfile: {
          computerName: vmName,
          adminUsername: config.adminUsername,
          adminPassword: config.adminPassword,
        },
        hardwareProfile: {
          vmSize: config.vmSize,
        },
        storageProfile: {
          imageReference: config.imageReference,
          osDisk: {
            createOption: 'FromImage',
            managedDisk: {
              storageAccountType: 'Premium_LRS',
            },
          },
        },
        networkProfile: {
          networkInterfaces: [
            {
              id: `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Network/networkInterfaces/${vmName}-nic`,
              primary: true,
            },
          ],
        },
        tags: config.tags || {},
      };

      const result = await this.computeClient.virtualMachines.beginCreateOrUpdateAndWait(
        resourceGroupName,
        vmName,
        vmParameters
      );

      this.logger.log(`Successfully provisioned Azure VM: ${vmName}`);
      return vmName;
    } catch (error) {
      this.logger.error(`Failed to provision Azure resource: ${error.message}`);
      throw error;
    }
  }

  async decommissionResource(vmName: string, resourceGroupName: string): Promise<void> {
    try {
      this.logger.log(`Decommissioning Azure VM: ${vmName}`);

      await this.computeClient.virtualMachines.beginDeleteAndWait(resourceGroupName, vmName);
      
      this.logger.log(`Successfully decommissioned Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to decommission Azure resource: ${error.message}`);
      throw error;
    }
  }

  async getResourceStatus(vmName: string, resourceGroupName: string): Promise<string> {
    try {
      const vm = await this.computeClient.virtualMachines.get(resourceGroupName, vmName);
      const instanceView = await this.computeClient.virtualMachines.getInstanceView(resourceGroupName, vmName);
      
      const powerState = instanceView.statuses?.find(status => 
        status.code?.startsWith('PowerState/')
      );

      return powerState?.displayStatus || 'unknown';
    } catch (error) {
      this.logger.error(`Failed to get Azure resource status: ${error.message}`);
      throw error;
    }
  }

  async getResourceMetrics(vmName: string, resourceGroupName: string, startTime: Date, endTime: Date): Promise<AzureResourceMetrics> {
    try {
      const resourceUri = `/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}`;
      
      const metrics = await Promise.all([
        this.getMetric('Percentage CPU', resourceUri, startTime, endTime),
        this.getMetric('Available Memory Bytes', resourceUri, startTime, endTime),
        this.getMetric('Disk Read Bytes', resourceUri, startTime, endTime),
        this.getMetric('Disk Write Bytes', resourceUri, startTime, endTime),
        this.getMetric('Network In Total', resourceUri, startTime, endTime),
        this.getMetric('Network Out Total', resourceUri, startTime, endTime),
      ]);

      return {
        cpuPercentage: metrics[0],
        memoryPercentage: metrics[1],
        diskReadBytes: metrics[2],
        diskWriteBytes: metrics[3],
        networkInBytes: metrics[4],
        networkOutBytes: metrics[5],
        timestamp: endTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get Azure resource metrics: ${error.message}`);
      throw error;
    }
  }

  private async getMetric(metricName: string, resourceUri: string, startTime: Date, endTime: Date): Promise<number> {
    try {
      const result = await this.monitorClient.metrics.list(resourceUri, {
        timespan: `${startTime.toISOString()}/${endTime.toISOString()}`,
        interval: 'PT5M',
        metricnames: metricName,
        aggregation: 'Average',
      });

      const metric = result.value?.[0];
      if (!metric || !metric.timeseries?.[0]?.data) {
        return 0;
      }

      const dataPoints = metric.timeseries[0].data;
      if (dataPoints.length === 0) {
        return 0;
      }

      // Return the most recent data point
      const latestDataPoint = dataPoints[dataPoints.length - 1];
      return latestDataPoint.average || 0;
    } catch (error) {
      this.logger.warn(`Failed to get metric ${metricName}: ${error.message}`);
      return 0;
    }
  }

  async listResources(resourceGroupName?: string): Promise<any[]> {
    try {
      const vms = [];
      
      if (resourceGroupName) {
        const result = await this.computeClient.virtualMachines.list(resourceGroupName);
        vms.push(...result);
      } else {
        const resourceGroups = await this.resourceClient.resourceGroups.list();
        
        for await (const rg of resourceGroups) {
          const result = await this.computeClient.virtualMachines.list(rg.name!);
          vms.push(...result);
        }
      }

      return vms.map(vm => ({
        vmName: vm.name,
        vmSize: vm.hardwareProfile?.vmSize,
        location: vm.location,
        resourceGroupName: vm.id?.split('/')[4],
        provisioningState: vm.provisioningState,
        osType: vm.storageProfile?.osDisk?.osType,
        tags: vm.tags,
      }));
    } catch (error) {
      this.logger.error(`Failed to list Azure resources: ${error.message}`);
      throw error;
    }
  }

  async getResourceInfo(vmName: string, resourceGroupName: string): Promise<any> {
    try {
      const vm = await this.computeClient.virtualMachines.get(resourceGroupName, vmName);
      const instanceView = await this.computeClient.virtualMachines.getInstanceView(resourceGroupName, vmName);

      return {
        vmName: vm.name,
        vmSize: vm.hardwareProfile?.vmSize,
        location: vm.location,
        resourceGroupName,
        provisioningState: vm.provisioningState,
        osType: vm.storageProfile?.osDisk?.osType,
        imageReference: vm.storageProfile?.imageReference,
        networkProfile: vm.networkProfile,
        osProfile: vm.osProfile,
        tags: vm.tags,
        statuses: instanceView.statuses,
        disks: instanceView.disks,
      };
    } catch (error) {
      this.logger.error(`Failed to get Azure resource info: ${error.message}`);
      throw error;
    }
  }

  async startResource(vmName: string, resourceGroupName: string): Promise<void> {
    try {
      this.logger.log(`Starting Azure VM: ${vmName}`);
      
      await this.computeClient.virtualMachines.beginStartAndWait(resourceGroupName, vmName);
      
      this.logger.log(`Successfully started Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to start Azure resource: ${error.message}`);
      throw error;
    }
  }

  async stopResource(vmName: string, resourceGroupName: string): Promise<void> {
    try {
      this.logger.log(`Stopping Azure VM: ${vmName}`);
      
      await this.computeClient.virtualMachines.beginPowerOffAndWait(resourceGroupName, vmName);
      
      this.logger.log(`Successfully stopped Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to stop Azure resource: ${error.message}`);
      throw error;
    }
  }

  async restartResource(vmName: string, resourceGroupName: string): Promise<void> {
    try {
      this.logger.log(`Restarting Azure VM: ${vmName}`);
      
      await this.computeClient.virtualMachines.beginRestartAndWait(resourceGroupName, vmName);
      
      this.logger.log(`Successfully restarted Azure VM: ${vmName}`);
    } catch (error) {
      this.logger.error(`Failed to restart Azure resource: ${error.message}`);
      throw error;
    }
  }
}
