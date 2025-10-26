import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResourceService } from './resource.service';
import { Resource } from './resource.schema';

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  async findAll(@Query() filters: any): Promise<Resource[]> {
    return this.resourceService.findAll(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Resource> {
    return this.resourceService.findById(parseInt(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createData: Partial<Resource>): Promise<Resource> {
    return this.resourceService.create(createData);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<Resource>,
  ): Promise<Resource> {
    return this.resourceService.update(parseInt(id), updateData);
  }

  @Put(':id/metrics')
  @UseGuards(AuthGuard('jwt'))
  async updateMetrics(
    @Param('id') id: string,
    @Body() metrics: any,
  ): Promise<Resource> {
    return this.resourceService.updateMetrics(parseInt(id), metrics);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string): Promise<void> {
    await this.resourceService.delete(parseInt(id));
  }

  @Get('analytics/overview')
  async getAnalytics(): Promise<any> {
    return this.resourceService.getAnalytics();
  }
}