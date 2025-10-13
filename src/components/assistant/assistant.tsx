"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Mic, MessagesSquare } from "lucide-react";
import { AssistantDialog } from "./assistant-dialog";
import { cn } from "@/lib/utils";

export function Assistant() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {!isOpen && (
                 <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
                    <Button 
                        size="icon"
                        className={cn(
                            "rounded-full h-16 w-16 bg-primary/90 backdrop-blur-sm shadow-lg hover:bg-primary transition-transform duration-200 ease-in-out hover:scale-105",
                        )}
                        onClick={() => setIsOpen(true)}
                    >
                        <MessagesSquare className="h-7 w-7" />
                    </Button>
                </div>
            )}
            {isOpen && <AssistantDialog isOpen={isOpen} onOpenChange={setIsOpen} />}
        </>
    )
}
