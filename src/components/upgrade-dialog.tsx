
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { useSubscription } from "@/context/subscription-context";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";


const featureDisplayNames: Record<string, string> = {
    "add-new-project": "creating new projects",
    "ai-insights": "generating AI Insights",
    "export-all": "exporting all your data to CSV",
    "download-pdf": "downloading PDF reports",
    "special-theme": "using special themes",
};

export function UpgradeDialog() {
  const { isUpgradeDialogVisible, closeUpgradeDialog, upgradeSource } = useSubscription();
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/upgrade");
    closeUpgradeDialog();
  };

  const featureName = upgradeSource ? featureDisplayNames[upgradeSource] || "this feature" : "this feature";

  return (
    <AlertDialog open={isUpgradeDialogVisible} onOpenChange={closeUpgradeDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
            <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-yellow-400" />
            </div>
          <AlertDialogTitle className="text-center">Upgrade to Premium</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You have discovered a premium feature! Access {featureName} and more by upgrading your plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button onClick={handleUpgrade}>
                <Sparkles className="mr-2 h-4 w-4" />
                See Premium Options
            </Button>
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
