import { useReducer, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

type VoiceState = "idle" | "recording" | "processing";

interface State {
  status: VoiceState;
  elapsedSeconds: number;
}

type Action =
  | { type: "START_RECORDING" }
  | { type: "TICK" }
  | { type: "PROCESSING" }
  | { type: "DONE" }
  | { type: "CANCEL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_RECORDING":
      return { status: "recording", elapsedSeconds: 0 };
    case "TICK":
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
    case "PROCESSING":
      return { ...state, status: "processing" };
    case "DONE":
    case "CANCEL":
      return { status: "idle", elapsedSeconds: 0 };
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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Transcription failed");
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
      dispatch({ type: "DONE" });
    }
  }, [onTranscription]);

  const stopRecordingRef = useRef<() => void>();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        if (blob.size > 0) {
          transcribe(blob);
        } else {
          dispatch({ type: "DONE" });
        }
      };

      mediaRecorder.start(250);
      dispatch({ type: "START_RECORDING" });

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        dispatch({ type: "TICK" });
        if (seconds >= MAX_DURATION && stopRecordingRef.current) {
          stopRecordingRef.current();
        }
      }, 1000);
    } catch (err: any) {
      console.error("Mic permission error:", err);
      toast({
        title: err.name === "NotAllowedError"
          ? "Mikrofontillstånd saknas"
          : "Kunde inte starta inspelning",
        description: err.name === "NotAllowedError"
          ? "Aktivera mikrofonen i webbläsarens inställningar"
          : "Kontrollera att din mikrofon fungerar",
        variant: "destructive",
      });
      dispatch({ type: "DONE" });
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

  stopRecordingRef.current = stopRecording;

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
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
    } else if (state.status === "idle") {
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
