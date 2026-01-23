/**
 * Complete Integration Example
 * Shows how to use all the redesigned multi-pond components together
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Import all redesigned components
import { MultiPondDashboard } from '@/components/shrimp/redesigned-multi-pond-dashboard';
import { AddPondDialog } from '@/components/shrimp/redesigned-add-pond-dialog';
import { PondDetailView } from '@/components/shrimp/pond-detail-view';
import { ProjectLinkedPonds } from '@/components/shrimp/project-linked-ponds';

// Mock data for demonstration
const MOCK_PONDS = [
  {
    id: 'pond-1',
    name: 'Pond A - East Field',
    area: 0.5,
    seedAmount: 50000,
    currentStock: 42500,
    species: 'vannamei',
    farmingType: 'semi-intensive',
    status: 'active',
    currentPhase: 'operation',
    cycleDay: 45,
    waterQuality: 'good',
    temperature: 28.5,
    humidity: 75,
    location: {
      latitude: 10.8075,
      longitude: 106.7294,
      area: 'Ho Chi Minh City, Vietnam',
    },
    metrics: {
      fcr: 1.8,
      survivalRate: 85,
      avgWeight: 15.2,
      feeding: 500,
    },
    images: [
      'https://via.placeholder.com/400x300?text=Pond+A',
    ],
    linkedProjectId: 'project-1',
  },
  {
    id: 'pond-2',
    name: 'Pond B - North Field',
    area: 0.75,
    seedAmount: 75000,
    currentStock: 60000,
    species: 'tiger',
    farmingType: 'intensive',
    status: 'active',
    currentPhase: 'operation',
    cycleDay: 30,
    waterQuality: 'fair',
    temperature: 29.2,
    humidity: 78,
    location: {
      latitude: 10.8200,
      longitude: 106.7400,
      area: 'Ho Chi Minh City, Vietnam',
    },
    metrics: {
      fcr: 1.95,
      survivalRate: 80,
      avgWeight: 12.8,
      feeding: 750,
    },
    linkedProjectId: 'project-1',
  },
  {
    id: 'pond-3',
    name: 'Pond C - Preparation',
    area: 0.25,
    seedAmount: 0,
    currentStock: 0,
    species: 'monodon',
    farmingType: 'semi-intensive',
    status: 'preparing',
    currentPhase: 'setup',
    cycleDay: 5,
    waterQuality: 'excellent',
    temperature: 27.8,
    humidity: 72,
    location: {
      latitude: 10.8300,
      longitude: 106.7500,
      area: 'Ho Chi Minh City, Vietnam',
    },
    metrics: {
      fcr: 0,
      survivalRate: 0,
      avgWeight: 0,
      feeding: 0,
    },
    linkedProjectId: 'project-2',
  },
];

/**
 * Main Shrimp Dashboard Component
 * Integrates all redesigned components with state management
 */
