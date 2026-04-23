'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Sparkles, Plus, Briefcase, LandPlot, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FARM_TYPES, BUSINESS_CATEGORIES } from '@/lib/onboarding-data';
import { useClient } from '@/context/client-context';
import { useUser } from '@/context/user-context';
import { useLanguage } from '@/context/language-context';

type OnboardingState = {
   projectName: string;
  primaryFocus: 'farm' | 'business' | null;
  industryId: string | null;
  selectedCategories: string[];
};

const DEFAULT_COPY = {
   title: 'Welcome to Acc Platform',
   description: 'Professional onboarding & configuration.',
   focusTitle: 'What will you be managing?',
   focusDescription: 'Choose your primary operational focus.',
   farmTitle: 'Farm Management',
   farmDescription: 'Dedicated templates for Agriculture, Aquaculture, and Livestock with specialized industrial tagging.',
   businessTitle: 'Business Operations',
   businessDescription: 'Standard enterprise templates for corporate accounting, services, and payroll management.',
   farmStepTitle: 'Select Industrial Sector',
   farmStepDescription: 'We will initialize your ledger with categories specific to your field.',
   businessStepTitle: 'Accounting Template',
   businessStepDescription: 'Choose a starter ledger or create a custom one.',
   customFarmTitle: 'Custom Setup',
   customFarmDescription: 'Define your own tags from scratch.',
   customBusinessTitle: 'Blank Slate',
   customBusinessDescription: 'Start with zero categories and build your own budget.',
   categoryStepTitle: 'Refine Budget Categories',
   categoryStepDescription: 'Deselect any category you do not need and add your own below.',
   customCategoryLabel: 'Add custom category',
   customCategoryPlaceholder: 'e.g. Electricity, Co-op Fees, Fertilizer',
   customCategoryButton: 'Add category',
   noCategoriesSelected: 'No categories selected yet. Add one to continue.',
   back: 'Back',
   continue: 'Continue',
   startManaging: 'Start Managing',
   finalizing: 'Finalizing...',
};

