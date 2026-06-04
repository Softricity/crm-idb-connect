"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { PaymentsPublicAPI } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PublicPayPage() {
  const params = useParams<{ leadId: string }>();
  const search = useSearchParams();
  const leadId = params?.leadId;

  const [config, setConfig] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const callbackPayload = useMemo(
    () => ({
      transactionId: search.get("transactionId") || undefined,
      pidx: search.get("pidx") || undefined,
      razorpay_order_id: search.get("razorpay_order_id") || undefined,
      razorpay_payment_id: search.get("razorpay_payment_id") || undefined,
      razorpay_signature: search.get("razorpay_signature") || undefined,
    }),
    [search]
  );

  useEffect(() => {
    if (!leadId) return;
    PaymentsPublicAPI.getConfig(leadId)
      .then(setConfig)
      .catch((e) => setStatus(e.message || "Failed to load payment gateway"));
  }, [leadId]);

  useEffect(() => {
    if (!leadId) return;
    if (!callbackPayload.transactionId && !callbackPayload.pidx && !callbackPayload.razorpay_order_id) return;
    setLoading(true);
    PaymentsPublicAPI.verify(leadId, callbackPayload)
      .then((r) => {
        setResult(r);
        setStatus(`Payment status: ${r.status}`);
      })
      .catch((e) => setStatus(e.message || "Verification failed"))
      .finally(() => setLoading(false));
  }, [leadId, callbackPayload]);

  const payNow = async () => {
    if (!leadId) return;
    setLoading(true);
    setStatus("");
    setResult(null);
    try {
      const res = await PaymentsPublicAPI.initiate(leadId, {
        amount: Number(amount),
        currency: config?.provider === "KHALTI" ? "NPR" : "INR",
        description: `Payment for lead ${leadId}`,
      });

      if (res.provider === "KHALTI") {
        window.location.href = res.payment_url;
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay checkout");

      const options = {
        key: res.key_id,
        amount: res.order.amount,
        currency: res.order.currency || "INR",
        name: "IDB Connect",
        description: "Lead Payment",
        order_id: res.order.id,
        handler: async (response: any) => {
          const verify = await PaymentsPublicAPI.verify(leadId, {
            transactionId: res.transactionId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setResult(verify);
          setStatus(`Payment status: ${verify.status}`);
        },
        modal: {
          ondismiss: () => setStatus("Payment canceled by user"),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      setStatus(e?.message || "Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardBody className="p-6 space-y-4">
          <h1 className="text-xl font-bold">Pay Online</h1>
          <p className="text-sm text-gray-600">
            Active Gateway: <span className="font-semibold">{config?.provider || "Loading..."}</span>
          </p>
          <Input
            type="number"
            label="Amount"
            value={amount}
            onValueChange={setAmount}
            min={10}
          />
          <Button color="primary" onPress={payNow} isLoading={loading}>
            Pay Now
          </Button>
          {status && <p className="text-sm">{status}</p>}
          {result && (
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

