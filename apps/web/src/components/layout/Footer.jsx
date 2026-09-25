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
          <nav aria-label="Legal" className="flex items-center gap-4">
            <a href="/terms" className="underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
              Terms
            </a>
            <a href="/privacy" className="underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground">
              Privacy
            </a>
          </nav>
          <ThemeSwitcher />
        </div>
      </Container>
    </footer>
  );
}
