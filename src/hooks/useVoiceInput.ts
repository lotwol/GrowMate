import { useReducer, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

type VoiceState = "idle" | "recording" | "processing" | "error";

interface State {
  status: VoiceState;
  elapsedSeconds: number;
}

type Action =
  | { type: "START_RECORDING" }
  | { type: "TICK" }
  | { type: "STOP_RECORDING" }
  | { type: "PROCESSING" }
  | { type: "DONE" }
  | { type: "ERROR" }
  | { type: "CANCEL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_RECORDING":
      return { status: "recording", elapsedSeconds: 0 };
    case "TICK":
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
    case "STOP_RECORDING":
    case "PROCESSING":
      return { ...state, status: "processing" };
    case "DONE":
    case "CANCEL":
    case "ERROR":
      return { status: action.type === "ERROR" ? "error" : "idle", elapsedSeconds: 0 };
    default:
      return state;
  }
}

const MAX_DURATION = 60;

export function useVoiceInput(onTranscription: (text: string) => void) {
  const [state, dispatch] = useReducer(reducer, { status: "idle", elapsedSeconds: 0 });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    dispatch({ type: "PROCESSING" });
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "sv");

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getApiKey()}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Transcription error:", resp.status, errText);
        throw new Error("Transcription failed");
      }

      const data = await resp.json();
      const text = data.text?.trim();
      if (text) {
        onTranscription(text);
        dispatch({ type: "DONE" });
      } else {
        throw new Error("Empty transcription");
      }
    } catch (err) {
      console.error("Voice transcription error:", err);
      toast({
        title: "Kunde inte tolka rösten",
        description: "Försök igen eller skriv din fråga",
        variant: "destructive",
      });
      dispatch({ type: "ERROR" });
      // Reset to idle after brief error state
      setTimeout(() => dispatch({ type: "DONE" }), 100);
    }
  }, [onTranscription]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        cleanup();
        if (blob.size > 0) {
          transcribe(blob);
        } else {
          dispatch({ type: "DONE" });
        }
      };

      mediaRecorder.start(250); // collect in 250ms chunks
      dispatch({ type: "START_RECORDING" });

      // Timer for elapsed seconds + max duration
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        dispatch({ type: "TICK" });
        if (seconds >= MAX_DURATION) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error("Mic permission error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast({
          title: "Mikrofontillstånd saknas",
          description: "Aktivera mikrofonen i webbläsarens inställningar",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Kunde inte starta inspelning",
          description: "Kontrollera att din mikrofon fungerar",
          variant: "destructive",
        });
      }
      dispatch({ type: "ERROR" });
      setTimeout(() => dispatch({ type: "DONE" }), 100);
    }
  }, [cleanup, transcribe]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Remove onstop handler to prevent transcription
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
    cleanup();
    dispatch({ type: "CANCEL" });
  }, [cleanup]);

  const toggle = useCallback(() => {
    if (state.status === "recording") {
      stopRecording();
    } else if (state.status === "idle" || state.status === "error") {
      startRecording();
    }
  }, [state.status, startRecording, stopRecording]);

  return {
    status: state.status,
    elapsedSeconds: state.elapsedSeconds,
    toggle,
    cancel: cancelRecording,
  };
}

// Get the API key from Supabase edge function to avoid exposing it client-side
async function getApiKey(): Promise<string> {
  // We call a small edge function that returns the key, or use the anon key for the gateway
  // The Lovable AI gateway accepts the LOVABLE_API_KEY which is a server secret.
  // We need to proxy through an edge function.
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.functions.invoke("voice-transcribe-proxy", {
    body: { action: "get-token" },
  });
  if (error || !data?.token) {
    throw new Error("Could not get transcription token");
  }
  return data.token;
}
