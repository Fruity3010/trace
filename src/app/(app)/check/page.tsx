import { CheckForm } from '@/components/CheckForm';
import { page, TopBar } from '@/components/ui';

export default function CheckPage() {
  return (
    <div className={`${page.narrow} animate-rise`}>
      <div className="lg:hidden"><TopBar /></div>
      <h1 className="font-serif text-[40px] font-medium leading-none lg:mt-10 lg:text-[52px]">Check an account</h1>
      <p className="mt-2 text-[17px] text-ink-2">Before you send money. Free, no sign-up.</p>
      <div className="card mt-6 p-6 lg:p-8"><CheckForm autoFocus /></div>
    </div>
  );
}
