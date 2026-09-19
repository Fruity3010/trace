// Staff-only areas: HTTP Basic auth against ADMIN_PASSWORD (any username).
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse('Set ADMIN_PASSWORD in .env.local to enable the intelligence dashboard.', { status: 503 });
  }
  const [scheme, encoded] = (req.headers.get('authorization') ?? '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(':') + 1) === password) return NextResponse.next();
  }
  return new NextResponse('Authentication required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="TRACE staff"' } });
}

export const config = {
  matcher: ['/intel/:path*', '/api/admin/:path*', '/api/ai/patterns'],
};
