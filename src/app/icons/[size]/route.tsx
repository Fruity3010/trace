import { ImageResponse } from 'next/og';

export function generateStaticParams() {
  return [{ size: '180' }, { size: '192' }, { size: '512' }];
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const s = Math.min(1024, Math.max(32, Number((await params).size) || 192));
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1b1813' }}>
        <svg width={s * 0.56} height={s * 0.56} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="white" strokeWidth="2.2" strokeDasharray="4 3" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </div>
    ),
    { width: s, height: s },
  );
}
