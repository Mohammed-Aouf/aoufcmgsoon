
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 print:hidden">
      {/* Thin line at the very top - using a very dark shade from the new palette */}
      <div className="h-0.5 sm:h-1 bg-[hsl(var(--background-start-hsl))]" /> 
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-foreground leading-tight tracking-tighter">
          Aouf
          <br />
          Mohammed
        </Link>
        {/* <Button 
          variant="outline" 
          size="icon" 
          className="bg-card rounded-md border-border hover:bg-secondary w-9 h-9 sm:w-10 sm:h-10"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
        </Button> */}
      </div>
    </header>
  );
}

    
