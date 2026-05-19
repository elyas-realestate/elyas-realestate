// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import VoiceRecorder from "../VoiceRecorder";

// jsdom does not provide Web Speech API. We install a small stub on `window`
// before tests that exercise the recording path. The "no support" path is
// covered first by leaving window.SpeechRecognition undefined.

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: SRResult[] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SRResult = { isFinal: boolean; length: number; 0: { transcript: string; confidence: number } };

function installSpeechRecognition(): { latest: SR | null } {
  const refs: { latest: SR | null } = { latest: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition = class {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult: SR["onresult"] = null;
    onerror: SR["onerror"] = null;
    onend: SR["onend"] = null;
    start = vi.fn();
    stop = vi.fn();
    constructor() {
      refs.latest = this as unknown as SR;
    }
  };
  return refs;
}

function uninstallSpeechRecognition() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).webkitSpeechRecognition;
}

beforeEach(() => {
  vi.restoreAllMocks();
  uninstallSpeechRecognition();
});

afterEach(cleanup);

describe("VoiceRecorder — render", () => {
  it("renders without crashing when no extractor handler is needed yet", () => {
    const { container } = render(<VoiceRecorder onExtracted={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("shows the start-recording button initially", () => {
    render(<VoiceRecorder onExtracted={vi.fn()} />);
    // The button labels switch between mic and stop icons; we look for the
    // start-state text guidance.
    expect(screen.queryByText(/ابدأ/) || screen.queryByText(/تسجيل/)).not.toBeNull();
  });
});

describe("VoiceRecorder — unsupported browser", () => {
  it("does not throw and does not crash when SpeechRecognition is missing", () => {
    expect(() => render(<VoiceRecorder onExtracted={vi.fn()} />)).not.toThrow();
  });

  it("shows an error message when the user clicks record on an unsupported browser", async () => {
    render(<VoiceRecorder onExtracted={vi.fn()} />);
    // find the first button (the toggle)
    const buttons = screen.queryAllByRole("button");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      await waitFor(() => {
        expect(
          screen.queryByText(/متصفحك لا يدعم التسجيل الصوتي/) || screen.queryByText(/Chrome/)
        ).not.toBeNull();
      });
    }
  });
});

describe("VoiceRecorder — supported browser (mocked SpeechRecognition)", () => {
  it("instantiates a recognition object and starts it", () => {
    const refs = installSpeechRecognition();
    render(<VoiceRecorder onExtracted={vi.fn()} />);
    const startBtn = screen.queryAllByRole("button")[0];
    fireEvent.click(startBtn);

    expect(refs.latest).not.toBeNull();
    expect(refs.latest?.lang).toBe("ar-SA");
    expect(refs.latest?.continuous).toBe(true);
    expect(refs.latest?.interimResults).toBe(true);
    expect((refs.latest?.start as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });

  it("registers onresult / onerror / onend handlers", () => {
    const refs = installSpeechRecognition();
    render(<VoiceRecorder onExtracted={vi.fn()} />);
    fireEvent.click(screen.queryAllByRole("button")[0]);
    expect(refs.latest?.onresult).toBeTypeOf("function");
    expect(refs.latest?.onerror).toBeTypeOf("function");
    expect(refs.latest?.onend).toBeTypeOf("function");
  });

  it("appends final transcript chunks as result events fire", async () => {
    const refs = installSpeechRecognition();
    render(<VoiceRecorder onExtracted={vi.fn()} />);
    fireEvent.click(screen.queryAllByRole("button")[0]);

    // Simulate two final-result chunks
    const fakeEvent = {
      resultIndex: 0,
      results: [
        { isFinal: true, length: 1, 0: { transcript: "شقة في النرجس", confidence: 0.9 } },
      ] as SRResult[],
    };
    refs.latest?.onresult?.(fakeEvent);

    await waitFor(() => {
      expect(screen.queryByText(/شقة في النرجس/)).not.toBeNull();
    });
  });

  it("calls stop() when the user clicks while recording", async () => {
    const refs = installSpeechRecognition();
    render(<VoiceRecorder onExtracted={vi.fn()} />);

    // Start
    const btn = screen.queryAllByRole("button")[0];
    fireEvent.click(btn);

    // Click again to stop (the same button toggles state)
    fireEvent.click(btn);
    // It may take a tick for state to flush; allow microtask
    await new Promise((r) => setTimeout(r, 5));

    expect((refs.latest?.stop as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
  });
});
