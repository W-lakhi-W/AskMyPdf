import type { KeyboardEvent, RefObject } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { designTokens } from "@/theme/tokens";

type ChatComposerProps = {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  inputRef?: RefObject<HTMLTextAreaElement>;
};

export function ChatComposer({
  value,
  disabled,
  onChange,
  onSend,
  inputRef,
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: `${designTokens.colors.surface}f2`,
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${designTokens.colors.border}`,
        padding: `${designTokens.spacing.md} ${designTokens.spacing.xl}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: designTokens.spacing.sm,
          minHeight: "3.5rem",
          padding: `${designTokens.spacing.sm} ${designTokens.spacing.sm} ${designTokens.spacing.sm} ${designTokens.spacing.lg}`,
          border: `1px solid ${designTokens.colors.border}`,
          borderRadius: designTokens.radii.md,
          background: designTokens.colors.surfaceAlt,
          boxShadow: designTokens.shadow.sm,
        }}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={2}
          disabled={disabled}
          style={{
            resize: "none",
            minHeight: "2.5rem",
            maxHeight: "8rem",
            padding: `${designTokens.spacing.sm} 0`,
            border: 0,
            background: "transparent",
            color: designTokens.colors.text,
            outline: "none",
            width: "100%",
            lineHeight: 1.5,
            overflowY: "auto",
          }}
        />

        <Button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          title="Send message"
          style={{
            width: "2.75rem",
            height: "2.75rem",
            padding: 0,
            flexShrink: 0,
            borderRadius: designTokens.radii.sm,
          }}
        >
          {disabled ? <Loader2 size={18} /> : <SendHorizontal size={18} />}
        </Button>
      </div>
    </div>
  );
}
