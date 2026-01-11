# Shrimp Farming Project Management System - Implementation Guide

## Overview

The Shrimp Farming module provides comprehensive management capabilities for shrimp aquaculture operations with AI-powered insights and recommendations. Built with Next.js, React, and Genkit integration, it enables farm managers to optimize production, reduce costs, and maintain biosecurity.

## Architecture

### Components

#### 1. **Main Dashboard** (`/src/app/(main)/shrimp/page.tsx`)
- **Purpose**: Central hub for all farming operations
- **Features**:
  - Tab-based navigation for different functional areas
  - Critical alerts display system
  - Active pond selection
  - Add Pond dialog trigger
- **State Management**: React hooks with local state
- **Responsive**: Full mobile support

#### 2. **Shrimp Dashboard** (`/src/components/shrimp/shrimp-dashboard.tsx`)
- **Purpose**: Real-time farm metrics and analytics
- **Displays**:
  - Phase information with progress tracking (e.g., "Day 45 of 120")
  - Key metrics: FCR (Feed Conversion Ratio), Survival Rate, Average Weight, Total Ponds
  - Pond-by-pond water quality status (pH, DO, Temp, Ammonia)
  - Smooth animations for visual appeal
- **Updates**: Real-time from Firebase when integrated

#### 3. **Daily Log Form** (`/src/components/shrimp/daily-log-form.tsx`)
- **Purpose**: Daily operational logging with AI assistance
- **Features**:
  - Water parameter tracking (pH, DO, Temperature, Ammonia)
  - Visual sliders with optimal range indicators
  - Feeding records (amount, consumption %)
  - Daily observations text area
- **AI Integration**:
  - `/api/ai/shrimp-assist`: Generates alerts based on parameters
  - Smart suggestions for parameter deviations
  - Recommended actions displayed with priority levels
- **Export**: Save logs to database or export for manager review

#### 4. **Financial Dashboard** (`/src/components/shrimp/financial-dashboard.tsx`)
- **Purpose**: Production cost tracking and ROI projections
- **Components**:
  - Cost breakdown visualization (pie chart with percentages)
  - Revenue & profit projection (line chart across cycle)
  - FCR & cost efficiency trends (bar chart)
  - Market price converter
- **AI Integration**:
  - `/api/ai/optimize-costs`: Cost optimization analysis
  - Identifies savings opportunities
  - Provides implementation timeline
- **KPIs**: Total Invested, Projected Revenue, ROI percentage

#### 5. **Project Journey Map** (`/src/components/shrimp/project-journey-map.tsx`)
- **Purpose**: Visualize farm lifecycle phases
- **Phases**:
  1. Planning & Design (completed)
  2. Setup & Preparation (completed)
  3. Stocking & Acclimation (completed)
  4. Operation & Maintenance (current - 45%)
  5. Harvest & Processing (upcoming)
  6. Analysis & Planning (upcoming)
- **Features**:
  - Timeline visualization with progress indicators
  - Phase-specific checklists (expandable)
  - Resource links per phase
  - Estimated duration for each phase
- **AI Integration**:
  - `/api/ai/generate-phase-tasks`: Creates task lists
  - Next phase recommendations
  - Risk assessment by phase

#### 6. **Report Generator** (`/src/components/shrimp/report-generator.tsx`)
- **Purpose**: Generate exportable production reports
- **Report Types**:
  - **Daily**: Yesterday's operations summary
  - **Weekly**: Last 7 days analysis
  - **Cycle-End**: Complete production cycle analysis
  - **Custom**: User-selected metrics
- **Features**:
  - Report template selection
  - Metric customization for custom reports
  - Date range selection for weekly reports
  - Export options (PDF, Excel, CSV)
- **AI Integration**:
  - `/api/ai/generate-report`: AI-written narrative analysis
  - Automatic recommendations
  - Performance trend identification
- **Output**: Professional reports with AI insights

#### 7. **Knowledge Base** (`/src/components/shrimp/knowledge-base.tsx`)
- **Purpose**: Searchable reference library for farm operations
- **Categories**:
  - Disease Management (WSSV, EMS, etc.)
  - Water Quality (ammonia, oxygen, pH)
  - Feeding & Nutrition
  - Regulations & Compliance
  - Best Practices
- **Features**:
  - Full-text search with tag matching
  - Category filtering
  - Helpfulness ratings (shown for each article)
  - Article detail view with quick references
