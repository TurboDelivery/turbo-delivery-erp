'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LunionMeetClient } from '@lunionlab/meet-client-js';

/**
 * Hook de salle LUNION Meet VENDORISÉ (copie de @lunionlab/meet-react 0.3.0,
 * MIT) + PARTAGE D'ÉCRAN — le hook publié n'expose ni le client sous-jacent
 * ni les métadonnées de piste, indispensables pour distinguer un écran d'une
 * caméra. À re-synchroniser si le SDK publie la fonctionnalité un jour.
 *
 * Ajouts par rapport à l'original :
 *  - `onTrackMeta` : registre mid → source, pour router les pistes `screen`
 *    vers `ecransDistants` au lieu du flux audio/vidéo principal ;
 *  - `startScreenShare` / `stopScreenShare` : getDisplayMedia → publishTrack →
 *    setTrackSource(mid, 'screen') (mid connu APRÈS la négociation → attente) ;
 *  - `partageActif` : état local du partage.
 */

export interface ParticipantDistant {
  id: string;
  name: string;
  stream: MediaStream;
}

export interface EcranDistant {
  peerId: string;
  name: string;
  stream: MediaStream;
}

interface Options {
  sfuUrl: string;
  room: string;
  name: string;
  token?: string;
  clientId?: string;
  video?: boolean;
  audio?: boolean;
  iceServers?: RTCIceServer[];
}

