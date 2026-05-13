"use client";

import { Star, Quote } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TestimonialsSection — قسم آراء العملاء في /c/[slug]
// ══════════════════════════════════════════════════════════════════

interface Testimonial {
  id: string;
  client_name: string;
  client_role: string | null;
  rating: number;
  content: string;
  is_featured: boolean;
  created_at: string;
}

interface Props {
  testimonials: Testimonial[];
  accent: string;
  bgColor: string;
  textColor: string;
}

export default function TestimonialsSection({ testimonials, accent, bgColor, textColor }: Props) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div style={{ marginTop: 28, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            flexShrink: 0,
          }}
        >
          <Star size={14} fill={accent} />
        </span>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: textColor,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          قالوا عني
        </h3>
        <span
          style={{
            fontSize: 11,
            color: textColor,
            opacity: 0.55,
            marginRight: "auto",
          }}
        >
          {testimonials.length} {testimonials.length === 1 ? "رأي" : "آراء"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {testimonials.map((t) => (
          <TestimonialCard
            key={t.id}
            testimonial={t}
            accent={accent}
            bgColor={bgColor}
            textColor={textColor}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
  accent,
  bgColor,
  textColor,
}: {
  testimonial: Testimonial;
  accent: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div
      style={{
        background: `${textColor}06`,
        border: `1px solid ${accent}22`,
        borderRadius: 14,
        padding: "16px 18px",
        position: "relative",
      }}
    >
      <Quote
        size={20}
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          color: accent,
          opacity: 0.35,
        }}
      />

      {testimonial.is_featured && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 999,
            background: accent,
            color: bgColor,
          }}
        >
          ★ مميّز
        </span>
      )}

      {/* Rating stars */}
      {testimonial.rating > 0 && (
        <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              fill={i < testimonial.rating ? accent : "transparent"}
              color={accent}
              strokeWidth={1.5}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.85,
          color: textColor,
          opacity: 0.92,
          marginBottom: 10,
          whiteSpace: "pre-line",
        }}
      >
        {testimonial.content}
      </p>

      {/* Author */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingTop: 10,
          borderTop: `1px solid ${accent}18`,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: accent,
            color: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {(testimonial.client_name || "؟").trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>
            {testimonial.client_name}
          </div>
          {testimonial.client_role && (
            <div style={{ fontSize: 11, color: textColor, opacity: 0.6, marginTop: 2 }}>
              {testimonial.client_role}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
