import { faBook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import { HealthStatusCard } from '../components';

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Monorepo Starter</h1>
            <p className="text-lg text-muted-foreground">
              NestJS + Vite + Turborepo + Tailwind v4 + shadcn/ui + Prisma
            </p>
          </div>

          <HealthStatusCard />

          <div className="space-y-1 text-center text-sm text-muted-foreground">
            <p>
              Frontend: <code className="rounded bg-muted px-1">http://localhost:5173</code>
            </p>
            <p>
              Backend: <code className="rounded bg-muted px-1">http://localhost:3000/api/v1</code>
            </p>
          </div>

          <Link to="/api-docs">
            <Button variant="outline" className="gap-2">
              <FontAwesomeIcon icon={faBook} className="h-4 w-4" />
              API Documentation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
