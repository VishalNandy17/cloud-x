import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EC2Client, RunInstancesCommand, TerminateInstancesCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

export interface AWSResourceConfig {
  instanceType: string;
  imageId: string;
  keyName: string;
  securityGroupIds: string[];
  subnetId: string;
  userData?: string;
  tags?: Record<string, string>;
}

export interface AWSResourceMetrics {
  cpuUtilization: number;
  networkIn: number;
  networkOut: number;
  diskReadOps: number;
  diskWriteOps: number;
  timestamp: Date;
}

@Injectable()
export class AWSCloudService {
  private readonly logger = new Logger(AWSCloudService.name);
  private ec2Client: EC2Client;
  private s3Client: S3Client;
  private cloudWatchClient: CloudWatchClient;

  constructor(private configService: ConfigService) {
    this.initializeClients();
  }

  private initializeClients() {
    const region = this.configService.get<string>('AWS_REGION', 'us-west-2');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not configured');
      return;
    }

    const credentials = {
      accessKeyId,
      secretAccessKey,
    };

    this.ec2Client = new EC2Client({ region, credentials });
    this.s3Client = new S3Client({ region, credentials });
    this.cloudWatchClient = new CloudWatchClient({ region, credentials });
  }

  async provisionResource(config: AWSResourceConfig): Promise<string> {
    try {
      this.logger.log(`Provisioning AWS EC2 instance with type: ${config.instanceType}`);

      const command = new RunInstancesCommand({
        ImageId: config.imageId,
        MinCount: 1,
        MaxCount: 1,
        InstanceType: config.instanceType,
        KeyName: config.keyName,
        SecurityGroupIds: config.securityGroupIds,
        SubnetId: config.subnetId,
        UserData: config.userData ? Buffer.from(config.userData).toString('base64') : undefined,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: Object.entries(config.tags || {}).map(([Key, Value]) => ({ Key, Value })),
          },
        ],
      });

      const response = await this.ec2Client.send(command);
      const instanceId = response.Instances?.[0]?.InstanceId;

      if (!instanceId) {
        throw new Error('Failed to create EC2 instance');
      }

      this.logger.log(`Successfully provisioned EC2 instance: ${instanceId}`);
      return instanceId;
    } catch (error) {
      this.logger.error(`Failed to provision AWS resource: ${error.message}`);
      throw error;
    }
  }

  async decommissionResource(instanceId: string): Promise<void> {
    try {
      this.logger.log(`Decommissioning AWS EC2 instance: ${instanceId}`);

      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId],
      });

      await this.ec2Client.send(command);
      this.logger.log(`Successfully decommissioned EC2 instance: ${instanceId}`);
    } catch (error) {
      this.logger.error(`Failed to decommission AWS resource: ${error.message}`);
      throw error;
    }
  }

  async getResourceStatus(instanceId: string): Promise<string> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      const response = await this.ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      return instance.State?.Name || 'unknown';
    } catch (error) {
      this.logger.error(`Failed to get AWS resource status: ${error.message}`);
      throw error;
    }
  }

  async getResourceMetrics(instanceId: string, startTime: Date, endTime: Date): Promise<AWSResourceMetrics> {
    try {
      const metrics = await Promise.all([
        this.getMetric('CPUUtilization', instanceId, startTime, endTime),
        this.getMetric('NetworkIn', instanceId, startTime, endTime),
        this.getMetric('NetworkOut', instanceId, startTime, endTime),
        this.getMetric('DiskReadOps', instanceId, startTime, endTime),
        this.getMetric('DiskWriteOps', instanceId, startTime, endTime),
      ]);

      return {
        cpuUtilization: metrics[0],
        networkIn: metrics[1],
        networkOut: metrics[2],
        diskReadOps: metrics[3],
        diskWriteOps: metrics[4],
        timestamp: endTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get AWS resource metrics: ${error.message}`);
      throw error;
    }
  }

  private async getMetric(metricName: string, instanceId: string, startTime: Date, endTime: Date): Promise<number> {
    const command = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: metricName,
      Dimensions: [
        {
          Name: 'InstanceId',
          Value: instanceId,
        },
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Average'],
    });

    const response = await this.cloudWatchClient.send(command);
    const datapoints = response.Datapoints || [];

    if (datapoints.length === 0) {
      return 0;
    }

    // Return the most recent datapoint
    const latestDatapoint = datapoints.reduce((latest, current) => 
      current.Timestamp && latest.Timestamp && current.Timestamp > latest.Timestamp ? current : latest
    );

    return latestDatapoint.Average || 0;
  }

  async listResources(): Promise<any[]> {
    try {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending', 'stopping', 'stopped'],
          },
        ],
      });

      const response = await this.ec2Client.send(command);
      const instances = response.Reservations?.flatMap(reservation => 
        reservation.Instances?.map(instance => ({
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          publicIp: instance.PublicIpAddress,
          privateIp: instance.PrivateIpAddress,
          launchTime: instance.LaunchTime,
          tags: instance.Tags?.reduce((acc, tag) => {
            if (tag.Key && tag.Value) {
              acc[tag.Key] = tag.Value;
            }
            return acc;
          }, {} as Record<string, string>),
        })) || []
      ) || [];

      return instances;
    } catch (error) {
      this.logger.error(`Failed to list AWS resources: ${error.message}`);
      throw error;
    }
  }

  async uploadToS3(bucketName: string, key: string, body: Buffer, contentType?: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully uploaded ${key} to S3 bucket ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error.message}`);
      throw error;
    }
  }

  async downloadFromS3(bucketName: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];
      
      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to download from S3: ${error.message}`);
      throw error;
    }
  }

  async deleteFromS3(bucketName: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted ${key} from S3 bucket ${bucketName}`);
    } catch (error) {
      this.logger.error(`Failed to delete from S3: ${error.message}`);
      throw error;
    }
  }

  async getResourceInfo(instanceId: string): Promise<any> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });

      const response = await this.ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      return {
        instanceId: instance.InstanceId,
        instanceType: instance.InstanceType,
        state: instance.State?.Name,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        launchTime: instance.LaunchTime,
        imageId: instance.ImageId,
        keyName: instance.KeyName,
        securityGroups: instance.SecurityGroups?.map(sg => ({
          groupId: sg.GroupId,
          groupName: sg.GroupName,
        })),
        subnetId: instance.SubnetId,
        vpcId: instance.VpcId,
        tags: instance.Tags?.reduce((acc, tag) => {
          if (tag.Key && tag.Value) {
            acc[tag.Key] = tag.Value;
          }
          return acc;
        }, {} as Record<string, string>),
      };
    } catch (error) {
      this.logger.error(`Failed to get AWS resource info: ${error.message}`);
      throw error;
    }
  }
}
