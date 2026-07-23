/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import heroBg from '../../assets/login/restaurant-hero.png';

export const BrandPanel: React.FC = () => {
  return (
    <div className="relative hidden w-full flex-col lg:flex lg:w-[45%] overflow-hidden select-none min-h-screen">
      
      {/* Full-Height Restaurant Hero Background Image */}
      <img
        src={heroBg}
        alt="Modern Luxury Restaurant Table"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Subtle Dark Overlay (35–45%) for optimal text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/35" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14 min-h-screen">
        
        {/* Top-Left Company Logo (White) */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
            <UtensilsCrossed className="h-5.5 w-5.5 text-white" />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white block leading-none">
              Restaurant <span className="text-orange-400 font-extrabold">POS</span>
            </span>
          </div>
        </div>

        {/* Center Text Section: Headline & Description */}
        <div className="my-auto max-w-lg space-y-4 py-12">
          <h1 className="font-sans text-3xl xl:text-4xl font-bold text-white tracking-tight leading-[1.15]">
            Run Your Restaurant with Confidence
          </h1>
          <p className="text-base xl:text-lg text-slate-200/90 font-normal leading-relaxed">
            Manage orders, billing, tables, inventory, kitchen operations, and staff from one powerful POS platform.
          </p>
        </div>

        {/* Bottom-Left Footer Info */}
        <div className="flex flex-col gap-1 text-xs text-slate-300/80 font-medium">
          <div>© 2026 Restaurant POS</div>
          <div>Version 3.0</div>
        </div>

      </div>

    </div>
  );
};
