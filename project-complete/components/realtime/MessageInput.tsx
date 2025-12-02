"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessageInputProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
};

export function MessageInput({
  value,
  placeholder,
  disabled,
  isSubmitting,
  onChange,
  onSubmit,
}: MessageInputProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled || isSubmitting) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <Button
        type="submit"
        disabled={disabled || value.trim().length === 0 || isSubmitting}
      >
        Send text response
      </Button>
    </form>
  );
}
