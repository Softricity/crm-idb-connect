"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Select,
  SelectItem,
  DatePicker,
  Chip,
} from "@heroui/react";
import { CreditCard, Barcode, Calendar, Upload, X } from "lucide-react";
import {
  getLocalTimeZone,
  fromDate,
  toCalendarDate,
  type DateValue,
} from "@internationalized/date";
import {
  OfflinePayment,
  useOfflinePaymentStore,
} from "@/stores/useOfflinePaymentStore";

type Receiver = { id: string; name: string };

export default function CreateUpdatePayments({
  open,
  onClose,
  initial,
  receivers = [],
  leadId,
}: {
  open: boolean;
  onClose: () => void;
  initial?: OfflinePayment | null;
  receivers?: Receiver[];
  leadId: string;
}) {
  const { addPayment, updatePayment, uploadPaymentFile, saving } =
    useOfflinePaymentStore() as any;

  const [payment, setPayment] = useState<
    OfflinePayment & { date: Date; localFile?: File | null; uploading?: boolean }
  >({
    currency: "INR",
    payment_mode: "Cash",
    amount: 0,
    payment_type: "",
    receiver: "",
    reference_id: "",
    date: new Date(),
    file: "",
    localFile: null,
    lead_id: leadId,
  });

  const updatePaymentField = useCallback(
    <K extends keyof typeof payment>(key: K, value: (typeof payment)[K]) => {
      setPayment((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setPayment((prev) => ({ ...prev, localFile: file }));
      }
      // reset input value to allow re-uploading same file
      e.target.value = "";
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setPayment((prev) => ({
        ...prev,
        ...initial,
        date: initial.created_at ? new Date(initial.created_at) : new Date(),
        localFile: null,
      }));
    } else {
      setPayment({
        currency: "INR",
        payment_mode: "Cash",
        amount: 0,
        payment_type: "",
        receiver: "",
        reference_id: "",
        date: new Date(),
        file: "",
        localFile: null,
        lead_id: leadId,
      });
    }
  }, [open, initial, leadId]);

  const canSave = useMemo(() => {
    const { amount, payment_type, receiver, date } = payment;
    return Number(amount) > 0 && payment_type && receiver && date;
  }, [payment]);

  const handleSave = async () => {
    if (!canSave) return;

    let uploadedUrl = payment.file || "";

    if (payment.localFile) {
      setPayment((prev) => ({ ...prev, uploading: true }));
      const url = await uploadPaymentFile(payment.localFile, leadId);
      if (url) uploadedUrl = url;
      setPayment((prev) => ({ ...prev, uploading: false }));
    }

    const payload: OfflinePayment = {
      currency: payment.currency,
      amount: Number(payment.amount),
      payment_mode: payment.payment_mode,
      payment_type: payment.payment_type,
      reference_id: payment.reference_id,
      receiver: payment.receiver,
      file: uploadedUrl,
      created_at: payment.date?.toISOString(),
      lead_id: leadId,
    };

    if (initial?.id) await updatePayment(initial.id, payload);
    else await addPayment(payload);

    onClose();
  };

  // ✅ Date Utils
  const toDateValue = (d: Date | null) =>
    d ? toCalendarDate(fromDate(d, getLocalTimeZone())) : null;
  const toJSDate = (v: DateValue | null) =>
    v ? new Date(v.year, v.month - 1, v.day) : null;

  const paymentModes = ["Cash", "Online", "Cheque"] as const;
  const paymentTypes = [
    "Lead Converted",
    "Installment 1 Payment",
    "Installment 2 Payment",
    "Installment 3 Payment",
    "Installment 4 Payment",
    "Installment 5 Payment",
    "Admission Fee Receipt",
    "Tuition Fee Payment Proof (TT)",
    "Fee Payment Receipt from University",
    "VFS Fee Receipt",
    "Pre-Visa Fee Payment",
    "Post-Visa Fee Payment",
  ];
  const currencies = [{ code: "AED" }, { code: "AUD" }, { code: "BDT" }, { code: "BGN" }, { code: "CAD" }, { code: "CHF" }, { code: "CNY" }, { code: "CZK" }, { code: "DKK" }, { code: "EUR" }, { code: "GBP" }, { code: "HKD" }, { code: "HUF" }, { code: "INR" }, { code: "JPY" }, { code: "KRW" }, { code: "LKR" }, { code: "MYR" }, { code: "NOK" }, { code: "NPR" }, { code: "NZD" }, { code: "PKR" }, { code: "PLN" }, { code: "RUB" }, { code: "SEK" }, { code: "SGD" }, { code: "THB" }, { code: "TRY" }, { code: "TWD" }, { code: "USD" },];
  return (
    <Drawer isOpen={open} onOpenChange={onClose} placement="right" size="xl">
      <DrawerContent className="h-full">
        <DrawerHeader className="border-b border-default-200">
          Record Payment
        </DrawerHeader>

        <DrawerBody className="gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Payment Mode"
              selectedKeys={payment.payment_mode ? [payment.payment_mode] : []}
              onChange={(e) =>
                updatePaymentField("payment_mode", e.target.value)
              }
            >
              {paymentModes.map((m) => (
                <SelectItem key={m} startContent={<CreditCard className="h-4 w-4" />}>
                  {m}
                </SelectItem>
              ))}
            </Select>

            <div className="flex gap-3 col-span-2">
              <Select label="Currency" selectedKeys={[payment.currency]} className="min-w-24 w-28" onChange={(e) => updatePaymentField("currency", e.target.value)} >
                {currencies.map((c) => (<SelectItem key={c.code}>{c.code}</SelectItem>))}
              </Select>
              <Input
                type="number"
                label="Amount"
                placeholder="0.00"
                value={payment.amount?.toString() || ""}
                onValueChange={(v) =>
                  updatePaymentField("amount", Number(v) || 0)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Type"
              selectedKeys={[payment.payment_type]}
              onChange={(e) =>
                updatePaymentField("payment_type", e.target.value)
              }
            >
              {paymentTypes.map((t) => (
                <SelectItem key={t}>{t}</SelectItem>
              ))}
            </Select>

            <Select
              label="Select Receiver"
              selectedKeys={[payment.receiver || ""]}
              onChange={(e) => updatePaymentField("receiver", e.target.value)}
            >
              {receivers.map((r) => (
                <SelectItem key={r.id}>{r.name}</SelectItem>
              ))}
            </Select>

            <Input
              label="Payment Reference ID"
              placeholder="UTR/Txn ID"
              value={payment.reference_id || ""}
              onValueChange={(v) =>
                updatePaymentField("reference_id", v as string)
              }
              startContent={<Barcode className="h-4 w-4" />}
            />

            <DatePicker
              label="Date"
              value={toDateValue(payment.date)}
              onChange={(dv) => updatePaymentField("date", toJSDate(dv)!)}
              startContent={<Calendar className="h-4 w-4" />}
            />
          </div>

          {/* <div
            className="border-dashed border-2 rounded-xl p-6 text-center mt-4 hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-5 w-5 text-default-600" />
              <p className="font-medium text-sm text-default-800">Upload Receipt or Proof</p>
              <p className="text-xs text-default-500">Click anywhere to upload (JPG, PNG, PDF)</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {payment.localFile && (
                <Chip
                  variant="flat"
                  color="success"
                  className="mt-3"
                  endContent={
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePaymentField("localFile", null);
                      }}
                      className="ml-1 rounded-md p-0.5 hover:bg-default-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  }
                >
                  {payment.localFile.name}
                </Chip>
              )}
            </div>

            {payment.file && !payment.localFile && (
              <a
                href={payment.file}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block mt-3 text-blue-600 underline text-sm hover:text-blue-700"
              >
                View Existing File
              </a>
            )}
          </div> */}
        </DrawerBody>

        <DrawerFooter className="border-t border-default-200">
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="secondary"
            isDisabled={!canSave || payment.uploading}
            isLoading={!!saving || payment.uploading}
            onPress={handleSave}
            className="text-white"
          >
            {payment.uploading ? "Uploading..." : "Save"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
