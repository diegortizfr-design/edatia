import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdSenseBannerProps {
  slot: string;
  style?: React.CSSProperties;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slot, style }) => {
  const { tenant } = useAuth();

  // If the tenant is premium, do not show ads
  if (tenant?.isPremium) {
    return null;
  }

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Catch silently in development if block-listed or library not loaded
    }
  }, []);

  return (
    <div 
      className="adsense-banner-container no-print flex justify-center items-center overflow-hidden my-4 max-w-full bg-slate-900/10 dark:bg-slate-950/20 border border-slate-800/10 dark:border-slate-850/20 rounded-lg p-2"
      style={{ minHeight: '90px', ...style }}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', ...style }}
        data-ad-client="ca-pub-9138086731888541"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
