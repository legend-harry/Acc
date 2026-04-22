"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Droplet, Search } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error("Login failed:", error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/6 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-border/20 shadow-ambient-lg glass-card rounded-2xl animate-scale-in">
        <CardHeader className="space-y-4 text-center pb-8 pt-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-ambient transform -rotate-6 transition-transform duration-300 hover:rotate-0 hover:scale-105">
            <Fish className="w-8 h-8 text-white transform rotate-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>ExpenseWise</CardTitle>
            <CardDescription className="text-base text-muted-foreground/70">
              Intelligent Wealth Management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pb-10 px-8">
          
          <Button 
            className="w-full h-12 text-base font-medium bg-card text-foreground border border-border/40 shadow-ambient-sm hover:shadow-ambient hover:bg-muted/50 transition-all duration-200 ease-precision active:scale-[0.98] rounded-xl"
            onClick={handleGoogleLogin}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" aria-hidden="true" fill="currentColor">
               <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground/60">
            Secure enterprise authentication powered by Supabase.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}
