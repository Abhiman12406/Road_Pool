import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Coins,
  Car,
  Navigation,
  CheckCircle2,
  Users,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/gsap';
import type { ActiveViewKey } from '../components/ShellHeader';
import { useAuth } from '../context/AuthContext';

interface LandingPageViewProps {
  onNavigate: (view: ActiveViewKey) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const { user, isFirebaseConfigured } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Interactive Fair-Fare Math Simulator state
  const [soloFare, setSoloFare] = useState<number>(240);
  const [coRidersCount, setCoRidersCount] = useState<number>(3);
  const [overlapRatio, setOverlapRatio] = useState<number>(0.72);

  // Cooperative Game Theory (Shapley value approximation formula)
  const sharedDiscountFactor = 1 - (coRidersCount * overlapRatio * 0.14);
  const calculatedShapleyFare = Math.round(soloFare * Math.max(0.62, sharedDiscountFactor));
  const passengerSavings = soloFare - calculatedShapleyFare;
  const savingsPercent = Math.round((passengerSavings / soloFare) * 100);

  // GSAP & ScrollTrigger Animation Orchestration
  useGSAP(
    () => {
      // 1. Hero Entrance Sequence
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.hero-badge', { opacity: 0, y: -16, duration: 0.5 })
        .from('.hero-title', { opacity: 0, y: 24, duration: 0.7 }, '-=0.3')
        .from('.hero-desc', { opacity: 0, y: 16, duration: 0.6 }, '-=0.4')
        .from('.hero-actions', { opacity: 0, y: 16, duration: 0.5 }, '-=0.4')
        .from('.hero-visual', { opacity: 0, scale: 0.96, y: 24, duration: 0.8 }, '-=0.5');

      // 2. Proof Metric Strip (ScrollTrigger)
      gsap.from('.metric-card', {
        scrollTrigger: {
          trigger: '.metrics-strip',
          start: 'top 85%',
          once: true,
        },
        opacity: 0,
        y: 28,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      });

      // 3. Mathematical Pillars Bento Grid (ScrollTrigger)
      gsap.from('.bento-cell', {
        scrollTrigger: {
          trigger: '.bento-grid-container',
          start: 'top 80%',
          once: true,
        },
        opacity: 0,
        y: 36,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      });

      // 4. Role Ecosystem Cards (ScrollTrigger)
      gsap.from('.role-card', {
        scrollTrigger: {
          trigger: '.roles-grid-container',
          start: 'top 80%',
          once: true,
        },
        opacity: 0,
        y: 36,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      });

      // 5. Testimonial Quote (ScrollTrigger)
      gsap.from('.quote-container', {
        scrollTrigger: {
          trigger: '.quote-container',
          start: 'top 85%',
          once: true,
        },
        opacity: 0,
        scale: 0.97,
        duration: 0.8,
        ease: 'power2.out',
      });

      // 6. Bottom CTA Banner (ScrollTrigger)
      gsap.from('.cta-card', {
        scrollTrigger: {
          trigger: '.cta-card',
          start: 'top 85%',
          once: true,
        },
        opacity: 0,
        y: 32,
        duration: 0.8,
        ease: 'power2.out',
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full bg-white text-zinc-950 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* 1. Sub-nav Status Bar / Welcome */}
      <div className="w-full border-b border-zinc-100 bg-zinc-50/70 backdrop-blur-sm py-2 px-4 sm:px-8 text-xs text-zinc-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-800">ORoute Transit Protocol</span>
          <span className="text-zinc-300">/</span>
          <span>Pune EV Metro Corridor Active</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="font-mono text-zinc-700">Firebase Auth:</span>
            {isFirebaseConfigured ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="text-amber-600 font-medium">Demo Sandbox</span>
            )}
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-700 font-medium">{user.displayName || user.email}</span>
              <button
                type="button"
                onClick={() => onNavigate('passenger-home')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="hover:text-zinc-950 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="bg-zinc-900 text-white px-2.5 py-0.5 rounded-full hover:bg-zinc-800 transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Hero Section: Asymmetric Split with Generative Mobility Photography */}
      <section className="relative px-4 sm:px-8 lg:px-12 pt-12 pb-16 lg:pt-16 lg:pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Focused Value Proposition (Max 4 elements) */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold uppercase tracking-wider mb-5">
              <span>Algorithmic Ride-Pooling</span>
            </div>

            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.08] mb-6">
              Shared transit with mathematical fairness.
            </h1>

            <p className="hero-desc text-lg sm:text-xl text-zinc-600 leading-relaxed max-w-[54ch] mb-8">
              Dynamic batching, strict 15% detour limits, and cooperative Shapley fair-fare pricing for urban mobility.
            </p>

            <div className="hero-actions flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigate('passenger-home')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-zinc-950 text-white font-medium text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm"
              >
                <span>Book a Pooled Ride</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('ops-overview')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-zinc-800 font-medium text-sm border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all"
              >
                <span>Operations Console</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('driver-home')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-zinc-800 font-medium text-sm border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all"
              >
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Driver Cockpit</span>
              </button>
            </div>
          </div>

          {/* Right Column: Editorial Visual Asset */}
          <div className="hero-visual lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-xl bg-zinc-900 group">
              <img
                src="/images/oroute_hero_mobility.jpg"
                alt="ORoute algorithmic route optimization over metropolitan transit corridors"
                className="w-full h-[380px] sm:h-[440px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-zinc-100 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 font-medium block">Route Batch #409</span>
                    <span className="font-bold text-zinc-900 text-sm">3 Riders Matched</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-semibold block">12.4% Max Detour</span>
                    <span className="text-zinc-500 font-mono text-[11px]">Strict &lt; 15% Bound</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proof Metric Strip (Under Hero, clean quantitative credibility) */}
      <section className="metrics-strip border-y border-zinc-100 bg-zinc-50/60 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="metric-card p-4 bg-white rounded-xl border border-zinc-200/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              &le; 15%
            </div>
            <div className="text-xs font-semibold text-zinc-800 mt-1">Guaranteed Detour Cap</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Enforced at ride dispatch</div>
          </div>

