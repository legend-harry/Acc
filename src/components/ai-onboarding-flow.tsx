/**
 * AI-Powered Onboarding Flow Component
 * Smart welcome assistant for new users
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  question: string;
  options: OnboardingOption[];
}

interface OnboardingOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface OnboardingState {
  userRole: string;
  goal: string;
  experience: string;
  pondCount: string;
}

export function AIOnboardingFlow({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<OnboardingState>({
    userRole: '',
    goal: '',
    experience: '',
    pondCount: '',
  });

  const steps: OnboardingStep[] = [
    {
      id: 'role',
      title: 'What is your role?',
      description: 'Help us customize your experience based on your responsibilities',
      question: 'Select your primary role on the farm:',
      options: [
        {
          id: 'owner',
          label: 'Farm Owner',
          description: 'Managing overall operations and finances',
          icon: '👨‍💼',
        },
        {
          id: 'manager',
          label: 'Farm Manager',
          description: 'Daily operations and team coordination',
          icon: '📋',
        },
        {
          id: 'worker',
          label: 'Farm Worker',
          description: 'Daily tasks and monitoring',
          icon: '👨‍🌾',
        },
      ],
    },
    {
      id: 'goal',
      title: 'What is your main goal?',
      description: 'We'll prioritize features to help you achieve this',
      question: 'What would you like to focus on?',
      options: [
        {
          id: 'cost-reduction',
          label: 'Cost Reduction',
          description: 'Optimize expenses and improve profitability',
          icon: '💰',
        },
        {
          id: 'yield-improvement',
          label: 'Yield Improvement',
          description: 'Maximize production and harvest quality',
          icon: '📈',
        },
        {
          id: 'water-quality',
          label: 'Water Quality',
          description: 'Maintain optimal aquatic conditions',
          icon: '💧',
        },
        {
          id: 'all',
          label: 'Balanced Approach',
          description: 'Focus on all aspects equally',
          icon: '⚖️',
        },
      ],
    },
    {
      id: 'experience',
      title: 'What is your experience level?',
      description: 'We'll adjust guidance and complexity accordingly',
      question: 'How would you describe your farming experience?',
      options: [
        {
          id: 'beginner',
          label: 'Beginner',
          description: 'New to shrimp farming',
          icon: '🌱',
        },
        {
          id: 'intermediate',
          label: 'Intermediate',
          description: '1-3 years of experience',
          icon: '🌿',
        },
        {
          id: 'advanced',
          label: 'Advanced',
          description: '3+ years of experience',
          icon: '🌳',
        },
      ],
    },
    {
      id: 'ponds',
      title: 'How many ponds are you managing?',
      description: 'This helps us optimize your dashboard view',
      question: 'Select your pond count:',
      options: [
        {
          id: '1-3',
          label: '1-3 Ponds',
          description: 'Small-scale operation',
          icon: '1️⃣',
        },
        {
          id: '4-10',
          label: '4-10 Ponds',
          description: 'Medium-scale operation',
          icon: '4️⃣',
        },
        {
          id: '10+',
          label: '10+ Ponds',
          description: 'Large-scale operation',
          icon: '🔟',
        },
      ],
    },
  ];

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleOptionSelect = (optionId: string) => {
    setState({
      ...state,
      [step.id]: optionId,
    });
  };

  const handleNext = async () => {
    if (!state[step.id as keyof OnboardingState]) {
      toast({
        variant: 'destructive',
        title: 'Selection Required',
        description: 'Please select an option to continue',
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding preferences
      const preferences = {
        role: state.userRole,
        goal: state.goal,
        experience: state.experience,
        pondCount: state.pondCount,
        completedAt: new Date().toISOString(),
      };

      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('onboardingPreferences', JSON.stringify(preferences));

      toast({
        title: '✅ Welcome to Shrimp Farming Pro!',
        description: 'Your personalized experience is ready',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete onboarding',
      });
    }
  };

  const selectedOption = step.options.find(
    (opt) => opt.id === state[step.id as keyof OnboardingState]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <DialogTitle>Welcome to Shrimp Farming Pro</DialogTitle>
          </div>
          <DialogDescription>
            Let's set up your personalized experience in 4 quick steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              <Badge variant="outline">{Math.round(progress)}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground mb-6">{step.description}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">{step.question}</p>
              <RadioGroup
                value={state[step.id as keyof OnboardingState]}
                onValueChange={handleOptionSelect}
              >
                <div className="grid gap-3">
                  {step.options.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Label
                        htmlFor={option.id}
                        className="flex-1 cursor-pointer p-3 rounded-lg border border-transparent hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{option.icon}</span>
                          <div>
                            <p className="font-medium">{option.label}</p>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Selected Summary */}
          {selectedOption && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900">
                    You selected: <span className="font-semibold">{selectedOption.label}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              ← Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="min-w-32"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="text-xs text-muted-foreground text-center">
            💡 You can change these preferences anytime in your settings
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
