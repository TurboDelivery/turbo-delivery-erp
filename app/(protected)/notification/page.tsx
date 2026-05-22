// V44 — refactor : page client + TanStack Query (au lieu du fetch SSR figé).
// Le content gère seul le chargement + filtres via les hooks features/notifications.
import { NotificationContent } from './content';

export default function Page() {
  return <NotificationContent />;
}
