"use client";

import { useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type MessageInputProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export function MessageInput({
  value,
  placeholder,
  disabled,
  isSubmitting,
  onChange,
  onSubmit,
}: MessageInputProps) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (disabled || isSubmitting) return;
      onSubmit(value.trim());
    },
    [disabled, isSubmitting, onSubmit, value]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        type="submit"
        disabled={disabled || value.trim().length === 0 || isSubmitting}
      >
        Send text prompt
      </Button>
    </form>
  );
}
