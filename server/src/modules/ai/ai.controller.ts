import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIRecommendationService, RecommendationRequest } from './ai-recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI Recommendations')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIRecommendationService) {}

  @Post('recommendations')
  @ApiOperation({ summary: 'Get AI-powered resource recommendations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resource recommendations generated successfully',
    schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resourceId: { type: 'string' },
              score: { type: 'number' },
              reasons: { type: 'array', items: { type: 'string' } },
              estimatedCost: { type: 'number' },
              estimatedPerformance: { type: 'number' },
              compatibilityScore: { type: 'number' },
            },
          },
        },
        totalRecommendations: { type: 'number' },
        generatedAt: { type: 'string' },
      },
    },
  })
  async getRecommendations(@Body() request: RecommendationRequest) {
    const recommendations = await this.aiService.getRecommendations(request);
    
    return {
      recommendations,
      totalRecommendations: recommendations.length,
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('workload-types')
  @ApiOperation({ summary: 'Get available workload types' })
  @ApiResponse({ 
    status: 200, 
    description: 'Available workload types',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          requirements: {
            type: 'object',
            properties: {
              cpu: { type: 'boolean' },
              memory: { type: 'boolean' },
              storage: { type: 'boolean' },
              gpu: { type: 'boolean' },
              networkBandwidth: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  getWorkloadTypes() {
    return [
      {
        type: 'compute',
        name: 'General Computing',
        description: 'CPU-intensive workloads, web servers, APIs',
        icon: '🖥️',
        requirements: {
          cpu: true,
          memory: true,
          storage: false,
          gpu: false,
          networkBandwidth: true,
        },
      },
      {
        type: 'ai-ml',
        name: 'AI/ML Training',
        description: 'Machine learning model training and inference',
        icon: '🤖',
        requirements: {
          cpu: true,
          memory: true,
          storage: true,
          gpu: true,
          networkBandwidth: true,
        },
      },
      {
        type: 'gaming',
        name: 'Gaming & Graphics',
        description: 'High-performance gaming and graphics rendering',
        icon: '🎮',
        requirements: {
          cpu: true,
          memory: true,
          storage: true,
          gpu: true,
          networkBandwidth: true,
        },
      },
      {
        type: 'database',
        name: 'Database Services',
        description: 'Database hosting and management',
        icon: '🗄️',
        requirements: {
          cpu: true,
          memory: true,
          storage: true,
          gpu: false,
          networkBandwidth: true,
        },
      },
      {
        type: 'storage',
        name: 'File Storage',
        description: 'File storage and backup services',
        icon: '💾',
        requirements: {
          cpu: false,
          memory: false,
          storage: true,
          gpu: false,
          networkBandwidth: true,
        },
      },
      {
        type: 'web',
        name: 'Web Applications',
        description: 'Web hosting and content delivery',
        icon: '🌐',
        requirements: {
          cpu: true,
          memory: true,
          storage: false,
          gpu: false,
          networkBandwidth: true,
        },
      },
    ];
  }

  @Get('regions')
  @ApiOperation({ summary: 'Get available regions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Available regions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          name: { type: 'string' },
          country: { type: 'string' },
          latency: { type: 'number' },
        },
      },
    },
  })
  getRegions() {
    return [
      { code: 'us-east-1', name: 'US East (N. Virginia)', country: 'United States', latency: 50 },
      { code: 'us-west-2', name: 'US West (Oregon)', country: 'United States', latency: 60 },
      { code: 'eu-west-1', name: 'Europe (Ireland)', country: 'Ireland', latency: 80 },
      { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', country: 'Singapore', latency: 120 },
      { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', country: 'Japan', latency: 100 },
      { code: 'ca-central-1', name: 'Canada (Central)', country: 'Canada', latency: 70 },
      { code: 'sa-east-1', name: 'South America (São Paulo)', country: 'Brazil', latency: 150 },
    ];
  }

  @Get('pricing-estimate')
  @ApiOperation({ summary: 'Get pricing estimate for requirements' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pricing estimate',
    schema: {
      type: 'object',
      properties: {
        estimatedCost: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            compute: { type: 'number' },
            storage: { type: 'number' },
            network: { type: 'number' },
            gpu: { type: 'number' },
          },
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getPricingEstimate(
    @Query('workloadType') workloadType: string,
    @Query('cpu') cpu: number,
    @Query('memory') memory: number,
    @Query('storage') storage: number,
    @Query('duration') duration: number = 1,
    @Query('region') region?: string,
  ) {
    // This would calculate pricing estimates based on current market rates
    const baseCost = 0.1; // Base cost per hour
    const cpuCost = (cpu || 1) * 0.05;
    const memoryCost = (memory || 1) * 0.02;
    const storageCost = (storage || 1) * 0.01;
    
    const estimatedCost = (baseCost + cpuCost + memoryCost + storageCost) * duration;
    
    return {
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      costBreakdown: {
        compute: cpuCost * duration,
        storage: storageCost * duration,
        network: 0.01 * duration,
        gpu: workloadType === 'ai-ml' || workloadType === 'gaming' ? 0.5 * duration : 0,
      },
      recommendations: [
        'Consider spot instances for cost savings',
        'Reserved instances available for long-term usage',
        'Auto-scaling can optimize costs based on demand',
      ],
    };
  }
}
