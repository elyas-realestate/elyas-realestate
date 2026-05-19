// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import BrokerQRModal from "../BrokerQRModal";

afterEach(cleanup);

const baseProps = {
  slug: "elyas",
  brokerName: "إلياس",
  onClose: () => {},
};

describe("BrokerQRModal — initial render", () => {
  it("renders the modal title 'رمز QR'", () => {
    render(<BrokerQRModal {...baseProps} />);
    expect(screen.getByText("رمز QR")).toBeDefined();
  });

  it("renders the close button", () => {
    const { container } = render(<BrokerQRModal {...baseProps} />);
    // close button has an X icon — find via aria/role or by structure
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders all 4 QR-type tabs (card/vcard/whatsapp/maps)", () => {
    render(<BrokerQRModal {...baseProps} />);
    expect(screen.getByText("بطاقتي")).toBeDefined();
    expect(screen.getByText("vCard")).toBeDefined();
    expect(screen.getByText("WhatsApp")).toBeDefined();
    expect(screen.getByText("موقعي")).toBeDefined();
  });

  it("starts on the 'card' tab and shows its hint", () => {
    render(<BrokerQRModal {...baseProps} />);
    expect(screen.getByText(/رابط بطاقتي التعريفية/)).toBeDefined();
  });

  it("uses RTL direction on modal body", () => {
    const { container } = render(<BrokerQRModal {...baseProps} />);
    const rtlEl = container.querySelector("[dir='rtl']");
    expect(rtlEl).not.toBeNull();
  });

  it("renders a QR image for the active type", () => {
    const { container } = render(<BrokerQRModal {...baseProps} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toContain("/api/qr");
  });

  it("renders both PNG and SVG download buttons", () => {
    render(<BrokerQRModal {...baseProps} />);
    expect(screen.getByText(/تحميل PNG/)).toBeDefined();
    expect(screen.getByText(/تحميل SVG/)).toBeDefined();
  });
});

describe("BrokerQRModal — tab switching", () => {
  it("switches to the vCard tab and updates the hint", () => {
    render(<BrokerQRModal {...baseProps} />);
    fireEvent.click(screen.getByText("vCard"));
    expect(screen.getByText(/تحميل بياناتي مباشرة في contacts/)).toBeDefined();
  });

  it("updates the QR image src when switching tabs", () => {
    const { container } = render(<BrokerQRModal {...baseProps} whatsapp="966501234567" />);
    const initialSrc = container.querySelector("img")?.getAttribute("src");
    fireEvent.click(screen.getByText("WhatsApp"));
    const newSrc = container.querySelector("img")?.getAttribute("src");
    expect(newSrc).not.toBe(initialSrc);
    // The WhatsApp src should encode wa.me
    expect(newSrc).toContain("wa.me");
  });

  it("encodes the slug into the card-tab QR text", () => {
    const { container } = render(<BrokerQRModal {...baseProps} slug="custom-slug" />);
    const src = container.querySelector("img")?.getAttribute("src");
    expect(src).toContain(encodeURIComponent("/c/custom-slug"));
  });

  it("encodes the vCard endpoint when on vcard tab", () => {
    const { container } = render(<BrokerQRModal {...baseProps} />);
    fireEvent.click(screen.getByText("vCard"));
    const src = container.querySelector("img")?.getAttribute("src");
    expect(src).toContain(encodeURIComponent("/api/vcard/elyas"));
  });
});

describe("BrokerQRModal — disabled tabs", () => {
  it("disables WhatsApp tab when no whatsapp number is provided", () => {
    render(<BrokerQRModal {...baseProps} />);
    const waButton = screen.getByText("WhatsApp").closest("button") as HTMLButtonElement;
    expect(waButton.disabled).toBe(true);
  });

  it("enables WhatsApp tab when whatsapp is provided", () => {
    render(<BrokerQRModal {...baseProps} whatsapp="966501234567" />);
    const waButton = screen.getByText("WhatsApp").closest("button") as HTMLButtonElement;
    expect(waButton.disabled).toBe(false);
  });

  it("disables Maps tab when no mapsUrl is provided", () => {
    render(<BrokerQRModal {...baseProps} />);
    const mapsButton = screen.getByText("موقعي").closest("button") as HTMLButtonElement;
    expect(mapsButton.disabled).toBe(true);
  });

  it("enables Maps tab when mapsUrl is provided", () => {
    render(<BrokerQRModal {...baseProps} mapsUrl="https://maps.google.com/?q=24,46" />);
    const mapsButton = screen.getByText("موقعي").closest("button") as HTMLButtonElement;
    expect(mapsButton.disabled).toBe(false);
  });

  it("does NOT switch to a disabled tab when clicked", () => {
    render(<BrokerQRModal {...baseProps} />);
    // WhatsApp is disabled (no whatsapp prop)
    fireEvent.click(screen.getByText("WhatsApp"));
    // hint should still be the card hint
    expect(screen.getByText(/رابط بطاقتي التعريفية/)).toBeDefined();
  });
});

describe("BrokerQRModal — close behaviour", () => {
  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<BrokerQRModal {...baseProps} onClose={onClose} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<BrokerQRModal {...baseProps} onClose={onClose} />);
    // X button is the first button-with-no-text (no label)
    const buttons = Array.from(container.querySelectorAll("button"));
    const xButton = buttons.find((b) => b.textContent === "" || b.textContent?.trim() === "");
    if (xButton) {
      fireEvent.click(xButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it("does NOT call onClose when clicking inside the modal body", () => {
    const onClose = vi.fn();
    render(<BrokerQRModal {...baseProps} onClose={onClose} />);
    // click on a tab label
    fireEvent.click(screen.getByText("بطاقتي"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("BrokerQRModal — download", () => {
  it("creates an anchor with the correct PNG download URL when PNG button is clicked", () => {
    const clickSpy = vi.fn();
    const origAnchor = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = clickSpy;

    try {
      render(<BrokerQRModal {...baseProps} />);
      const pngButton = screen.getByText(/تحميل PNG/).closest("button") as HTMLButtonElement;
      fireEvent.click(pngButton);
      expect(clickSpy).toHaveBeenCalled();
    } finally {
      HTMLAnchorElement.prototype.click = origAnchor;
    }
  });

  it("encodes a slug-aware filename in the download attribute", () => {
    const createdAnchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      const el = origCreate(tag);
      if (tag.toLowerCase() === "a") createdAnchors.push(el as HTMLAnchorElement);
      return el;
    }) as typeof document.createElement;

    // suppress actual click
    const origAnchor = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = vi.fn();

    try {
      render(<BrokerQRModal {...baseProps} slug="my-broker" />);
      fireEvent.click(screen.getByText(/تحميل PNG/).closest("button") as HTMLButtonElement);
      const lastAnchor = createdAnchors[createdAnchors.length - 1];
      expect(lastAnchor.download).toMatch(/my-broker-qr-card\.png/);
    } finally {
      document.createElement = origCreate;
      HTMLAnchorElement.prototype.click = origAnchor;
    }
  });
});
