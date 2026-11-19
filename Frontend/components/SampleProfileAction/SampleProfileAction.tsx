"use client";

import { Button } from "flowbite-react";
import ConfirmationDialog from "@/components/ConfirmationDialog/ConfirmationDialog";

export default function SampleProfileAction({ open, pending, disabled, onOpen, onCancel, onConfirm }: {
  open: boolean; pending: boolean; disabled: boolean; onOpen: () => void; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <>
      <Button type="button" color="alternative" disabled={disabled || pending} onClick={onOpen}>Load fictional sample</Button>
      <ConfirmationDialog open={open} title="Replace with a fictional sample?" description="This writes sample application data to your profile and replaces any existing profile and unsaved edits. Its fictional name does not change your Clerk identity. Your shortlist is preserved." confirmLabel="Replace and save sample" state={pending ? "pending" : "idle"} onCancel={onCancel} onConfirm={onConfirm} />
    </>
  );
}
