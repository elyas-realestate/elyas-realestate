"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

// ══════════════════════════════════════════════════════════════
// Input — حقل إدخال موحّد
// ══════════════════════════════════════════════════════════════
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div>
      {label && (
        <label className={`mb-2 block text-sm ${error ? "text-red-400" : "text-[#9A9AA0]"}`}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl bg-[#1C1C22] px-4 py-3 text-sm text-[#F5F5F5] transition placeholder:text-[#3A3A42] focus:outline-none ${error ? "border border-red-500" : "border border-[rgba(198,145,76,0.15)] focus:border-[#C6914C]"} ${className}`}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";

// ══════════════════════════════════════════════════════════════
// Textarea — حقل نص طويل
// ══════════════════════════════════════════════════════════════
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = "", ...props }, ref) => (
    <div>
      {label && <label className="mb-2 block text-sm text-[#9A9AA0]">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full resize-none rounded-xl border border-[rgba(198,145,76,0.15)] bg-[#1C1C22] px-4 py-3 text-sm text-[#F5F5F5] transition placeholder:text-[#3A3A42] focus:border-[#C6914C] focus:outline-none ${className}`}
        {...props}
      />
    </div>
  )
);
Textarea.displayName = "Textarea";

// ══════════════════════════════════════════════════════════════
// Select — قائمة منسدلة
// ══════════════════════════════════════════════════════════════
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", children, ...props }, ref) => (
    <div>
      {label && (
        <label className={`mb-2 block text-sm ${error ? "text-red-400" : "text-[#9A9AA0]"}`}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full rounded-xl bg-[#1C1C22] px-4 py-3 text-sm text-[#F5F5F5] transition focus:outline-none ${error ? "border border-red-500" : "border border-[rgba(198,145,76,0.15)] focus:border-[#C6914C]"} ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
);
Select.displayName = "Select";
