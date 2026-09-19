import { AccountResult } from './AccountResult';

export default async function AccountPage({ params, searchParams }: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ bank?: string }>;
}) {
  const [{ number }, { bank }] = await Promise.all([params, searchParams]);
  return <AccountResult number={number} bank={bank ?? null} />;
}
