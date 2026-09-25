import { Container } from './Container';
import { LogoMark } from './Logo';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <Container className="flex items-center justify-between gap-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <LogoMark className="size-4" />
          <span>Webhook Tester</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-5">
          <nav aria-label="Resources" className="flex items-center gap-4">
            <a href="/docs" className="text-foreground underline decoration-dashed decoration-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground">
              API
            </a>
            <a href="/terms" className="text-foreground underline decoration-dashed decoration-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground">
              Terms
            </a>
            <a href="/privacy" className="text-foreground underline decoration-dashed decoration-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground">
              Privacy
            </a>
          </nav>
          <ThemeSwitcher />
        </div>
      </Container>
    </footer>
  );
}
