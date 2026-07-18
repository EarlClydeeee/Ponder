/**
 * OpenAI Realtime WebRTC client — the ONLY file that opens a peer connection.
 * Ported verbatim from /test/speech-to-speech (proven against the live GA API);
 * token fetch re-pointed at the shared /api/realtime-token route. RFC §4.
 * Owner: David.
 */
import { REALTIME_CALLS_URL, REALTIME_MODEL } from "./realtimeConfig";
import type { RealtimeTokenResponse, RealtimeVoice } from "./types";

export interface RealtimeConnectOptions {
  persona: { voice: RealtimeVoice; systemPrompt: string };
  sendGreeting?: boolean;
}

interface RealtimeCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onUserTranscript: (text: string) => void;
  /** Fires when the user's speech could not be transcribed at all. */
  onUserTranscriptFailed?: () => void;
  onAssistantTranscript: (text: string, final: boolean) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onClose: () => void;
  onError?: (message: string) => void;
}

export class RealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private micStream: MediaStream | null = null;
  private micTrack: MediaStreamTrack | null = null;
  private assistantPartial = "";
  /** Per-item user transcription deltas, keyed by conversation item id. */
  private userPartials = new Map<string, string>();
  /** Whether the current response's audio has started playing out. */
  private audioStarted = false;

  constructor(private callbacks: RealtimeCallbacks) {}

  async connect(options: RealtimeConnectOptions): Promise<void> {
    const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
    if (!tokenRes.ok) throw new Error("token_failed");
    const { token } = (await tokenRes.json()) as RealtimeTokenResponse;

    const pc = new RTCPeerConnection();
    this.pc = pc;

    pc.ontrack = (e) => this.callbacks.onRemoteStream(e.streams[0]);
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed" ||
        pc.connectionState === "disconnected"
      ) {
        this.callbacks.onClose();
      }
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      const denied =
        error instanceof DOMException && error.name === "NotAllowedError";
      throw new Error(denied ? "mic_denied" : "realtime_failed");
    }

    this.micTrack = this.micStream.getAudioTracks()[0];
    this.micTrack.enabled = false;
    pc.addTrack(this.micTrack, this.micStream);

    this.dc = pc.createDataChannel("oai-events");
    this.dc.onmessage = (e) => void this.handleEvent(JSON.parse(e.data));
    this.dc.onopen = () => this.configureSession(options);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(REALTIME_CALLS_URL, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/sdp",
      },
    });
    if (!sdpRes.ok) throw new Error("realtime_failed");
    await pc.setRemoteDescription({
      type: "answer",
      sdp: await sdpRes.text(),
    });
  }

  private configureSession(options: RealtimeConnectOptions): void {
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        output_modalities: ["audio"],
        instructions: options.persona.systemPrompt,
        tools: [],
        audio: {
          input: {
            turn_detection: null,
            transcription: { model: "whisper-1" },
          },
          output: { voice: options.persona.voice },
        },
      },
    });

    if (options.sendGreeting !== false) {
      this.send({ type: "response.create" });
    }
  }

  private handleEvent(event: Record<string, unknown>): void {
    switch (event.type) {
      case "conversation.item.input_audio_transcription.delta": {
        const itemId = String(event.item_id ?? "");
        this.userPartials.set(
          itemId,
          (this.userPartials.get(itemId) ?? "") + String(event.delta ?? ""),
        );
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = String(event.item_id ?? "");
        // Prefer the final transcript; fall back to accumulated deltas so the
        // user's words still display if the completed event arrives empty.
        const text =
          String(event.transcript ?? "").trim() ||
          (this.userPartials.get(itemId) ?? "").trim();
        this.userPartials.delete(itemId);
        if (text) {
          this.callbacks.onUserTranscript(text);
        } else {
          this.callbacks.onUserTranscriptFailed?.();
        }
        break;
      }
      case "conversation.item.input_audio_transcription.failed":
        this.userPartials.delete(String(event.item_id ?? ""));
        this.callbacks.onUserTranscriptFailed?.();
        break;
      case "response.audio_transcript.delta":
      case "response.output_audio_transcript.delta": {
        this.assistantPartial += String(event.delta ?? "");
        if (this.assistantPartial.trim()) {
          this.callbacks.onAssistantTranscript(this.assistantPartial, false);
        }
        break;
      }
      case "response.audio_transcript.done":
      case "response.output_audio_transcript.done":
        this.assistantPartial = "";
        this.callbacks.onAssistantTranscript(String(event.transcript ?? ""), true);
        break;
      case "response.created":
        this.audioStarted = false;
        this.callbacks.onSpeakingStart?.();
        break;
      // WebRTC-only events tracking actual audio playout — speech ends when
      // the audio stops, not when generation completes (which is earlier).
      case "output_audio_buffer.started":
        this.audioStarted = true;
        this.callbacks.onSpeakingStart?.();
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        this.audioStarted = false;
        this.callbacks.onSpeakingEnd?.();
        break;
      case "response.done":
        // Only end "speaking" here if no audio ever started (e.g. an early
        // cancel or a failed response); otherwise wait for the buffer events.
        if (!this.audioStarted) this.callbacks.onSpeakingEnd?.();
        break;
      case "error":
        this.callbacks.onError?.(
          String(
            (event.error as { message?: string } | undefined)?.message ??
              "Realtime error",
          ),
        );
        break;
    }
  }

  /**
   * Barge-in: cancel generation AND flush the WebRTC output audio buffer.
   * Generation finishes ahead of playback, so response.cancel alone leaves
   * already-generated audio playing; output_audio_buffer.clear stops it.
   */
  cancelResponse(): void {
    this.send({ type: "response.cancel" });
    this.send({ type: "output_audio_buffer.clear" });
  }

  startListening(): void {
    this.send({ type: "input_audio_buffer.clear" });
    if (this.micTrack) this.micTrack.enabled = true;
  }

  stopListening(): void {
    if (this.micTrack) this.micTrack.enabled = false;
    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  sendText(text: string): void {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    this.send({ type: "response.create" });
  }

  private send(payload: unknown): void {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(payload));
  }

  close(): void {
    this.micTrack?.stop();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.dc?.close();
    this.pc?.close();
    this.micStream = null;
    this.micTrack = null;
    this.dc = null;
    this.pc = null;
    this.assistantPartial = "";
    this.userPartials.clear();
    this.audioStarted = false;
  }
}