export function ShrimpDashboard() {
  const [ponds, setPonds] = useState(MOCK_PONDS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const selectedPond = ponds.find((p) => p.id === selectedPondId);

  // Handle adding a new pond
  const handleAddPond = async (newPond: any) => {
    // In production, save to database
    const pondWithId = {
      ...newPond,
      id: `pond-${Date.now()}`,
    };

    setPonds([...ponds, pondWithId]);
    setShowAddDialog(false);

    // Optional: Navigate to new pond
    setSelectedPondId(pondWithId.id);
  };

  // Handle pond selection from dashboard
  const handlePondSelect = (pondId: string) => {
    setSelectedPondId(pondId);
    setActiveTab('details');
  };

  // Handle linking pond to project
  const handleLinkPond = (pondId: string, projectId: string) => {
    setPonds(
      ponds.map((pond) =>
        pond.id === pondId
          ? { ...pond, linkedProjectId: projectId }
          : pond
      )
    );
  };

  // Handle unlinking pond from project
  const handleUnlinkPond = (pondId: string) => {
    setPonds(
      ponds.map((pond) =>
        pond.id === pondId
          ? { ...pond, linkedProjectId: null }
          : pond
      )
    );
  };

  // Handle editing a pond
  const handleEditPond = (pondId: string, updates: any) => {
    setPonds(
      ponds.map((pond) =>
        pond.id === pondId
          ? { ...pond, ...updates }
          : pond
      )
    );
  };

  // Handle deleting a pond
  const handleDeletePond = (pondId: string) => {
    setPonds(ponds.filter((pond) => pond.id !== pondId));
    if (selectedPondId === pondId) {
      setSelectedPondId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Shrimp Farm Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage all your ponds from one place
          </p>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedPondId}>
              Pond Details
            </TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Multi-Pond Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <MultiPondDashboard
              ponds={ponds}
              onPondSelect={handlePondSelect}
              onAddPond={() => setShowAddDialog(true)}
            />
          </TabsContent>

          {/* Details Tab - Individual Pond View */}
          <TabsContent value="details" className="space-y-6">
            {selectedPond ? (
              <PondDetailView
                pond={selectedPond}
                onBack={() => {
                  setSelectedPondId(null);
                  setActiveTab('dashboard');
                }}
                onEdit={() => {
                  // Could open edit dialog here
                  console.log('Edit pond:', selectedPond.id);
                }}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a pond from the dashboard to view details</p>
              </div>
            )}
          </TabsContent>

          {/* Projects Tab - Project-Linked Ponds */}
          <TabsContent value="projects" className="space-y-6">
            <ProjectLinkedPonds
              projectId="project-1"
              linkedPonds={ponds.filter((p) => p.linkedProjectId === 'project-1')}
              onPondSelect={handlePondSelect}
              onLinkPond={() => setShowAddDialog(true)}
              onUnlinkPond={(pondId) => handleUnlinkPond(pondId)}
            />
          </TabsContent>
        </Tabs>

        {/* Add Pond Dialog */}
        <AddPondDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddPond={handleAddPond}
        />
      </div>
    </div>
  );
}

/**
 * Example: Using components individually
 */
export function DashboardOnlyExample() {
  const [ponds, setPonds] = useState(MOCK_PONDS);
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Multi-Pond Dashboard</h1>

      <MultiPondDashboard
        ponds={ponds}
        onPondSelect={(pondId) => {
          console.log('Selected pond:', pondId);
          setSelectedPondId(pondId);
        }}
        onAddPond={() => setShowAddDialog(true)}
      />

      {selectedPondId && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setSelectedPondId(null)}
          >
            Close Details
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using pond detail view
 */
export function DetailViewExample() {
  const [selectedPondId, setSelectedPondId] = useState(MOCK_PONDS[0].id);
  const selectedPond = MOCK_PONDS.find((p) => p.id === selectedPondId);

  return (
    <div className="container mx-auto py-6">
      {selectedPond && (
        <PondDetailView
          pond={selectedPond}
          onBack={() => setSelectedPondId(null)}
          onEdit={() => console.log('Edit pond')}
        />
      )}
    </div>
  );
}

/**
 * Example: Using location selector standalone
 */
export function LocationSelectorExample() {
  import { MapLocationSelector } from '@/components/shrimp/map-location-selector';

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Select Pond Location</h1>

      <MapLocationSelector
        onLocationSelect={(location, weather) => {
          console.log('Selected location:', location);
          console.log('Weather:', weather);
        }}
      />
    </div>
  );
}

/**
 * Example: Project linked ponds
 */
export function ProjectPondsExample() {
  const linkedPonds = MOCK_PONDS.filter(
    (p) => p.linkedProjectId === 'project-1'
  );

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Project: Large Farm A</h1>

      <ProjectLinkedPonds
        projectId="project-1"
        linkedPonds={linkedPonds}
        onPondSelect={(pondId) => {
          console.log('Selected pond:', pondId);
        }}
        onLinkPond={() => {
          console.log('Link new pond');
        }}
        onUnlinkPond={(pondId) => {
          console.log('Unlink pond:', pondId);
        }}
      />
    </div>
  );
}

/**
 * Integration with your existing app structure
 */
export function IntegratedShrimpPage() {
  // Use your existing hooks
  // const { ponds, addPond } = usePonds();
  // const { selectedProfile } = useContext(UserContext);

  // State management
  const [view, setView] = useState<'dashboard' | 'details' | 'projects'>('dashboard');
  const [selectedPondId, setSelectedPondId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // In production, use real data from your hooks/database
  const ponds = MOCK_PONDS;

  const handleNavigation = {
    toDashboard: () => setView('dashboard'),
    toDetails: (pondId: string) => {
      setSelectedPondId(pondId);
      setView('details');
    },
    toProjects: () => setView('projects'),
  };

  return (
    <div>
      {view === 'dashboard' && (
        <MultiPondDashboard
          ponds={ponds}
          onPondSelect={handleNavigation.toDetails}
          onAddPond={() => setShowAddDialog(true)}
        />
      )}

      {view === 'details' && selectedPondId && (
        <PondDetailView
          pond={ponds.find((p) => p.id === selectedPondId)!}
          onBack={handleNavigation.toDashboard}
          onEdit={() => {
            /* Handle edit */
          }}
        />
      )}

      {view === 'projects' && (
        <ProjectLinkedPonds
          projectId="your-project-id"
          linkedPonds={ponds.filter((p) => p.linkedProjectId === 'your-project-id')}
          onPondSelect={handleNavigation.toDetails}
          onLinkPond={() => setShowAddDialog(true)}
          onUnlinkPond={(pondId) => {
            /* Handle unlink */
          }}
        />
      )}

      <AddPondDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddPond={async (pond) => {
          // Use your existing addPond hook/function
          // await addPond(pond);
          console.log('Adding pond:', pond);
        }}
      />
    </div>
  );
}

/**
 * Types for reference
 */
export interface Pond {
  id: string;
  name: string;
  area: number;
  seedAmount: number;
  currentStock: number;
  species: 'vannamei' | 'tiger' | 'monodon';
  farmingType: 'extensive' | 'semi-intensive' | 'intensive';
  status: 'active' | 'preparing' | 'harvesting' | 'resting';
  currentPhase: 'setup' | 'stocking' | 'operation' | 'harvest' | 'analysis';
  cycleDay: number;
  waterQuality: 'excellent' | 'good' | 'fair' | 'poor';
  temperature: number;
  humidity: number;
  location: {
    latitude: number;
    longitude: number;
    area: string;
  };
  metrics: {
    fcr: number;
    survivalRate: number;
    avgWeight: number;
    feeding: number;
  };
  images?: string[];
  linkedProjectId?: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  precipitation: number;
  description: string;
  icon: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  area: string;
  address?: string;
}
