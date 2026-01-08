
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { Check, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

const profiles = ["Ammu", "Vijay", "Divyesh", "Anvika", "Guest"];

export function ProfileSelectorDialog({
  isOpen,
  onOpenChange,
  onProfileSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileSelect: (remember: boolean) => void;
}) {
  const { user, setUser } = useUser();
  const [rememberMe, setRememberMe] = useState(false);

  const handleSelect = (profile: string) => {
    setUser(profile);
    // The dialog will be closed by the button click below
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome Back!</DialogTitle>
          <DialogDescription>
            Please select your profile to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2">
          {profiles.map((profile) => (
            <Button
              key={profile}
              variant={user === profile ? "default" : "outline"}
              className="w-full justify-start text-base py-6"
              onClick={() => handleSelect(profile)}
            >
              <User className="mr-3 h-5 w-5" />
              <span>{profile}</span>
              {user === profile && <Check className="ml-auto h-5 w-5" />}
            </Button>
          ))}
        </div>
         <DialogFooter className="flex-col gap-4 !justify-start pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
            <Label htmlFor="remember-me">Remember my choice</Label>
          </div>
           <Button onClick={() => onProfileSelect(rememberMe)} className="w-full">
            Continue as {user}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