export function useLunionRoom(options: Options) {
  const { sfuUrl, room, name, token, clientId, video = true, audio = true, iceServers } = options;
  const [status, setStatus] = useState<'idle' | 'connecting' | 'waiting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<ParticipantDistant[]>([]);
  const [ecransDistants, setEcransDistants] = useState<EcranDistant[]>([]);
  const [cameraEnabled, setCameraEnabled] = useState(video);
  const [micEnabled, setMicEnabled] = useState(audio);
  const [partageActif, setPartageActif] = useState(false);

  const clientRef = useRef<LunionMeetClient | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerStreams = useRef(new Map<string, MediaStream>());
  const peerNames = useRef(new Map<string, string>());
  // Partage d'écran : flux local + transceiver publié (pour replaceTrack(null)).
  const partageStreamRef = useRef<MediaStream | null>(null);
  const partageTransceiverRef = useRef<RTCRtpTransceiver | null>(null);
  // Métadonnées de piste : mid → { peerId, source } (peut arriver AVANT ou
  // APRÈS la piste elle-même — les deux registres se recoupent dans rebuild).
  const trackMeta = useRef(new Map<string, { peerId: string; source: string }>());
  // Pistes distantes en attente de classement : mid → { track, streamId }.
  const tracksParMid = useRef(new Map<string, { track: MediaStreamTrack; streamId: string }>());
  // Flux écran par pair (streamId ou peerId).
  const ecranStreams = useRef(new Map<string, MediaStream>());

  const rebuild = useCallback(() => {
    const list: ParticipantDistant[] = [];
    for (const [id, stream] of peerStreams.current) {
      list.push({ id, name: peerNames.current.get(id) ?? 'Invité', stream });
    }
    setParticipants(list);
    const ecrans: EcranDistant[] = [];
    for (const [id, stream] of ecranStreams.current) {
      if (stream.getTracks().some((t) => t.readyState === 'live')) {
        ecrans.push({ peerId: id, name: peerNames.current.get(id) ?? 'Invité', stream });
      }
    }
    setEcransDistants(ecrans);
  }, []);

  /** Route une piste vers le flux principal du pair ou vers son flux écran. */
  const classerPiste = useCallback(
    (mid: string | null, track: MediaStreamTrack, streamId: string) => {
      const meta = mid ? trackMeta.current.get(mid) : undefined;
      const estEcran = meta?.source === 'screen';
      const clePair = meta?.peerId ?? streamId;
      if (estEcran) {
        let stream = ecranStreams.current.get(clePair);
        if (!stream) {
          stream = new MediaStream();
          ecranStreams.current.set(clePair, stream);
        }
        if (!stream.getTracks().includes(track)) stream.addTrack(track);
        // Fin du partage côté émetteur → retirer le flux écran.
        const retirer = () => {
          ecranStreams.current.delete(clePair);
          rebuild();
        };
        track.addEventListener('ended', retirer);
        track.addEventListener('mute', retirer);
      } else {
        let stream = peerStreams.current.get(streamId);
        if (!stream) {
          stream = new MediaStream();
          peerStreams.current.set(streamId, stream);
        }
        if (!stream.getTracks().includes(track)) stream.addTrack(track);
      }
      rebuild();
    },
    [rebuild],
  );

  useEffect(() => {
    let cancelled = false;
    const client = new LunionMeetClient(
      { url: sfuUrl, iceServers },
      {
        onTrack: (track, streams, _receiver, mid) => {
          const s = streams[0];
          if (!s || s.id === (client as unknown as { selfId?: string }).selfId) return;
          if (mid) tracksParMid.current.set(mid, { track, streamId: s.id });
          classerPiste(mid, track, s.id);
        },
        onTrackMeta: (m) => {
          trackMeta.current.set(m.mid, { peerId: m.peerId, source: m.source });
          // La piste est peut-être déjà arrivée SANS méta : la reclasser.
          const attente = tracksParMid.current.get(m.mid);
          if (attente && m.source === 'screen') {
            // La retirer du flux principal où elle a été rangée par défaut.
            const principal = peerStreams.current.get(attente.streamId);
            if (principal && principal.getTracks().includes(attente.track)) {
              principal.removeTrack(attente.track);
            }
            classerPiste(m.mid, attente.track, attente.streamId);
          }
        },
        onWaiting: () => {
          if (!cancelled) setStatus('waiting');
        },
        onPeerJoined: ({ peerId, name: peerName }) => {
          peerNames.current.set(peerId, peerName);
          rebuild();
        },
        onPeerLeft: ({ peerId }) => {
          peerStreams.current.delete(peerId);
          peerNames.current.delete(peerId);
          ecranStreams.current.delete(peerId);
          rebuild();
        },
        onClose: () => {
          if (!cancelled) setStatus('error');
        },
      },
    );
    clientRef.current = client;
    const run = async () => {
      try {
        setStatus('connecting');
        const media = await navigator.mediaDevices.getUserMedia({ video, audio });
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = media;
        setLocalStream(media);
        const welcome = await client.connect(room, name, clientId, token);
        if (cancelled) return;
        for (const p of welcome.peers) peerNames.current.set(p.peerId, p.name);
        const videoTrack = media.getVideoTracks()[0];
        const audioTrack = media.getAudioTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = video;
          client.publishTrack(videoTrack, media, [
            { rid: 'h', maxBitrate: 1_200_000 },
            { rid: 'l', scaleResolutionDownBy: 2, maxBitrate: 250_000 },
          ]);
        }
        if (audioTrack) {
          audioTrack.enabled = audio;
          client.publishTrack(audioTrack, media);
        }
        if (!videoTrack && !audioTrack) client.bootstrapReceiver();
        setStatus('connected');
        rebuild();
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setStatus('error');
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
      client.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      partageStreamRef.current?.getTracks().forEach((t) => t.stop());
      partageStreamRef.current = null;
      peerStreams.current.clear();
      peerNames.current.clear();
      ecranStreams.current.clear();
      trackMeta.current.clear();
      tracksParMid.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sfuUrl, room, token, clientId]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  }, []);

  const stopScreenShare = useCallback(() => {
    partageStreamRef.current?.getTracks().forEach((t) => t.stop());
    partageStreamRef.current = null;
    // Pas d'API unpublish dans le SDK : on vide le sender — le récepteur voit
    // la piste passer en mute et retire le flux écran (cf. classerPiste).
    partageTransceiverRef.current?.sender.replaceTrack(null).catch(() => {});
    partageTransceiverRef.current = null;
    setPartageActif(false);
  }, []);

  const startScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || partageStreamRef.current) return;
    // getDisplayMedia DOIT être appelé depuis un geste utilisateur (clic).
    const display = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const track = display.getVideoTracks()[0];
    if (!track) return;
    partageStreamRef.current = display;
    const transceiver = client.publishTrack(track, display);
    partageTransceiverRef.current = transceiver;
    setPartageActif(true);
    // Le mid n'existe qu'APRÈS la négociation (offer/answer) : on attend qu'il
    // soit posé pour étiqueter la piste « screen » auprès du SFU.
    const etiqueter = (essai: number) => {
      if (transceiver.mid) {
        client.setTrackSource(transceiver.mid, 'screen');
        return;
      }
      if (essai < 25) setTimeout(() => etiqueter(essai + 1), 200);
    };
    etiqueter(0);
    // L'utilisateur peut couper depuis la barre du navigateur (« Arrêter le partage »).
    track.addEventListener('ended', stopScreenShare);
  }, [stopScreenShare]);

  const leave = useCallback(() => {
    stopScreenShare();
    clientRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('idle');
    setParticipants([]);
    setEcransDistants([]);
  }, [stopScreenShare]);

  return {
    status,
    error,
    localStream,
    participants,
    ecransDistants,
    cameraEnabled,
    micEnabled,
    partageActif,
    toggleCamera,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    leave,
  };
}
