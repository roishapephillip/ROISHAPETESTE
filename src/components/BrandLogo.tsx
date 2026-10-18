interface BrandLogoProps {
  compact?: boolean;
  light?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, light = false, className = '' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-black shadow-[0_0_28px_rgba(0,230,118,0.34)]">
        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-[#00E676]/35" />
        <img
          src="/images/IMG-20260430-WA0005.jpg"
          alt="ROI Shape"
          className="h-full w-full object-cover"
        />
      </div>
      {!compact && (
        <div>
          <p className={`text-lg font-extrabold leading-none tracking-tight ${light ? 'text-white' : 'text-ink-950'}`}>ROI Shape</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00E676]">Fullbody Platform</p>
        </div>
      )}
    </div>
  );
}
