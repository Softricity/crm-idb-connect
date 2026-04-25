import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
} from "@heroui/react";
import { IntegrationProvider } from "./IntegrationCard";
import { toast } from "sonner";
import { IntegrationsAPI } from "@/lib/api";
import { Info } from "lucide-react";

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationProvider | null;
  onSuccess: () => void;
  existingConfig: any;
}

export const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({
  isOpen,
  onOpenChange,
  integration,
  onSuccess,
  existingConfig,
}) => {
  const [loading, setLoading] = useState(false);
  const isMailProvider =
    integration?.provider === "MAILSUITE" ||
    integration?.provider === "SENDER" ||
    integration?.provider === "BREVO";

  const [formData, setFormData] = useState({
    api_key: "",
    api_secret: "",
    is_active: true,
    host: "",
    port: "587",
    secure: false,
    from_email: "",
  });

  useEffect(() => {
    const configJson = existingConfig?.config_json || {};
    if (existingConfig) {
      setFormData({
        api_key: existingConfig.api_key || "",
        api_secret: existingConfig.api_secret || "",
        is_active: existingConfig.is_active ?? true,
        host: configJson.host || "",
        port: String(configJson.port || "587"),
        secure: Boolean(configJson.secure),
        from_email: configJson.from_email || "",
      });
    } else {
      setFormData({
        api_key: "",
        api_secret: "",
        is_active: true,
        host: "",
        port: "587",
        secure: false,
        from_email: "",
      });
    }
  }, [existingConfig, isOpen]);

  const handleSubmit = async () => {
    if (!integration) return;
    
    if (!formData.api_key) {
      toast.error("API key is required");
      return;
    }

    if ((isMailProvider || integration.provider === "RAZORPAY" || integration.provider === "GOOGLE_ADS") && !formData.api_secret) {
      toast.error("Secret/token is required");
      return;
    }

    setLoading(true);
    try {
      await IntegrationsAPI.upsert({
        provider: integration.provider,
        display_name: integration.name,
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        is_active: formData.is_active,
        config_json: isMailProvider
          ? {
              host: formData.host || undefined,
              port: Number(formData.port) || 587,
              secure: formData.secure,
              from_email: formData.from_email || undefined,
            }
          : {},
      });
      toast.success(`${integration.name} configuration saved successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  if (!integration) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" radius="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 py-6 px-8 border-b border-gray-50 text-xl font-bold">
              Configure {integration.name}
            </ModalHeader>
            <ModalBody className="px-8 py-6">
              <div className="space-y-8">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50/80 to-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900">Enable Integration</span>
                    <span className="text-[11px] text-gray-500 font-medium">Toggle this to activate the service</span>
                  </div>
                  <Switch
                    isSelected={formData.is_active}
                    onValueChange={(val) => setFormData({ ...formData, is_active: val })}
                    color="primary"
                    size="sm"
                  />
                </div>

                <div className="space-y-6">
                  <Input
                    label={isMailProvider ? "Campaign Provider Username / API Key" : integration.provider === "RAZORPAY" ? "Key ID" : "API Key / Pixel ID"}
                    placeholder={
                      isMailProvider
                        ? `Enter your ${integration.name} campaign credential key`
                        : `Enter your ${integration.name} identifier`
                    }
                    labelPlacement="outside"
                    value={formData.api_key}
                    onValueChange={(val) => setFormData({ ...formData, api_key: val })}
                    variant="bordered"
                    radius="lg"
                    classNames={{
                      label: "text-gray-700 font-bold mb-2 text-sm",
                      inputWrapper: "border-gray-200 hover:border-primary/50 focus-within:border-primary transition-all duration-200 h-12 shadow-sm",
                      input: "placeholder:text-gray-400 text-sm",
                    }}
                  />
                  
                  {(isMailProvider || integration.provider === "RAZORPAY" || integration.provider === "GOOGLE_ADS") && (
                    <Input
                      label={isMailProvider ? "Campaign Provider Secret / Token" : integration.provider === "RAZORPAY" ? "Key Secret" : "Developer Token"}
                      placeholder={isMailProvider ? `Enter your ${integration.name} campaign secret/token` : `Enter your ${integration.name} secret/token`}
                      labelPlacement="outside"
                      type="password"
                      value={formData.api_secret}
                      onValueChange={(val) => setFormData({ ...formData, api_secret: val })}
                      variant="bordered"
                      radius="lg"
                      classNames={{
                        label: "text-gray-700 font-bold mb-2 text-sm",
                        inputWrapper: "border-gray-200 hover:border-primary/50 focus-within:border-primary transition-all duration-200 h-12 shadow-sm",
                        input: "placeholder:text-gray-400 text-sm",
                      }}
                    />
                  )}

                  {isMailProvider && (
                    <Input
                      label="SMTP Host (Optional)"
                      placeholder="e.g. smtp-relay.brevo.com"
                      labelPlacement="outside"
                      value={formData.host}
                      onValueChange={(val) => setFormData({ ...formData, host: val })}
                      variant="bordered"
                      radius="lg"
                    />
                  )}

                  {isMailProvider && (
                    <Input
                      label="SMTP Port"
                      placeholder="587"
                      labelPlacement="outside"
                      value={formData.port}
                      onValueChange={(val) => setFormData({ ...formData, port: val })}
                      variant="bordered"
                      radius="lg"
                    />
                  )}

                  {isMailProvider && (
                    <Input
                      label="From Email (Optional)"
                      placeholder="noreply@yourdomain.com"
                      labelPlacement="outside"
                      value={formData.from_email}
                      onValueChange={(val) => setFormData({ ...formData, from_email: val })}
                      variant="bordered"
                      radius="lg"
                    />
                  )}

                  {isMailProvider && (
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50/80 to-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-900">Use SSL/TLS</span>
                        <span className="text-[11px] text-gray-500 font-medium">Enable for port 465 or provider-specific SSL</span>
                      </div>
                      <Switch
                        isSelected={formData.secure}
                        onValueChange={(val) => setFormData({ ...formData, secure: val })}
                        color="primary"
                        size="sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <div className="p-2 bg-blue-100 rounded-xl h-fit">
                    <Info size={16} className="text-blue-600" />
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed font-semibold">
                    Note: Transactional emails are sent via backend Gmail SMTP env credentials. These mail-provider credentials are kept for campaign workflows only.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="px-8 py-6 bg-gray-50/30 border-t border-gray-50">
              <Button variant="light" onPress={onClose} radius="lg" className="font-semibold text-gray-500">
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleSubmit} 
                isLoading={loading} 
                radius="lg" 
                className="font-bold px-8 shadow-lg shadow-primary/20"
              >
                Save Changes
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>

  );
};
