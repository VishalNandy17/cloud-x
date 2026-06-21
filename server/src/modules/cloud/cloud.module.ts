import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudProviderService } from './cloud-provider.service';
import { CloudController } from './cloud.controller';
import { AWSCloudService } from './providers/aws-cloud.service';
import { AzureCloudService } from './providers/azure-cloud.service';
import { GCPCloudService } from './providers/gcp-cloud.service';

@Module({
  imports: [ConfigModule],
  providers: [CloudProviderService, AWSCloudService, AzureCloudService, GCPCloudService],
  controllers: [CloudController],
  exports: [CloudProviderService],
})
export class CloudModule {}
