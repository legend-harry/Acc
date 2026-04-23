"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context";

export default function RegisterClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    mobile: "",
    email: "",
    industry: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.fullName || !formData.mobile || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    setUser(formData.fullName);
    localStorage.setItem(
      "activeClientId",
      formData.businessName.toLowerCase().replace(/\s+/g, "-")
    );

    toast({
      title: "Registration Successful",
      description: `Welcome aboard, ${formData.fullName}!`,
    });

    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <>
      <style jsx global>{`
        .auth-mesh {
          background-image:
            radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 0%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
        }

        .auth-glass-input {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
        }

        .auth-focus-glow:focus-within {
          box-shadow: 0 0 0 4px rgba(78, 222, 163, 0.2);
        }

        .auth-ledger {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(187, 202, 191, 0.2);
        }
      `}</style>

      <div className="hidden md:flex min-h-screen flex-col bg-surface font-body text-on-surface selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
        <main className="min-h-screen flex flex-row">
          <section className="relative w-[55%] bg-slate-950 flex flex-col justify-between p-10 lg:p-16 overflow-hidden">
            <div className="absolute inset-0 auth-mesh pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_balance_wallet
                  </span>
                </div>
                <span className="text-2xl font-headline font-extrabold tracking-tight text-white">
                  ExpenseWise
                </span>
              </div>
            </div>

            <div className="relative z-10 max-w-lg mt-12 lg:mt-0">
              <h1 className="text-white font-headline text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
                Intelligent <span className="text-primary-container">Wealth</span> Management
              </h1>
              <p className="mt-6 text-slate-400 text-lg leading-relaxed">
                Harness the power of AI-driven insights to optimize your spend, grow your capital, and master your financial future.
              </p>

              <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg">
                    <span className="material-symbols-outlined text-primary-fixed-dim">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-time Optimization</h3>
                    <p className="text-slate-500 text-sm">Automated categorizations that save hours of manual entry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg">
                    <span className="material-symbols-outlined text-primary-fixed-dim">security</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Bank-Grade Security</h3>
                    <p className="text-slate-500 text-sm">AES-256 encryption and SOC2 Type II compliance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-12">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-700" />
                  <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-600" />
                  <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Trusted by 10,000+ businesses worldwide</p>
              </div>
            </div>
          </section>

          <section className="w-[45%] bg-surface flex items-center justify-center p-8 lg:p-16 relative">
            <div className="w-full max-w-md">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-headline font-bold text-on-surface">Create Account</h2>
                <p className="text-on-surface-variant mt-2">Register your business to start precision wealth management.</p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-businessName">Business Name</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">apartment</span>
                    <input
                      id="desktop-businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm"
                      placeholder="Apex Aquaculture Ltd."
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-fullName">Full Name</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                    <input
                      id="desktop-fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-email">Email Address</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">alternate_email</span>
                    <input
                      id="desktop-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-mobile">Mobile Number</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">call</span>
                    <input
                      id="desktop-mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-password">Password</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input
                      id="desktop-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-industry">Industry</label>
                  <div className="relative group auth-focus-glow rounded-lg transition-all duration-200">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">domain</span>
                    <select
                      id="desktop-industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 auth-glass-input border-none rounded-lg text-on-surface focus:ring-0 text-sm transition-all shadow-sm"
                    >
                      <option value="">Select industry</option>
                      <option value="aquaculture">Aquaculture & FMCG</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="finance">Capital & Finance</option>
                      <option value="retail">Retail & E-commerce</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-lg shadow-[0_8px_24px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Create Enterprise Account"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-on-surface-variant">
                Already have an account?
                <button
                  className="font-bold text-primary hover:underline transition-all ml-1"
                  type="button"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
              </p>
            </div>

            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-fixed-dim/10 rounded-full blur-3xl pointer-events-none" />
          </section>
        </main>

        <footer className="flex flex-col lg:flex-row justify-between items-center w-full px-8 py-6 border-t border-slate-100 bg-surface-container font-inter text-xs tracking-wide">
          <div className="text-slate-500 mb-4 lg:mb-0">© 2026 ExpenseWise Wealth Management. Member FINRA/SIPC.</div>
          <div className="flex gap-6">
            <a className="text-slate-500 hover:text-emerald-500 transition-colors" href="#">Privacy Policy</a>
            <a className="text-slate-500 hover:text-emerald-500 transition-colors" href="#">Terms of Service</a>
            <a className="text-slate-500 hover:text-emerald-500 transition-colors" href="#">Security Disclosure</a>
            <a className="text-slate-500 hover:text-emerald-500 transition-colors" href="#">Contact</a>
          </div>
        </footer>
      </div>

      <div className="md:hidden bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col relative overflow-hidden">
        <header className="fixed top-0 w-full z-50 bg-[#f8f9ff]/85 backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,32,0.06)] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-700">account_balance</span>
            <span className="text-emerald-900 font-extrabold tracking-tighter font-headline">PRISM WEALTH</span>
          </div>
          <div className="bg-slate-200/20 w-8 h-8 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-500 text-sm">help_outline</span>
          </div>
        </header>

        <main className="flex-grow pt-24 pb-12 px-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md mb-10 text-center">
            <div className="inline-block mb-4 px-3 py-1 bg-primary-container/10 rounded-full">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary font-label">Financial Excellence</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-on-surface mb-2">
              Intelligent <span className="text-primary">Wealth</span> Management
            </h1>
            <p className="text-on-surface-variant text-sm px-4">
              Access your global portfolio with institutional-grade precision and clarity.
            </p>
          </div>

          <div className="w-full max-w-md auth-ledger rounded-[20px] p-8 shadow-[0_8px_32px_rgba(25,28,32,0.04)] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h2 className="font-headline font-bold text-xl mb-6 text-on-surface">Create Account</h2>
              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-businessName">
                    Business Name
                  </label>
                  <div className="relative group">
                    <input
                      id="mobile-businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm placeholder:text-slate-400"
                      placeholder="Apex Aquaculture Ltd."
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">apartment</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-fullName">
                    Full Name
                  </label>
                  <div className="relative group">
                    <input
                      id="mobile-fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm placeholder:text-slate-400"
                      placeholder="John Doe"
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-email">
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      id="mobile-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm placeholder:text-slate-400"
                      placeholder="name@firm.com"
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-mobile">
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <input
                      id="mobile-mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm placeholder:text-slate-400"
                      placeholder="+91 98765 43210"
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-password">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      id="mobile-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm placeholder:text-slate-400"
                      placeholder="••••••••"
                      required
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-industry">
                    Industry
                  </label>
                  <select
                    id="mobile-industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-fixed-dim/30 transition-all outline-none text-sm"
                  >
                    <option value="">Select industry</option>
                    <option value="aquaculture">Aquaculture & FMCG</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="finance">Capital & Finance</option>
                    <option value="retail">Retail & E-commerce</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  className="w-full py-4 mt-2 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform duration-200 font-headline tracking-wide"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Already have an account?
              <button
                className="text-primary font-bold hover:underline ml-1"
                type="button"
                onClick={() => router.push("/login")}
              >
                Sign in
              </button>
            </p>
          </div>
        </main>

        <section className="px-6 mb-12">
          <div className="bg-surface-container-low rounded-[24px] p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white">verified_user</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">Bank-Grade Security</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your data is encrypted with 256-bit AES and protected by multi-factor authentication.
              </p>
            </div>
          </div>
        </section>

        <div className="fixed top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="h-8" />
      </div>
    </>
  );
}
