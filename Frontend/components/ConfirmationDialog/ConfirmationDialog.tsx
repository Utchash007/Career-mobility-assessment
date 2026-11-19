"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { type ReactNode, useId, useRef } from "react";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  intent?: "standard" | "destructive";
  state?: "idle" | "pending";
  children?: ReactNode;
  feedback?: ReactNode;
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  intent = "standard",
  state = "idle",
  children,
  feedback,
}: ConfirmationDialogProps) {
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const pending = state === "pending";

  function handleCancel() {
    if (!pending) onCancel();
  }

  function handleConfirm() {
    if (!pending) onConfirm();
  }

  return (
    <Modal
      show={open}
      onClose={handleCancel}
      dismissible={!pending}
      initialFocus={cancelRef}
      size="lg"
      aria-describedby={descriptionId}
      aria-busy={pending}
    >
      <ModalHeader as="h2">{title}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p id={descriptionId} className="text-sm leading-6 text-ink">
            {description}
          </p>
          {children}
          {feedback}
          <p
            role="status"
            aria-live="polite"
            className="min-h-5 text-sm text-action"
          >
            {pending ? "Please wait while this action completes…" : ""}
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          ref={cancelRef}
          type="button"
          color="alternative"
          onClick={handleCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          color={intent === "destructive" ? "failure" : "default"}
          onClick={handleConfirm}
          disabled={pending}
        >
          {pending ? "Working…" : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
