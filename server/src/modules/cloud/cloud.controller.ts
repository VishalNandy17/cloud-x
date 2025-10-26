import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CloudProviderService } from './cloud-provider.service';

@ApiTags('cloud')
@Controller('cloud')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CloudController {
  constructor(private readonly cloudProviderService: CloudProviderService) {}

  @Post('aws/instance')
  @ApiOperation({ summary: 'Create AWS EC2 instance' })
  @ApiResponse({ status: 201, description: 'Instance created successfully' })
  async createAWSInstance(@Body() specs: any) {
    return this.cloudProviderService.createAWSInstance(specs);
  }

  @Post('azure/vm')
  @ApiOperation({ summary: 'Create Azure VM' })
  @ApiResponse({ status: 201, description: 'VM created successfully' })
  async createAzureVM(@Body() specs: any) {
    return this.cloudProviderService.createAzureVM(specs);
  }

  @Post('gcp/instance')
  @ApiOperation({ summary: 'Create GCP Compute instance' })
  @ApiResponse({ status: 201, description: 'Instance created successfully' })
  async createGCPInstance(@Body() specs: any) {
    return this.cloudProviderService.createGCPInstance(specs);
  }

  @Delete('aws/instance/:instanceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Terminate AWS EC2 instance' })
  @ApiResponse({ status: 204, description: 'Instance terminated successfully' })
  async terminateAWSInstance(@Param('instanceId') instanceId: string) {
    await this.cloudProviderService.terminateAWSInstance(instanceId);
  }

  @Delete('azure/vm/:resourceGroup/:vmName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Azure VM' })
  @ApiResponse({ status: 204, description: 'VM deleted successfully' })
  async deleteAzureVM(
    @Param('resourceGroup') resourceGroup: string,
    @Param('vmName') vmName: string
  ) {
    await this.cloudProviderService.deleteAzureVM(resourceGroup, vmName);
  }

  @Delete('gcp/instance/:projectId/:zone/:instanceName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete GCP Compute instance' })
  @ApiResponse({ status: 204, description: 'Instance deleted successfully' })
  async deleteGCPInstance(
    @Param('projectId') projectId: string,
    @Param('zone') zone: string,
    @Param('instanceName') instanceName: string
  ) {
    await this.cloudProviderService.deleteGCPInstance(projectId, zone, instanceName);
  }
}
