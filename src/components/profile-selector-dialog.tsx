
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { Check, User } from "lucide-react";
import { cn } from "@/lib/utils";

const profiles = ["Ammu", "Vijay", "Divyesh", "Anvika", "Guest"];

export function ProfileSelectorDialog({
  isOpen,
  onOpenChange,
  onProfileSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileSelect: () => void;
}) {
  const { user, setUser } = useUser();

  const handleSelect = (profile: string) => {
    setUser(profile);
    onProfileSelect();
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
      </DialogContent>
    </Dialog>
  );
}
