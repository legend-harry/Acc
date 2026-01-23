/**
 * Integration Example
 * Shows how to integrate all AI/UX improvements into your app layout
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/context/user-context';
import { usePushNotifications } from '@/hooks/use-push-notifications';

// Import all the new components
import { AIOnboardingFlow } from '@/components/ai-onboarding-flow';
import { ConversationalAIChatbot } from '@/components/conversational-ai-chatbot';
import { PushNotificationSettings } from '@/components/push-notification-settings';
import { PredictiveAIGuidance } from '@/components/predictive-ai-guidance';
import { AutomatedParameterAnalysis } from '@/components/automated-parameter-analysis';
import { IntelligentDashboardPrioritization } from '@/components/intelligent-dashboard-prioritization';
import { ProactiveKnowledgeDelivery } from '@/components/proactive-knowledge-delivery';
import { SmartFormAssistance } from '@/components/smart-form-assistance';

interface IntegrationExampleProps {
  currentPond?: string;
  currentPhase?: string;
}

/**
 * Example integration of all AI/UX improvements
 * This shows how to combine all components into a cohesive experience
 */
export function AIUXIntegrationExample({
  currentPond,
  currentPhase = 'operation',
}: IntegrationExampleProps) {
  const { selectedProfile } = useUser();
  const { sendNotification, isPermitted } = usePushNotifications();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [waterParams, setWaterParams] = useState({
    pH: 7.8,
    DO: 4.2,
    temperature: 28,
    ammonia: 0.35,
  });

  // Check if user completed onboarding
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete && selectedProfile) {
      setShowOnboarding(true);
    }
  }, [selectedProfile]);

  // Example: Send notification when ammonia is high
  useEffect(() => {
    if (waterParams.ammonia > 0.3 && isPermitted) {
      sendNotification({
        title: '⚠️ Ammonia Alert',
        body: `Ammonia level is ${waterParams.ammonia} ppm. Consider reducing feeding.`,
        requireInteraction: false,
        icon: '/icons/alert.svg',
      }).catch(console.error);
    }
  }, [waterParams.ammonia, isPermitted, sendNotification]);

  return (
    <div className="space-y-6">
      {/* 1. Onboarding Flow - Show on first login */}
      <AIOnboardingFlow open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* 2. Chat Assistant - Floating button, always available */}
      <ConversationalAIChatbot isOpen={showChat} onClose={() => setShowChat(false)} />

      {/* 3. Dashboard Prioritization - Top level of dashboard */}
      <div className="mb-6">
        <IntelligentDashboardPrioritization
          currentPhase={currentPhase}
          recentAlerts={[]} // Pass your actual alerts
          timeOfDay={getTimeOfDay()}
        />
      </div>

      {/* 4. Predictive Guidance - Critical alerts and daily tasks */}
      {currentPond && (
        <div className="mb-6">
          <PredictiveAIGuidance pondId={currentPond} />
        </div>
      )}

      {/* 5. Parameter Analysis - For water quality monitoring */}
      {currentPond && (
        <div className="mb-6">
          <AutomatedParameterAnalysis pondId={currentPond} />
        </div>
      )}

      {/* 6. Proactive Knowledge - Context-aware help articles */}
      <div className="mb-6">
        <ProactiveKnowledgeDelivery waterParams={waterParams} phaseDay={45} />
      </div>

      {/* 7. Form Assistance - Wrap your forms with this */}
      {/* Example for Daily Log Form */}
      <div className="mb-6">
        <SmartFormAssistance
          formType="daily-log"
          currentValues={{
            'water-pH': waterParams.pH,
            'dissolved-oxygen': waterParams.DO,
            'temperature': waterParams.temperature,
            'ammonia': waterParams.ammonia,
          }}
          onFieldUpdate={(field, value) => {
            // Update your form here
            console.log(`Updated ${field} to ${value}`);
          }}
        />
      </div>

      {/* 8. Push Notification Settings - In settings/profile page */}
      <div className="mb-6">
        <PushNotificationSettings />
      </div>
    </div>
  );
}

/**
 * Helper function to determine time of day
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Example: How to use in your main layout
 *
 * In your app/layout.tsx or main page:
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         {/* Add this for all AI/UX features */}
 *         <AIUXIntegrationExample currentPhase="operation" />
 *       </body>
 *     </html>
 *   );
 * }
 */

/**
 * Example: Minimal integration (just the essentials)
 *
 * export function MinimalAIUXIntegration() {
 *   return (
 *     <>
 *       {/* Chat + Notifications + Onboarding */}
 *       <AIOnboardingFlow open={false} onOpenChange={() => {}} />
 *       <ConversationalAIChatbot />
 *       <PushNotificationSettings />
 *     </>
 *   );
 * }
 */

/**
 * Example: Dashboard-focused integration
 *
 * export function DashboardAIUX({ pondId, phase }) {
 *   return (
 *     <div className="space-y-6">
 *       <IntelligentDashboardPrioritization
 *         currentPhase={phase}
 *         recentAlerts={[]}
 *         timeOfDay="morning"
 *       />
 *       <PredictiveAIGuidance pondId={pondId} />
 *       <AutomatedParameterAnalysis pondId={pondId} />
 *       <ProactiveKnowledgeDelivery phaseDay={45} />
 *     </div>
 *   );
 * }
 */

/**
 * Example: Form integration
 *
 * function DailyLogForm() {
 *   const [formData, setFormData] = useState({});
 *
 *   return (
 *     <div>
 *       <SmartFormAssistance
 *         formType="daily-log"
 *         currentValues={formData}
 *         onFieldUpdate={(field, value) => {
 *           setFormData(prev => ({ ...prev, [field]: value }));
 *         }}
 *       />
 *       {/* Your form fields here */}
 *     </div>
 *   );
 * }
 */
