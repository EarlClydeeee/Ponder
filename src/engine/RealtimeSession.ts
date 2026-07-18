/**
 * OpenAI Realtime over WebRTC (browser transport). RFC §3.
 * Owner: David — no one else opens WebRTC code (workflow principle 1).
 *
 * Ephemeral token comes from /api/realtime-token. The peer connection
 * carries mic audio up and assistant audio down; a data channel carries
 * events (transcripts, tool calls).
 */
import type {
  GenerateSlidesRequest,
  PersonaConfig,
  RealtimeTokenResponse,
} from "./types";

const REALTIME_URL = "https://api.openai.com/v1/realtime";
const REALTIME_MODEL = "gpt-4o-realtime-preview";

interface RealtimeCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onUserTranscript: (text: string) => void;
  onAssistantTranscript: (text: string) => void;
  onToolCall: (
    name: string,
    args: GenerateSlidesRequest,
    callId: string,
  ) => Promise<void>;
  onClose: () => void;
}

const SLIDE_TOOL = {
  type: "function",
  name: "generate_slides",
  description:
    "Generate 1-3 educational illustration slides for a topic being explained.",
  parameters: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Concise topic for the slides" },
      count: { type: "integer", enum: [1, 2, 3] },
      style_hint: { type: "string" },
    },
    required: ["topic", "count", "style_hint"],
  },
};

export class RealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private micStream: MediaStream | null = null;
  private micTrack: MediaStreamTrack | null = null;

  constructor(private callbacks: RealtimeCallbacks) {}

  /** Mint token, open peer connection, configure the persona + tools. */
  async connect(persona: PersonaConfig, photoDataUrl: string): Promise<void> {
    const tokenRes = await fetch("/api/realtime-token", { method: "POST" });
    if (tokenRes.status === 429) throw new Error("daily_limit");
    if (!tokenRes.ok) throw new Error("token_failed");
    const { token } = (await tokenRes.json()) as RealtimeTokenResponse;

    const pc = new RTCPeerConnection();
    this.pc = pc;

    // Assistant audio arrives on a remote track.
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

    // Mic (push-to-talk toggles the track's enabled flag).
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.micTrack = this.micStream.getAudioTracks()[0];
    this.micTrack.enabled = false;
    pc.addTrack(this.micTrack, this.micStream);

    // Data channel for events + tool calls.
    this.dc = pc.createDataChannel("oai-events");
    this.dc.onmessage = (e) => this.handleEvent(JSON.parse(e.data));
    this.dc.onopen = () => this.configureSession(persona, photoDataUrl);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(`${REALTIME_URL}?model=${REALTIME_MODEL}`, {
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

  private configureSession(persona: PersonaConfig, photoDataUrl: string): void {
    this.send({
      type: "session.update",
      session: {
        modalities: ["audio", "text"],
        voice: persona.voice,
        instructions: persona.systemPrompt,
        input_audio_transcription: { model: "whisper-1" },
        tools: [SLIDE_TOOL],
        turn_detection: null, // push-to-talk; we commit manually
      },
    });
    // Seed the vision context with the photo once.
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_image", image_url: photoDataUrl }],
      },
    });
    // Kick off the in-character greeting.
    this.send({ type: "response.create" });
  }

  private async handleEvent(
    event: Record<string, unknown>,
  ): Promise<void> {
    switch (event.type) {
      case "conversation.item.input_audio_transcription.completed":
        this.callbacks.onUserTranscript(String(event.transcript ?? ""));
        break;
      case "response.audio_transcript.done":
        this.callbacks.onAssistantTranscript(String(event.transcript ?? ""));
        break;
      case "response.function_call_arguments.done": {
        const args = JSON.parse(
          String(event.arguments ?? "{}"),
        ) as GenerateSlidesRequest;
        await this.callbacks.onToolCall(
          String(event.name ?? "generate_slides"),
          args,
          String(event.call_id ?? ""),
        );
        break;
      }
    }
  }

  /** Answer a tool call so the model can keep talking. */
  respondToTool(callId: string, output: unknown): void {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(output),
      },
    });
    this.send({ type: "response.create" });
  }

  startListening(): void {
    if (this.micTrack) this.micTrack.enabled = true;
  }

  stopListening(): void {
    if (this.micTrack) this.micTrack.enabled = false;
    // Commit the buffered audio and request a response.
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
  }
}