- **AI Integration**:
  - `/api/ai/search-knowledge`: Semantic search matching
  - Context-aware recommendations based on current water parameters
  - Emergency protocol quick links
- **Content**: 10+ comprehensive articles, extensible

#### 8. **Add Pond Dialog** (`/src/components/shrimp/add-pond-dialog.tsx`)
- **Purpose**: Multi-step wizard for adding new ponds
- **Steps**:
  1. **Basic Information**: Name, area (hectares), species (Vannamei/Tiger/Monodon)
  2. **Design Configuration**: Production model, water source, stocking density
  3. **Review & Confirm**: Summary with estimated costs
- **Production Models**:
  - Extensive (10-15/m²)
  - Semi-Intensive (30-50/m²)
  - Intensive (80-150/m²)
- **Water Sources**: Well, Brackish Pond, Seawater, Canal/Estuary
- **AI Integration**:
  - `/api/ai/optimize-pond-design`: Equipment and practice recommendations
  - Cost estimation (base ~$50k/hectare, adjusted by model)
- **Validation**: Form validation with helpful error messages

## AI Integration Points

### API Endpoints

All AI endpoints are implemented in `/src/app/api/ai/` with production-ready structure for Genkit integration.

#### 1. `/api/ai/shrimp-assist` (POST)
**Input**:
```json
{
  "pondName": "Pond A1",
  "waterParams": {
    "ph": 7.8,
    "do": 4.2,
    "temperature": 28,
    "ammonia": 0.1
  },
  "observations": "..."
}
```
**Output**:
```json
{
  "suggestions": {
    "observations": "...",
    "actions": "..."
  }
}
```

#### 2. `/api/ai/optimize-costs` (POST)
**Input**:
```json
{
  "pondId": "pond-1",
  "currentFCR": 1.4,
  "currentCostPerKg": 6.8,
  "totalCosts": 10000
}
```
**Output**:
```json
{
  "costSavings": ["..."],
  "projectedSavings": 1500,
  "timeline": "3-4 weeks"
}
```

#### 3. `/api/ai/generate-phase-tasks` (POST)
**Input**:
```json
{
  "phaseId": "operation",
  "currentPhase": "operation",
  "dayInPhase": 45
}
```
**Output**:
```json
{
  "tasks": ["..."],
  "recommendations": "..."
}
```

#### 4. `/api/ai/generate-report` (POST)
**Input**:
```json
{
  "pondId": "pond-1",
  "reportType": "daily|weekly|cycle-end|custom",
  "selectedMetrics": {...},
  "includeAIAnalysis": true
}
```
**Output**:
```json
{
  "narrative": "...",
  "metrics": {...},
  "recommendations": ["..."]
}
```

#### 5. `/api/ai/search-knowledge` (POST)
**Input**:
```json
{
  "query": "high ammonia",
  "currentWaterParams": {
    "ammonia": 0.8,
    "do": 3.5,
    "temperature": 32
  }
}
```
**Output**:
```json
{
  "matchCount": 3,
  "topResults": [...],
  "recommendations": ["..."]
}
```

#### 6. `/api/ai/optimize-pond-design` (POST)
**Input**:
```json
{
  "pondName": "Pond B",
  "area": 2.5,
  "productionModel": "intensive",
  "species": "vannamei",
  "waterSource": "seawater"
}
```
**Output**:
```json
{
  "equipment": ["..."],
  "considerations": ["..."],
  "estimatedSetupTime": "2-3 weeks",
  "staffRequired": "2-3 people"
}
```

## Genkit Integration (Next Steps)

### Current State
- All API endpoints have mock implementations ready
- Endpoints are structured to accept Genkit flow calls

### Implementation Steps

1. **Replace endpoint implementations** with actual Genkit flow calls:
```typescript
// Example for /api/ai/shrimp-assist/route.ts
import { shrimpAssistFlow } from '@/ai/flows/shrimp-assist';

const result = await shrimpAssistFlow.run({
  pondName,
  waterParams,
  observations,
});
```

2. **Create corresponding Genkit flows** in `/src/ai/flows/`:
- `shrimp-assist.ts` - Water quality analysis
- `optimize-costs.ts` - Cost optimization
- `generate-report.ts` - Report generation with Gemini 2.5-flash
- etc.

3. **Configure Genkit** with:
- Google API credentials (GOOGLE_GENAI_API_KEY)
- Model selection (Gemini 2.5-flash for fast responses)
- Streaming for real-time feedback

## Data Model

