"use client";

import { Button } from "@heroui/react";
import { Link, Clock3, Plus } from "lucide-react";

export default function PaymentToolbar({ onCreate, disabled }: { onCreate: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Button variant="flat" startContent={<Link className="h-4 w-4" />} isDisabled={disabled}>
        Generate Payment Link
      </Button>
      <Button variant="flat" startContent={<Clock3 className="h-4 w-4" />} isDisabled={disabled}>
        Schedule Payment
      </Button>
      <Button color="secondary" startContent={<Plus className="h-4 w-4 text-white" />} onPress={onCreate} isDisabled={disabled} className="text-white">
        Record Payment
      </Button>
    </div>
  );
}