export function AIOnboardingFlow({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { clientId } = useClient();
  const { selectedProfile } = useUser();
   const { language, translateBatch } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [categoryDraft, setCategoryDraft] = useState('');
   const [copy, setCopy] = useState(DEFAULT_COPY);
  const [state, setState] = useState<OnboardingState>({
      projectName: '',
    primaryFocus: null,
    industryId: null,
    selectedCategories: [],
  });

   useEffect(() => {
      let isActive = true;

      const translateCopy = async () => {
         if (language === 'en') {
            setCopy(DEFAULT_COPY);
            return;
         }

         try {
            const translated = await translateBatch(Object.values(DEFAULT_COPY));
            if (!isActive) {
               return;
            }

            const nextCopy = Object.fromEntries(
               Object.keys(DEFAULT_COPY).map((key, index) => [key, translated[index] ?? DEFAULT_COPY[key as keyof typeof DEFAULT_COPY]])
            ) as typeof DEFAULT_COPY;

            setCopy(nextCopy);
         } catch (error) {
            console.error('Failed to translate onboarding copy:', error);
            if (isActive) {
               setCopy(DEFAULT_COPY);
            }
         }
      };

      translateCopy();

      return () => {
         isActive = false;
      };
   }, [language, translateBatch]);

  // Effect to sync categories when industry changes
  useEffect(() => {
    if (state.industryId) {
       if (state.primaryFocus === 'farm') {
          const industry = FARM_TYPES.find(t => t.id === state.industryId);
          if (industry) setState(s => ({ ...s, selectedCategories: [...industry.presetCategories] }));
       } else if (state.primaryFocus === 'business' && state.industryId === 'standard') {
          setState(s => ({ ...s, selectedCategories: [...BUSINESS_CATEGORIES] }));
       }
    }
  }, [state.industryId, state.primaryFocus]);

  const handleNext = () => {
      if (currentStep === 0 && !state.projectName.trim()) {
         toast({ variant: 'destructive', description: 'Please enter a project name.' });
         return;
      }
    if (currentStep === 0 && !state.primaryFocus) {
      toast({ variant: 'destructive', description: 'Please select a primary focus.' });
      return;
    }
    if (currentStep === 1 && !state.industryId) {
      toast({ variant: 'destructive', description: 'Please select a template.' });
      return;
    }

    if (currentStep < 2) {
       setCurrentStep(prev => prev + 1);
    } else {
       completeOnboarding();
    }
  };

   const addCustomCategory = () => {
      const nextCategory = categoryDraft.trim();

      if (!nextCategory) {
         return;
      }

      setState((current) => {
         if (current.selectedCategories.some((category) => category.toLowerCase() === nextCategory.toLowerCase())) {
            return current;
         }

         return {
            ...current,
            selectedCategories: [...current.selectedCategories, nextCategory],
         };
      });

      setCategoryDraft('');
   };

  const toggleCategory = (category: string) => {
    setState(s => ({
        ...s,
        selectedCategories: s.selectedCategories.includes(category)
            ? s.selectedCategories.filter(c => c !== category)
            : [...s.selectedCategories, category]
    }));
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
         projectName: state.projectName,
            primaryFocus: state.primaryFocus,
            industryId: state.industryId,
            selectedCategories: state.selectedCategories,
            clientId,
            profileId: selectedProfile
        }),
      });

         if (typeof window !== 'undefined') {
            const onboardingKey = `onboardingComplete:${selectedProfile || clientId || 'default'}`;
            localStorage.setItem('onboardingComplete', 'true');
            localStorage.setItem(onboardingKey, 'true');
            localStorage.removeItem('newAccountJustCreated');
         }

         toast({ title: 'Setup Complete', description: 'Your workspace has been customized!' });
      onOpenChange(false);

         window.location.reload();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete setup.' });
    } finally {
      setIsSubmitting(false);
    }
  };

   const stepsCount = 3;
  const progress = ((currentStep + 1) / stepsCount) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-4xl w-[95vw] sm:w-[85vw] max-h-[92dvh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
                  <DialogTitle className="text-2xl">{copy.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground mt-2">
                  {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60">
                Phase {currentStep + 1} / {stepsCount}
              </span>
              <span className="text-xs font-bold text-indigo-500">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-slate-100 dark:bg-slate-800" />
        </div>

            <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div>
                                     <h3 className="text-xl font-bold">Project Name</h3>
                                     <p className="text-slate-500 text-sm">Name the project before choosing how you want to organize it.</p>
               </div>

                      <div className="space-y-2">
                         <Input
                            value={state.projectName}
                            onChange={(event) => setState((current) => ({ ...current, projectName: event.target.value }))}
                            placeholder="e.g. Q2 Harvest Plan or West Wing Office"
                            className="h-12 text-base"
                         />
                         <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Give your ledger a professional title</p>
                      </div>

                      <div>
                                     <h3 className="text-xl font-bold">{copy.focusTitle}</h3>
                                     <p className="text-slate-500 text-sm">{copy.focusDescription}</p>
                      </div>
               
               <div className="grid sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setState({ ...state, primaryFocus: 'farm', industryId: null })}
                    className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all ${state.primaryFocus === 'farm' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 shadow-sm'}`}
                  >
                     <div className={`p-4 rounded-xl w-fit mb-6 transition-colors ${state.primaryFocus === 'farm' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        <LandPlot size={28} />
                     </div>
                     <h4 className="text-lg font-bold mb-2">{copy.farmTitle}</h4>
                     <p className="text-slate-500 text-xs leading-relaxed">{copy.farmDescription}</p>
                  </div>

                  <div 
                    onClick={() => setState({ ...state, primaryFocus: 'business', industryId: null })}
                    className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all ${state.primaryFocus === 'business' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 shadow-sm'}`}
                  >
                     <div className={`p-4 rounded-xl w-fit mb-6 transition-colors ${state.primaryFocus === 'business' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                        <Briefcase size={28} />
                     </div>
                     <h4 className="text-lg font-bold mb-2">{copy.businessTitle}</h4>
                     <p className="text-slate-500 text-xs leading-relaxed">{copy.businessDescription}</p>
                  </div>
               </div>
            </div>
          )}

          {currentStep === 1 && state.primaryFocus === 'farm' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                 <h3 className="text-xl font-bold">{copy.farmStepTitle}</h3>
                 <p className="text-slate-500 text-sm">{copy.farmStepDescription}</p>
               </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                   {FARM_TYPES.map((type) => (
                      <div 
                         key={type.id}
                         onClick={() => setState({ ...state, industryId: type.id })}
                         className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${state.industryId === type.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                         <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                <type.icon size={18} className="text-indigo-600" />
                             </div>
                             <span className="font-bold text-sm tracking-tight">{type.title}</span>
                         </div>
                         <p className="text-[11px] text-muted-foreground line-clamp-2">{type.description}</p>
                      </div>
                   ))}

                   <div 
                         onClick={() => setState({ ...state, industryId: 'custom' })}
                         className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-all ${state.industryId === 'custom' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200'}`}
                      >
                         <Plus size={20} className="mb-2 text-slate-400" />
                         <span className="font-bold text-sm">{copy.customFarmTitle}</span>
                         <span className="text-[10px] text-slate-400">{copy.customFarmDescription}</span>
                   </div>
                </div>
             </div>
          )}

          {currentStep === 1 && state.primaryFocus === 'business' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-bold">{copy.businessStepTitle}</h3>
                  <p className="text-slate-500 text-sm">{copy.businessStepDescription}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                     <div 
                         onClick={() => setState({ ...state, industryId: 'standard' })}
                         className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${state.industryId === 'standard' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                         <div className="font-bold mb-2 uppercase text-xs tracking-widest text-indigo-500">Standard</div>
                         <h4 className="font-bold mb-2">Business Template</h4>
                         <p className="text-xs text-slate-500">Includes Payroll, Utilities, Rent, Marketing, and Tax categories.</p>
                      </div>

                      <div 
                         onClick={() => setState({ ...state, industryId: 'custom' })}
                         className={`p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${state.industryId === 'custom' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                         <div className="font-bold mb-2 uppercase text-xs tracking-widest text-slate-400">Custom</div>
                         <h4 className="font-bold mb-2">{copy.customBusinessTitle}</h4>
                         <p className="text-xs text-slate-500">{copy.customBusinessDescription}</p>
                      </div>
                </div>
             </div>
          )}

          {currentStep === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                     <h3 className="text-xl font-bold">{copy.categoryStepTitle}</h3>
                     <p className="text-slate-500 text-sm">{copy.categoryStepDescription}</p>
                </div>

                <Card className="border-slate-100 dark:border-slate-800 shadow-none">
                     <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Input
                              value={categoryDraft}
                              onChange={(event) => setCategoryDraft(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                 event.preventDefault();
                                 addCustomCategory();
                                }
                              }}
                              placeholder={copy.customCategoryPlaceholder}
                              className="h-11"
                           />
                           <Button type="button" onClick={addCustomCategory} className="shrink-0">
                              <Plus className="mr-2 h-4 w-4" />
                              {copy.customCategoryButton}
                           </Button>
                        </div>

                        <div className="max-h-[42vh] overflow-y-auto pr-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                             {state.selectedCategories.map((cat) => (
                                <div key={cat} className="flex items-center space-x-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                   <Checkbox 
                                      id={cat} 
                                      checked={state.selectedCategories.includes(cat)}
                                      onCheckedChange={() => toggleCategory(cat)}
                                      className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                   />
                                   <label htmlFor={cat} className="text-sm font-medium leading-none cursor-pointer hover:text-indigo-600 transition-colors flex-1">
                                      {cat}
                                   </label>
                                   {state.industryId === 'custom' && (
                                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] uppercase tracking-widest text-slate-500">
                                      custom
                                    </Badge>
                                   )}
                                </div>
                             ))}
                             {state.selectedCategories.length === 0 && (
                                <p className="col-span-full text-center py-8 text-slate-400 italic">{copy.noCategoriesSelected}</p>
                             )}
                          </div>
                        </div>
                    </CardContent>
                </Card>
             </div>
          )}
        </ScrollArea>

        <div className="p-6 border-t bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
               <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0 || isSubmitting} className="font-bold">
                  <ChevronLeft className="mr-2 h-4 w-4" /> {copy.back}
            </Button>
            <Button onClick={handleNext} disabled={isSubmitting} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-lg shadow-indigo-200 dark:shadow-none">
                  {isSubmitting ? copy.finalizing : currentStep === stepsCount - 1 ? copy.startManaging : copy.continue}
                {!isSubmitting && currentStep < stepsCount - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
