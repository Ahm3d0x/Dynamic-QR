import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md';
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', theme = 'light' }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';
  const primaryColor = theme === 'dark' ? 'text-white' : 'text-[#292824]';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <img
        src="/icon.svg"
        alt="Dynamic QR"
        className={`${iconSize} shrink-0`}
      />
      <span className={`${textSize} font-bold tracking-tight ${primaryColor}`}>
        Dynamic <span className="text-[#D97745]">QR</span>
      </span>
    </span>
  );
};
