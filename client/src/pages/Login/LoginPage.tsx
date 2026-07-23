/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrandPanel } from '../../components/auth/BrandPanel';
import { LoginForm } from '../../components/auth/LoginForm';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row font-sans bg-[#FAFAFA] antialiased">
      
      {/* 45% Left Branding Column Panel */}
      <BrandPanel />

      {/* 55% Right Main Login Form Column Panel */}
      <div className="flex-1 lg:w-[55%] flex flex-col justify-center items-center p-6 md:p-10 lg:p-14 bg-[#FAFAFA] min-h-screen">
        
        {/* Premium Enterprise Login Card (Width 480px, 20px radius, #EAEAEA border, 48px padding, soft shadow) */}
        <div className="w-full max-w-[480px] bg-white border border-[#EAEAEA] rounded-[20px] p-8 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.04),0_2px_10px_rgba(0,0,0,0.02)]">
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>

      </div>

    </div>
  );
};
