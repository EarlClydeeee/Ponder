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
      case "conversation.item.input_audio_transcription.completed":
        this.callbacks.onUserTranscript(String(event.transcript ?? ""));
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
        this.callbacks.onSpeakingStart?.();
        break;
      case "response.done":
        this.callbacks.onSpeakingEnd?.();
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

  /** Barge-in: stop the in-flight assistant response (and its audio). */
  cancelResponse(): void {
    this.send({ type: "response.cancel" });
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
  }
}
