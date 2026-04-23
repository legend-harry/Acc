"use client";

import { createClient } from "@/lib/supabase/client";
import { FormEvent } from "react";

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

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error("GitHub login failed:", error.message);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-white">
      <div className="hidden min-h-screen md:flex md:flex-col">
        <main className="min-h-[calc(100vh-4.5rem)] flex flex-col md:flex-row">
          <section className="relative w-full md:w-1/2 lg:w-[55%] bg-slate-950 flex flex-col justify-between p-8 md:p-16 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_0%_0%,hsla(161,84%,39%,0.15)_0px,transparent_50%),radial-gradient(at_50%_0%,hsla(161,84%,39%,0.1)_0px,transparent_50%),radial-gradient(at_100%_0%,hsla(161,84%,39%,0.05)_0px,transparent_50%)]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                </div>
                <span className="text-2xl font-headline font-extrabold tracking-tight text-white">ExpenseWise</span>
              </div>
            </div>

            <div className="relative z-10 max-w-lg mt-12 md:mt-0">
              <h1 className="text-white font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Intelligent <span className="text-primary-container">Wealth</span> Management
              </h1>
              <p className="mt-6 text-slate-400 text-lg md:text-xl leading-relaxed">
                Harness the power of AI-driven insights to optimize your spend, grow your capital, and master your financial future.
              </p>
              <div className="mt-12 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg">
                    <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Real-time Optimization</h3>
                    <p className="text-slate-500 text-sm">Automated categorizations that save hours of manual entry.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg">
                    <span className="material-symbols-outlined text-primary-container">security</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Bank-Grade Security</h3>
                    <p className="text-slate-500 text-sm">AES-256 encryption and SOC2 Type II compliance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-12 md:mt-0">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZf-cXD4vzykhpjE_L5AjhjXjwQ_vFP4L012zFK0nWLmMkL8dhbDZKdTpKjMhoTZ2KVpvFAgwccfNXAdi5yrrTcRHd-2dbKVnrKXp59XzhnWSy9vC7rPUusvEtXgvCI0Baq0mXJQ7RqcHGqstj2CSfPKqMnQZZaQBDqzKYrCI5Xt-kySz6bHuPAzs8apjL0ckHx6jZ6SL7gv3UMljHdReJ-2jo4S2Gel1XnZbEeOTAs2SHTEaBOvLPYgV1ztPNi-4BrC9O0Ujy2IdT" alt="User avatar one" />
                  <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHvhYVY8eXBVps-oIqF3K-dLR2a4asdaldRUPhUu8tXIJbi1B0Wu2Ld5_qhbWJhmzrxqSSmDau8pOJe9XaOr1SFKdMy70JGxMo_aEZN5cU-wy97iBnDdJd5MQYtRzmcywVaMYgNRwU-zBbqLmMzQICUfonqA9Xigi_rcDHObkJayePKh8gNQJ11neeJfjuJXnL0yd2R81Ba3DW_b8H8QvPxP44s0JFdxdL9vv20z3rGOrINflK6IQ7SGzjiEDxgyJkinKll2-tUhdo" alt="User avatar two" />
                  <img className="w-10 h-10 rounded-full border-2 border-slate-950 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh0Jnaov6Ve3JUW10nJcW0ICVUG8uIR8jHZpIPXP8WWHG6UuBVpVl_x7opY4iJ6zOSbn_zfzoozRldCvi5wiKhKFl7Fms8eMOoUG6_h5fIkbNSDozN3BIWDOa-mBWPvyqquiobMt-6WWTsleEfv3N-aQaj04y5SwJXJXwiGls2mp3d092BQa9e3u4Z6blqZFuWVLiF5Pu78FxTYVNzoyblSVj7o3kUkUVhenDZ4uz9kiIxQB2wLXf7O14z0qGOHm7cT-ANXkRxOv7i" alt="User avatar three" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Trusted by 10,000+ businesses worldwide</p>
              </div>
            </div>
          </section>

          <section className="w-full md:w-1/2 lg:w-[45%] bg-surface flex items-center justify-center p-8 md:p-12 lg:p-24 relative">
            <div className="w-full max-w-md">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl font-headline font-bold text-on-surface">Welcome Back</h2>
                <p className="text-on-surface-variant mt-2">Log in to manage your precision wealth portfolio.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface ml-1" htmlFor="desktop-email">Email Address</label>
                  <div className="relative rounded-lg transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(78,222,163,0.2)]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">alternate_email</span>
                    <input id="desktop-email" className="w-full pl-12 pr-4 py-4 bg-white/85 backdrop-blur-md border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm" placeholder="name@company.com" type="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-on-surface" htmlFor="desktop-password">Password</label>
                    <a className="text-xs font-bold text-primary hover:text-primary-container transition-colors" href="#">Forgot Password?</a>
                  </div>
                  <div className="relative rounded-lg transition-all duration-200 focus-within:shadow-[0_0_0_4px_rgba(78,222,163,0.2)]">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                    <input id="desktop-password" className="w-full pl-12 pr-12 py-4 bg-white/85 backdrop-blur-md border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-0 text-sm transition-all shadow-sm" placeholder="••••••••" type="password" />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" type="button">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                  </div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-lg shadow-[0_8px_24px_rgba(16,185,129,0.2)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200" type="submit">
                  Sign In to Dashboard
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-container-high" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-surface px-4 text-outline">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-lg font-semibold transition-all duration-200 group" onClick={handleGoogleLogin} type="button">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm">Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 px-4 py-3 bg-surface-container-low hover:bg-surface-container-high text-on-surface rounded-lg font-semibold transition-all duration-200 group" onClick={handleGithubLogin} type="button">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-sm">GitHub</span>
                </button>
              </div>

              <p className="mt-10 text-center text-sm text-on-surface-variant">
                Don&apos;t have an account?
                <a className="font-bold text-primary hover:underline transition-all ml-1" href="#">Start free trial</a>
              </p>
            </div>

            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          </section>
        </main>

        <footer className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-6 border-t border-surface-container-high bg-surface-container font-body text-xs tracking-wide">
          <div className="text-muted-foreground mb-4 md:mb-0">
            © 2026 ExpenseWise Wealth Management. Member FINRA/SIPC.
          </div>
          <div className="flex gap-6">
            <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Security Disclosure</a>
            <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </footer>
      </div>

      <div className="md:hidden min-h-screen bg-surface font-body text-on-surface antialiased flex flex-col">
        <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,32,0.06)] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            <span className="text-primary font-extrabold tracking-tighter font-headline">EXPENSEWISE</span>
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

          <div className="w-full max-w-md bg-white/85 backdrop-blur-md rounded-[20px] p-8 shadow-[0_8px_32px_rgba(25,28,32,0.04)] relative overflow-hidden border border-outline-variant/20">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h2 className="font-headline font-bold text-xl mb-6 text-on-surface">Welcome Back</h2>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant ml-1" htmlFor="mobile-email">Email Address</label>
                  <div className="relative group">
                    <input id="mobile-email" className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-container/30 transition-all outline-none text-sm placeholder:text-slate-400" placeholder="name@firm.com" type="email" />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant" htmlFor="mobile-password">Password</label>
                    <a className="text-[11px] font-semibold text-primary hover:underline" href="#">Forgot?</a>
                  </div>
                  <div className="relative group">
                    <input id="mobile-password" className="w-full px-4 py-3.5 bg-surface-container-lowest rounded-xl border-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary-container/30 transition-all outline-none text-sm placeholder:text-slate-400" placeholder="••••••••" type="password" />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                  </div>
                </div>

                <button className="w-full py-4 mt-2 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform duration-200 font-headline tracking-wide" type="submit">
                  Sign In to Dashboard
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-outline-variant/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface-container-lowest px-4 text-on-surface-variant font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors active:scale-95" type="button" onClick={handleGoogleLogin}>
                  <img alt="Google logo" className="w-5 h-5 object-contain" src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" />
                  <span className="text-xs font-semibold text-on-surface">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors active:scale-95" type="button" onClick={handleGithubLogin}>
                  <span className="material-symbols-outlined text-xl">terminal</span>
                  <span className="text-xs font-semibold text-on-surface">GitHub</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              New to ExpenseWise?
              <a className="text-primary font-bold hover:underline ml-1" href="#">Start free trial</a>
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

        <div className="h-8" />

        <div className="fixed top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      </div>
    </div>
  );
}
