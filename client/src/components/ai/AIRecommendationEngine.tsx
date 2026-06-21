'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon, 
  ServerIcon, 
  CloudIcon, 
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface RecommendationRequest {
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
  duration?: number;
  region?: string;
  preferences?: {
    provider?: string[];
    instanceType?: string[];
    securityLevel?: 'basic' | 'standard' | 'high' | 'enterprise';
  };
}

interface ResourceRecommendation {
  resourceId: string;
  score: number;
  reasons: string[];
  estimatedCost: number;
  estimatedPerformance: number;
  compatibilityScore: number;
  provider: string;
  resourceType: string;
  specifications: {
    cpu: number;
    memory: number;
    storage: number;
    gpu: boolean;
    pricePerHour: number;
  };
  reputation: number;
  availability: number;
}

interface WorkloadType {
  type: string;
  name: string;
  description: string;
  icon: string;
  requirements: {
    cpu: boolean;
    memory: boolean;
    storage: boolean;
    gpu: boolean;
    networkBandwidth: boolean;
  };
}

const AIRecommendationEngine: React.FC = () => {
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<RecommendationRequest>({
    workloadType: 'compute',
    requirements: {
      cpu: 4,
      memory: 8,
      storage: 100,
      gpu: false,
      networkBandwidth: 1000,
      latency: 50,
      availability: 99.9,
    },
    budget: 100,
    duration: 24,
    region: 'us-east-1',
    preferences: {
      provider: [],
      instanceType: [],
      securityLevel: 'standard',
    },
  });

  const workloadTypes: WorkloadType[] = [
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

  const regions = [
    { code: 'us-east-1', name: 'US East (N. Virginia)', latency: 50 },
    { code: 'us-west-2', name: 'US West (Oregon)', latency: 60 },
    { code: 'eu-west-1', name: 'Europe (Ireland)', latency: 80 },
    { code: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', latency: 120 },
    { code: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', latency: 100 },
  ];

  const providers = [
    { name: 'AWS', color: 'bg-orange-100 text-orange-800' },
    { name: 'Azure', color: 'bg-blue-100 text-blue-800' },
    { name: 'GCP', color: 'bg-green-100 text-green-800' },
  ];

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    if (score >= 0.4) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Resource Recommendations</h1>
        </div>
        <p className="text-gray-600">
          Get intelligent recommendations for cloud resources based on your specific requirements and usage patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configure Your Requirements</h2>

            {/* Workload Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Workload Type</label>
              <div className="grid grid-cols-2 gap-3">
                {workloadTypes.map((workload) => (
                  <button
                    key={workload.type}
                    onClick={() => setRequest(prev => ({ ...prev, workloadType: workload.type as any }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      request.workloadType === workload.type
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{workload.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{workload.name}</div>
                    <div className="text-xs text-gray-500">{workload.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Resource Requirements</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CPU Cores</label>
                  <input
                    type="number"
                    value={request.requirements.cpu || ''}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, cpu: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Memory (GB)</label>
                  <input
                    type="number"
                    value={request.requirements.memory || ''}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, memory: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    value={request.requirements.storage || ''}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, storage: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gpu"
                    checked={request.requirements.gpu || false}
                    onChange={(e) => setRequest(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, gpu: e.target.checked }
                    }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gpu" className="ml-2 text-sm text-gray-700">
                    GPU Required
                  </label>
                </div>
              </div>
            </div>

            {/* Budget and Duration */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={request.budget || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    value={request.duration || ''}
                    onChange={(e) => setRequest(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="24"
                  />
                </div>
              </div>
            </div>

            {/* Region */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Region</label>
              <select
                value={request.region || ''}
                onChange={(e) => setRequest(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name} ({region.latency}ms)
                  </option>
                ))}
              </select>
            </div>

            {/* Get Recommendations Button */}
            <button
              onClick={getRecommendations}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Get AI Recommendations</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Recommended Resources</h2>
            <p className="text-gray-600">
              {recommendations.length} recommendations found based on your requirements
            </p>
          </div>

          <AnimatePresence>
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation.resourceId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow p-6 mb-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ServerIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {recommendation.provider} - {recommendation.resourceType}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {recommendation.specifications.cpu} CPU • {recommendation.specifications.memory}GB RAM • {recommendation.specifications.storage}GB Storage
                        {recommendation.specifications.gpu && ' • GPU Enabled'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBackground(recommendation.score)} ${getScoreColor(recommendation.score)}`}>
                      <StarIcon className="w-4 h-4 mr-1" />
                      {(recommendation.score * 100).toFixed(0)}% Match
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(recommendation.estimatedCost)}
                    </p>
                    <p className="text-sm text-gray-600">estimated cost</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Performance</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(recommendation.estimatedPerformance * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Compatibility</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(recommendation.compatibilityScore * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Reputation</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {recommendation.reputation}/100
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Why this resource?</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.reasons.map((reason, reasonIndex) => (
                      <span
                        key={reasonIndex}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {recommendation.availability}% uptime
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      {formatCurrency(recommendation.specifications.pricePerHour)}/hour
                    </div>
                  </div>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 flex items-center space-x-2">
                    <span>Book Resource</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {recommendations.length === 0 && !loading && (
            <div className="text-center py-12">
              <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
              <p className="text-gray-600">Configure your requirements and click "Get AI Recommendations" to see suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationEngine;
