import { HelpFlow } from './HelpFlow';

export const metadata = { title: 'Get help — TRACE' };

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ account?: string; bank?: string }> }) {
  const { account, bank } = await searchParams;
  return <HelpFlow initialAccount={account ?? ''} initialBank={bank ?? ''} />;
}
