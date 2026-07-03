/**
 * Full-page loading state, used as the Suspense fallback for lazy routes.
 */
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <FontAwesomeIcon icon={faRotate} className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}