### Pond
```typescript
interface Pond {
  id: string;
  name: string;
  area: number; // hectares
  species: 'vannamei' | 'tiger' | 'monodon';
  productionModel: 'extensive' | 'semi-intensive' | 'intensive';
  waterSource: 'well' | 'pond' | 'seawater' | 'canal';
  status: 'active' | 'archived';
  createdAt: Date;
  currentPhase: 'planning' | 'setup' | 'stocking' | 'operation' | 'harvest' | 'analysis';
}
```

### DailyLog
```typescript
interface DailyLog {
  id: string;
  pondId: string;
  date: Date;
  ph: number;
  do: number;
  temperature: number;
  ammonia: number;
  feedingAmount: number;
  feedingConsumption: number;
  observations: string;
  actions: string;
  createdAt: Date;
}
```

### Alert
```typescript
interface Alert {
  id: string;
  pondId: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string;
  resolvedAt?: Date;
  createdAt: Date;
}
```

## Database Integration (Firebase)

Expected Firebase structure:
```
/ponds/{pondId}
  /name: "Pond A1"
  /area: 1.5
  /species: "vannamei"
  /currentPhase: "operation"
  /dailyLogs/{logId}
    /ph: 7.8
    /do: 4.2
    /temperature: 28
    /ammonia: 0.1
    /feedingAmount: 12
    /createdAt: timestamp
  /reports/{reportId}
    /type: "daily"
    /content: "..."
    /createdAt: timestamp
  /alerts/{alertId}
    /severity: "critical"
    /message: "..."
    /resolved: false
    /createdAt: timestamp
```

## UI/UX Features

### Responsive Design
- Full mobile support with touch-optimized controls
- Tablet-optimized layouts
- Desktop full-feature interface

### Visual Feedback
- Smooth animations (fade-in, slide-in with staggered delays)
- Color-coded alerts (red: critical, orange: warning, green: good)
- Progress indicators for phases and metrics
- Loading states with spinners

### Accessibility
- Keyboard navigation support
- ARIA labels on form inputs
- Color contrast compliance
- Mobile screen reader support

### Performance
- Static page pre-rendering where possible
- Client-side state management
- Lazy-loaded components
- Optimized API calls with debouncing

## File Structure

```
src/
├── app/
│   ├── (main)/
│   │   └── shrimp/
│   │       └── page.tsx              # Main hub
│   └── api/
│       └── ai/
│           ├── shrimp-assist/route.ts
│           ├── optimize-costs/route.ts
│           ├── generate-phase-tasks/route.ts
│           ├── generate-report/route.ts
│           ├── search-knowledge/route.ts
│           └── optimize-pond-design/route.ts
├── components/
│   └── shrimp/
│       ├── shrimp-dashboard.tsx
│       ├── daily-log-form.tsx
│       ├── financial-dashboard.tsx
│       ├── project-journey-map.tsx
│       ├── report-generator.tsx
│       ├── knowledge-base.tsx
│       └── add-pond-dialog.tsx
└── ai/
    └── flows/                        # To be implemented
        ├── shrimp-assist.ts
        ├── optimize-costs.ts
        └── generate-report.ts
```

## Testing Checklist

- [ ] Daily Log Form - test all water parameter inputs
- [ ] Financial Dashboard - verify charts display correctly
- [ ] Project Journey Map - test phase expansion/collapse
- [ ] Report Generator - test all report types
- [ ] Knowledge Base - test search functionality
- [ ] Add Pond Dialog - test 3-step wizard flow
- [ ] API endpoints - test with mock data
- [ ] Mobile responsiveness - test on various devices
- [ ] Accessibility - test keyboard navigation

## Future Enhancements

1. **Real-time Notifications**: WebSocket integration for alerts
2. **Mobile App**: React Native companion app
3. **Advanced Analytics**: Predictive models for disease/yield
4. **Video Tutorials**: Embedded guides for best practices
5. **Community Forum**: Peer-to-peer knowledge sharing
6. **Multi-farm Dashboard**: Manage multiple farms simultaneously
7. **Regulatory Compliance**: Automated audit trail generation
8. **Integration**: API for external farm management systems

## Support & Documentation

For questions or issues:
1. Check Knowledge Base for relevant articles
2. Review API endpoint documentation
3. Consult implementation guide above
4. File issue with detailed error message and screenshots

## Version History

- **v1.0.0** (Current): Initial Shrimp Farming module with 8 components and 6 AI endpoints
- Upcoming: Genkit integration for production AI workflows
