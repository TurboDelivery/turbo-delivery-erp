'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { socket } from '@/socket';
import { useInvalidateNotifications } from '@/features/notifications';
import type { NotificationVm } from '@/features/notifications';

/**
 * Provider qui écoute le channel SocketIO /notification/erp/{userId} et :
 * 1) déclenche un toast sonner pour la notif live (Lot 4 V44)
 * 2) joue un "ding" de notification via Web Audio API
 * 3) invalide les queries TanStack notifications pour refresh du badge cloche
 *    et de la page /notification sans refetch manuel
 *
 * À monter UNE FOIS dans app/(protected)/layout.tsx (ou un layout au-dessus
 * du dashboard) — le hook s'auto-démonte aux changements de userId
 * (logout/login) pour éviter les fuites d'écoute.
 *
 * Note V44 : la socket actuelle (singleton dans socket.ts) n'envoie PAS
 * d'auth JWT au handshake. Le backend permet l'abonnement libre — un user
 * malveillant pourrait s'abonner au channel d'un autre. À durcir quand le
 * backend supportera auth socket : passer {@code auth: {token: session.user.token}}
 * à io() côté socket.ts + valider côté serveur.
 */

/**
 * Singleton AudioContext partagé pour éviter d'en créer un par notif (les
 * navigateurs limitent le nombre d'AudioContext concurrents — Chrome cap
 * ~6 avant warning). Lazy-init au premier usage car certains navigateurs
 * refusent la construction avant la 1ère interaction utilisateur.
 */
let audioCtx: AudioContext | null = null;

/**
 * Joue un "ding" double-tone (A5 → D6) de ~250ms, généré dynamiquement —
 * pas de fichier audio à héberger. Échoue silencieusement si :
 *  - le navigateur n'a pas l'API (très rare)
 *  - autoplay policy bloque (peu probable car l'user est forcément actif
 *    pour avoir loggé + reçu une notif socket, donc geste utilisateur acquis)
 *  - onglet en arrière-plan avec throttling agressif
 */
function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      console.warn('[NotifSound] Web Audio API non supporté par ce navigateur');
      return;
    }

    if (!audioCtx) audioCtx = new AudioCtor();
    const ctx = audioCtx;

    // Helper qui programme les 2 tons. On l'extrait pour pouvoir le différer
    // si l'AudioContext est suspended (cas Chrome avant 1ère interaction, ou
    // iOS Safari après inactivité — resume() est asynchrone).
    const schedule = () => {
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + startOffset;
        // Volume bumped à 0.5 (était 0.25 — trop faible sur certaines configs).
        // ADSR pour éviter les clicks/pops sur start/stop.
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(880, 0, 0.18); // A5
      playTone(1175, 0.09, 0.22); // D6 — légèrement décalé pour effet "ding-dong"
      console.debug('[NotifSound] played (state=' + ctx.state + ')');
    };

    if (ctx.state === 'suspended') {
      // resume() retourne une promesse — il FAUT attendre qu'elle résolve
      // avant d'enchaîner les start(), sinon les oscillateurs partent à
      // un currentTime invalide et rien n'est audible.
      ctx.resume()
        .then(schedule)
        .catch((err) => console.warn('[NotifSound] resume failed:', err));
    } else {
      schedule();
    }
  } catch (e) {
    console.warn('[NotifSound] erreur:', e);
  }
}

export function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const utilisateurId = session?.user?.id;
  const invalidate = useInvalidateNotifications();

  useEffect(() => {
    if (!utilisateurId) return;

    const channel = `/notification/erp/${utilisateurId}`;

    const onNotification = (raw: unknown) => {
      try {
        // Le backend envoie un JSON.stringify(NotificationTable) — donc une string.
        // Mais on guard pour le cas où un autre service enverrait un objet déjà parsé.
        const data: NotificationVm =
          typeof raw === 'string' ? JSON.parse(raw) : (raw as NotificationVm);

        if (!data || (!data.titre && !data.message)) return;

        // Push toast immédiat (niveau 1 — temps réel)
        toast.info(data.titre || 'Nouvelle notification', {
          description: data.message,
          duration: 6000,
        });

        // Son "ding" — joué en // du toast (pas d'await, ne bloque pas le reste)
        playNotificationSound();

        // Invalidate les queries notifications → badge cloche + page se refresh auto
        invalidate();
      } catch (e) {
        console.error('[NotifSocket] parse error', e);
      }
    };

    socket.on(channel, onNotification);
    return () => {
      socket.off(channel, onNotification);
    };
  }, [utilisateurId, invalidate]);

  return <>{children}</>;
}
