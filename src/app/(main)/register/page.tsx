"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";

export default function RegisterClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    email: "",
    industry: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.fullName) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // For now, simple logic: set the user context, set client localStorage 
    setUser(formData.fullName);
    localStorage.setItem("activeClientId", formData.businessName.toLowerCase().replace(/\s+/g, '-'));
    
    toast({
      title: "Registration Successful",
      description: `Welcome aboard, ${formData.fullName}!`,
    });

    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="flex h-full min-h-[85vh] w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Register your Business</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create an enterprise account to manage wealth and assets.
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business or Farm Name <span className="text-destructive">*</span></Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="e.g. Apex Aquaculture Ltd."
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Your Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Primary Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, industry: val }))}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aquaculture">Aquaculture & FMCG</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="finance">Capital & Finance</SelectItem>
                    <SelectItem value="retail">Retail & E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 bg-muted/30 pt-6 rounded-b-xl border-t border-border">
              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold shadow-md" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Enterprise Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
