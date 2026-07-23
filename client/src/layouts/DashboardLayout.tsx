/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div id="app-root-layout" className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Top sticky navbar */}
      <Navbar />

      {/* Main body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side navigation */}
        <Sidebar />

        {/* Scrollable central content stage */}
        <main id="app-main-content-scroll" className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-[1600px] space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
