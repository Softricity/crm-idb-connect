import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" label="Loading..." />
    </div>
  );
}
