import Link from 'next/link';
import { Briefcase } from 'lucide-react'; // Or a more suitable logo icon

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
      <Briefcase className="h-7 w-7 text-primary" />
      <span className="font-headline text-xl font-semibold">
        JobMatch AI
      </span>
    </Link>
  );
}