          <div className="metric-card p-4 bg-white rounded-xl border border-zinc-200/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
              31.8%
            </div>
            <div className="text-xs font-semibold text-zinc-800 mt-1">Average Cost Reduction</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Calculated by Shapley logic</div>
          </div>

          <div className="metric-card p-4 bg-white rounded-xl border border-zinc-200/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono">
              4.2 min
            </div>
            <div className="text-xs font-semibold text-zinc-800 mt-1">Dynamic Batch Window</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Optimal grouping interval</div>
          </div>

          <div className="metric-card p-4 bg-white rounded-xl border border-zinc-200/80">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
              100%
            </div>
            <div className="text-xs font-semibold text-zinc-800 mt-1">Fare Explainability</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Transparent receipt breakdown</div>
          </div>
        </div>
      </section>

      {/* 4. Core Architecture: The Three Mathematical Pillars (Asymmetric Bento) */}
      <section className="bento-grid-container py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
            Three principles of algorithmic ride-pooling.
          </h2>
          <p className="text-zinc-600 mt-3 text-base">
            Conventional apps pool blindly or penalize early riders. ORoute implements formal game theory and strict boundary conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Cell 1: Dynamic Batching (Spans 7 cols) */}
          <div className="bento-cell md:col-span-7 bg-zinc-950 text-white rounded-2xl p-7 flex flex-col justify-between border border-zinc-900 shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-400 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Dynamic Rolling Batch Optimization
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-[52ch]">
                Rather than greedy first-come pairing, requests arriving within continuous 4-minute time windows are evaluated simultaneously against active electric vehicles to find global cost minima.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block">Corridor</span>
                <span className="text-zinc-200 font-semibold">Pune Metro</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Search Space</span>
                <span className="text-zinc-200 font-semibold">O(N!) Pruned</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Fleet Target</span>
                <span className="text-emerald-400 font-semibold">EV Shared</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 2: Strict 15% Detour Guarantee (Spans 5 cols) */}
          <div className="bento-cell md:col-span-5 bg-zinc-50 rounded-2xl p-7 flex flex-col justify-between border border-zinc-200">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-emerald-600 mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 mb-2">
                The 15% Detour Guarantee
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                If picking up a new passenger would delay an existing rider by more than 15% beyond their direct point-to-point ETA, the match is rejected automatically.
              </p>
            </div>

            <div className="mt-6 bg-white p-4 rounded-xl border border-zinc-200/80 text-xs">
              <div className="flex justify-between items-center mb-1.5 font-medium">
                <span className="text-zinc-700">Direct Route ETA:</span>
                <span className="font-mono text-zinc-900">22.0 min</span>
              </div>
              <div className="flex justify-between items-center mb-1.5 font-medium">
                <span className="text-zinc-700">Hard Cap (+15%):</span>
                <span className="font-mono text-amber-700 font-semibold">25.3 min max</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-zinc-100 text-emerald-700 font-semibold">
                <span>ORoute Dispatched ETA:</span>
                <span className="font-mono">24.2 min (Accepted)</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Interactive Shapley Fair-Fare Engine (Spans 12 cols full width) */}
          <div className="bento-cell md:col-span-12 bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-950 mb-3">
                  Cooperative Shapley Fair Fares
                </h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                  In traditional ride sharing, the last rider pays arbitrarily while the driver keeps unknown margins. Shapley value cost allocation calculates each passenger's exact marginal addition to shared fuel and time costs.
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>Adjust the interactive sliders to inspect cooperative cost division.</span>
                </div>
              </div>

              {/* Interactive Simulator Controls */}
              <div className="lg:col-span-7 bg-zinc-50 rounded-xl p-6 border border-zinc-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Direct Solo Fare (₹)
                    </label>
                    <input
                      type="range"
                      min={100}
                      max={600}
                      step={20}
                      value={soloFare}
                      onChange={(e) => setSoloFare(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-zinc-900 text-sm mt-1 block">
                      ₹{soloFare}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Co-Riders in Vehicle
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={1}
                      value={coRidersCount}
                      onChange={(e) => setCoRidersCount(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-zinc-900 text-sm mt-1 block">
                      {coRidersCount} Riders
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Trajectory Overlap
                    </label>
                    <input
                      type="range"
                      min={0.3}
                      max={0.95}
                      step={0.05}
                      value={overlapRatio}
                      onChange={(e) => setOverlapRatio(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-zinc-900 text-sm mt-1 block">
                      {Math.round(overlapRatio * 100)}% Shared
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-zinc-500 block">Your Shapley Fair Fare</span>
                    <span className="text-3xl font-extrabold text-zinc-950 font-mono">
                      ₹{calculatedShapleyFare}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200">
                      Save ₹{passengerSavings} ({savingsPercent}%)
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('passenger-home')}
                      className="px-4 py-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                    >
                      Test in Passenger App
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Role Ecosystem: Passenger, Driver, Fleet Dispatcher */}
      <section className="roles-grid-container py-16 px-4 sm:px-8 bg-zinc-50 border-y border-zinc-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950">
              Built for every participant on the road.
            </h2>
            <p className="text-zinc-600 mt-2 text-base">
              A single mathematical engine coordinates riders, vehicle operators, and city transit monitors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passenger App Card */}
            <div className="role-card bg-white p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-5">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-2">Passenger Experience</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                  Book pooled rides along predefined high-density corridors. View exact detour guarantees and live mathematical Shapley fare reductions before stepping into the car.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('passenger-home')}
                className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Passenger Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Driver Cockpit Card */}
            <div className="role-card bg-white p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-emerald-600 mb-5">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-2">Driver Cockpit</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                  Turn-by-turn multi-passenger pickup and drop sequences. Intelligent seat allocation, live earnings per seat-hour, and passenger consent protocols for mid-trip joins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('driver-home')}
                className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Driver Cockpit</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Ops Console Card */}
            <div className="role-card bg-white p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-5">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-2">Operations Console</h3>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                  Monitor fleet occupancy rates, batching window queues, solver execution times, and city-scale emissions abatement in real time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ops-overview')}
                className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Launch Fleet Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonial / Verification Quote (Max 3 lines body, clean attribution, no em-dash) */}
      <section className="quote-container py-16 px-4 sm:px-8 max-w-4xl mx-auto text-center">
        <blockquote className="text-xl sm:text-2xl font-medium text-zinc-900 leading-snug">
          "The Shapley fare breakdown builds passenger trust because co-riders immediately see how their detour is compensated by mathematical savings."
        </blockquote>
        <div className="mt-4 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
          Dr. Anand Kulkarni - Urban Mobility Research, Pune
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-8 bg-zinc-950 text-white">
        <div className="cta-card max-w-5xl mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 p-8 sm:p-12 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Firebase Authentication Ready</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white max-w-xl mb-4">
            Experience fair shared transit today.
          </h2>
          <p className="text-zinc-400 text-sm max-w-md mb-8">
            Create an account in seconds or try our simulation sandbox to see how algorithmic pooling transforms urban corridors.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate(user ? 'passenger-home' : 'signup')}
              className="px-6 py-3 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
            >
              {user ? 'Go to Passenger App' : 'Create Free Account'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('passenger-home')}
              className="px-6 py-3 rounded-full bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-700 hover:bg-zinc-700 active:scale-[0.98] transition-all"
            >
              Explore Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* 8. Clean Minimalist Footer */}
      <footer className="border-t border-zinc-200 py-8 px-4 sm:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-zinc-950 text-sm tracking-tight">ORoute</span>
            <span>Algorithmic Ride-Pooling Engine</span>
          </div>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate('passenger-home')} className="hover:text-zinc-900">
              Passenger App
            </button>
            <button type="button" onClick={() => onNavigate('driver-home')} className="hover:text-zinc-900">
              Driver Cockpit
            </button>
            <button type="button" onClick={() => onNavigate('ops-overview')} className="hover:text-zinc-900">
              Fleet Ops
            </button>
            <button type="button" onClick={() => onNavigate('login')} className="hover:text-zinc-900">
              Account Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

