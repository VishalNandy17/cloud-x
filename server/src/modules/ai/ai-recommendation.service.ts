import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource } from '../resource/resource.schema';
import { Booking } from '../booking/booking.schema';
import { User } from '../user/user.schema';
import { Analytics } from '../analytics/analytics.schema';

export interface ResourceRecommendation {
  resourceId: string;
  score: number;
  reasons: string[];
  estimatedCost: number;
  estimatedPerformance: number;
  compatibilityScore: number;
}

export interface RecommendationRequest {
  userId: string;
  workloadType: 'compute' | 'storage' | 'database' | 'ai-ml' | 'web' | 'gaming';
  requirements: {
    cpu?: number;
    memory?: number;
    storage?: number;
    gpu?: boolean;
    networkBandwidth?: number;
    latency?: number;
    availability?: number;
  };
  budget?: number;
  duration?: number; // in hours
  region?: string;
  preferences?: {
    provider?: string[];
    instanceType?: string[];
    securityLevel?: 'basic' | 'standard' | 'high' | 'enterprise';
  };
}

@Injectable()
export class AIRecommendationService {
  private readonly logger = new Logger(AIRecommendationService.name);

  constructor(
    @InjectModel(Resource.name) private resourceModel: Model<Resource>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Analytics.name) private analyticsModel: Model<Analytics>,
  ) {}

  async getRecommendations(request: RecommendationRequest): Promise<ResourceRecommendation[]> {
    this.logger.log(`Generating recommendations for user ${request.userId}`);

    try {
      // Get user history and preferences
      const userProfile = await this.getUserProfile(request.userId);
      
      // Get available resources
      const availableResources = await this.getAvailableResources(request);
      
      // Calculate recommendations using ML algorithms
      const recommendations = await this.calculateRecommendations(
        request,
        userProfile,
        availableResources
      );

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      throw error;
    }
  }

  private async getUserProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    const bookingHistory = await this.bookingModel
      .find({ userId })
      .populate('resourceId')
      .sort({ createdAt: -1 })
      .limit(50);

    const analytics = await this.analyticsModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    return {
      user,
      bookingHistory,
      analytics,
      preferences: this.extractUserPreferences(bookingHistory, analytics),
    };
  }

  private async getAvailableResources(request: RecommendationRequest) {
    const filter: any = {
      isActive: true,
      resourceType: request.workloadType,
    };

    if (request.region) {
      filter.region = request.region;
    }

    if (request.preferences?.provider) {
      filter.provider = { $in: request.preferences.provider };
    }

    return await this.resourceModel.find(filter);
  }

  private async calculateRecommendations(
    request: RecommendationRequest,
    userProfile: any,
    resources: Resource[]
  ): Promise<ResourceRecommendation[]> {
    const recommendations: ResourceRecommendation[] = [];

    for (const resource of resources) {
      const score = await this.calculateResourceScore(request, userProfile, resource);
      
      if (score > 0.3) { // Only include resources with decent scores
        recommendations.push({
          resourceId: resource._id.toString(),
          score,
          reasons: this.generateReasons(request, userProfile, resource, score),
          estimatedCost: this.calculateEstimatedCost(resource, request.duration || 1),
          estimatedPerformance: this.calculateEstimatedPerformance(resource, request),
          compatibilityScore: this.calculateCompatibilityScore(request, resource),
        });
      }
    }

    return recommendations;
  }

  private async calculateResourceScore(
    request: RecommendationRequest,
    userProfile: any,
    resource: Resource
  ): Promise<number> {
    let score = 0;

    // Performance matching (40% weight)
    const performanceScore = this.calculatePerformanceScore(request.requirements, resource);
    score += performanceScore * 0.4;

    // Cost efficiency (25% weight)
    const costScore = this.calculateCostScore(request, resource, userProfile);
    score += costScore * 0.25;

    // User preferences (20% weight)
    const preferenceScore = this.calculatePreferenceScore(request.preferences, resource, userProfile);
    score += preferenceScore * 0.2;

    // Historical performance (10% weight)
    const historicalScore = this.calculateHistoricalScore(resource, userProfile);
    score += historicalScore * 0.1;

    // Availability and reliability (5% weight)
    const reliabilityScore = this.calculateReliabilityScore(resource);
    score += reliabilityScore * 0.05;

    return Math.min(1, Math.max(0, score));
  }

  private calculatePerformanceScore(requirements: any, resource: Resource): number {
    let score = 0;
    let factors = 0;

    if (requirements.cpu && resource.cpu) {
      const cpuMatch = Math.min(1, resource.cpu / requirements.cpu);
      score += cpuMatch;
      factors++;
    }

    if (requirements.memory && resource.ram) {
      const memoryMatch = Math.min(1, resource.ram / requirements.memory);
      score += memoryMatch;
      factors++;
    }

    if (requirements.storage && resource.storage) {
      const storageMatch = Math.min(1, resource.storage / requirements.storage);
      score += storageMatch;
      factors++;
    }

    if (requirements.gpu && resource.gpu) {
      score += 1;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateCostScore(
    request: RecommendationRequest,
    resource: Resource,
    userProfile: any
  ): number {
    if (!request.budget || !resource.pricePerHour) {
      return 0.5;
    }

    const estimatedCost = resource.pricePerHour * (request.duration || 1);
    const costRatio = estimatedCost / request.budget;

    if (costRatio <= 0.5) return 1.0;
    if (costRatio <= 0.8) return 0.8;
    if (costRatio <= 1.0) return 0.6;
    if (costRatio <= 1.2) return 0.4;
    return 0.2;
  }

  private calculatePreferenceScore(
    preferences: any,
    resource: Resource,
    userProfile: any
  ): number {
    let score = 0.5; // Base score

    if (preferences?.provider && preferences.provider.includes(resource.provider)) {
      score += 0.3;
    }

    if (preferences?.securityLevel) {
      const securityMatch = this.getSecurityLevelMatch(preferences.securityLevel, resource);
      score += securityMatch * 0.2;
    }

    // User's historical preference for this provider
    const providerHistory = userProfile.preferences?.favoriteProviders || [];
    if (providerHistory.includes(resource.provider)) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private calculateHistoricalScore(resource: Resource, userProfile: any): number {
    const resourceBookings = userProfile.bookingHistory.filter(
      (booking: any) => booking.resourceId?.provider === resource.provider
    );

    if (resourceBookings.length === 0) {
      return 0.5; // Neutral score for new providers
    }

    const avgRating = resourceBookings.reduce(
      (sum: number, booking: any) => sum + (booking.rating || 3),
      0
    ) / resourceBookings.length;

    return avgRating / 5; // Normalize to 0-1
  }

  private calculateReliabilityScore(resource: Resource): number {
    // This would typically come from historical uptime data
    const baseReliability = 0.85; // Base reliability score
    
    // Adjust based on resource reputation
    const reputationBonus = (resource.reputation || 50) / 100 * 0.15;
    
    return Math.min(1, baseReliability + reputationBonus);
  }

  private calculateCompatibilityScore(request: RecommendationRequest, resource: Resource): number {
    let score = 0;
    let factors = 0;

    // Check workload type compatibility
    if (this.isWorkloadCompatible(request.workloadType, resource.resourceType)) {
      score += 1;
      factors++;
    }

    // Check region compatibility
    if (!request.region || resource.region === request.region) {
      score += 1;
      factors++;
    }

    // Check latency requirements
    if (request.requirements.latency) {
      const latencyScore = this.calculateLatencyScore(request.requirements.latency, resource);
      score += latencyScore;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  private calculateEstimatedCost(resource: Resource, duration: number): number {
    return (resource.pricePerHour || 0) * duration;
  }

  private calculateEstimatedPerformance(resource: Resource, request: RecommendationRequest): number {
    // This would use more sophisticated performance modeling
    const basePerformance = 0.8;
    const cpuFactor = resource.cpu ? Math.min(1, resource.cpu / (request.requirements.cpu || 1)) : 0.5;
    const memoryFactor = resource.ram ? Math.min(1, resource.ram / (request.requirements.memory || 1)) : 0.5;
    
    return (basePerformance + cpuFactor + memoryFactor) / 3;
  }

  private generateReasons(
    request: RecommendationRequest,
    userProfile: any,
    resource: Resource,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push('Excellent match for your requirements');
    } else if (score > 0.6) {
      reasons.push('Good match for your requirements');
    }

    if (resource.reputation && resource.reputation > 80) {
      reasons.push('High reputation provider');
    }

    if (this.calculateCostScore(request, resource, userProfile) > 0.8) {
      reasons.push('Cost-effective option');
    }

    if (resource.gpu && request.requirements.gpu) {
      reasons.push('GPU acceleration available');
    }

    if (resource.region === request.region) {
      reasons.push('Located in your preferred region');
    }

    return reasons;
  }

  private extractUserPreferences(bookingHistory: any[], analytics: any[]) {
    const preferences = {
      favoriteProviders: [],
      preferredInstanceTypes: [],
      averageBudget: 0,
      commonWorkloads: [],
    };

    // Analyze booking history
    const providers = bookingHistory.map(booking => booking.resourceId?.provider).filter(Boolean);
    preferences.favoriteProviders = [...new Set(providers)];

    const budgets = bookingHistory.map(booking => booking.totalCost).filter(Boolean);
    preferences.averageBudget = budgets.length > 0 ? 
      budgets.reduce((sum, budget) => sum + budget, 0) / budgets.length : 0;

    return preferences;
  }

  private isWorkloadCompatible(workloadType: string, resourceType: string): boolean {
    const compatibility = {
      'compute': ['compute', 'gpu'],
      'storage': ['storage', 'database'],
      'database': ['database', 'compute'],
      'ai-ml': ['gpu', 'compute'],
      'web': ['compute', 'web'],
      'gaming': ['gpu', 'compute'],
    };

    return compatibility[workloadType]?.includes(resourceType) || false;
  }

  private calculateLatencyScore(requiredLatency: number, resource: Resource): number {
    // This would use actual latency data
    const estimatedLatency = 50; // ms
    return Math.max(0, 1 - (estimatedLatency / requiredLatency));
  }

  private getSecurityLevelMatch(requiredLevel: string, resource: Resource): number {
    const securityLevels = {
      'basic': 0.2,
      'standard': 0.5,
      'high': 0.8,
      'enterprise': 1.0,
    };

    return securityLevels[requiredLevel] || 0.5;
  }
}
