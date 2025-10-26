import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../hooks/useWeb3';
import { useContract } from '../../hooks/useContract';
import ResourceCard from './ResourceCard';
import ListResourceModal from './ListResourceModal';
import { formatEther } from 'ethers/lib/utils';

interface Resource {
  id: number;
  provider: string;
  resourceType: string;
  cpu: number;
  ram: number;
  storage: number;
  pricePerHour: string;
  isActive: boolean;
  reputation: number;
}

export default function ResourceMarketplace() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { account, provider } = useWeb3();
  const { contract } = useContract('ResourceMarketplace');

  useEffect(() => {
    if (contract) {
      loadResources();
    }
  }, [contract]);

  const loadResources = async () => {
    try {
      const resourceCount = await contract.resourceCounter();
      const loadedResources = [];

      for (let i = 1; i <= resourceCount; i++) {
        const resource = await contract.resources(i);
        if (resource.isActive) {
          loadedResources.push({
            id: i,
            provider: resource.provider,
            resourceType: resource.resourceType,
            cpu: resource.cpu.toNumber(),
            ram: resource.ram.toNumber(),
            storage: resource.storage.toNumber(),
            pricePerHour: formatEther(resource.pricePerHour),
            isActive: resource.isActive,
            reputation: resource.reputation.toNumber(),
          });
        }
      }

      setResources(loadedResources);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading resources:', error);
      setIsLoading(false);
    }
  };

  const handleListResource = async (resourceData: {
    resourceType: string;
    cpu: number;
    ram: number;
    storage: number;
    pricePerHour: string;
  }) => {
    try {
      const tx = await contract.listResource(
        resourceData.resourceType,
        resourceData.cpu,
        resourceData.ram,
        resourceData.storage,
        ethers.utils.parseEther(resourceData.pricePerHour)
      );

      await tx.wait();
      await loadResources();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error listing resource:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resource Marketplace</h1>
        {account && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            List Resource
          </button>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No resources available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isOwner={account === resource.provider}
              onBook={async () => {
                // Implement booking logic
              }}
            />
          ))}
        </div>
      )}

      <ListResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleListResource}
      />
    </div>
  );
}