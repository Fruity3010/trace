import { ReportFlow } from './ReportFlow';

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ account?: string; bank?: string }> }) {
  const { account, bank } = await searchParams;
  return <ReportFlow initialAccount={account ?? ''} initialBank={bank ?? ''} />;
}
