"use client";

import React, { useEffect, useState } from "react";
import { 
  CreditCard,
  TrendingUp,
  Target,
  Mail, 
  Send,
  MailCheck,
  Plus, 
  RefreshCcw,
  Zap,
  LayoutGrid
} from "lucide-react";
import { Button, Spinner } from "@heroui/react";
import { toast } from "sonner";
import { IntegrationsAPI } from "@/lib/api";
import { IntegrationCard, IntegrationProvider } from "@/components/settings/IntegrationCard";
import { IntegrationConfigModal } from "@/components/settings/IntegrationConfigModal";

const PROVIDERS: Omit<IntegrationProvider, "id" | "isConnected" | "lastConnected">[] = [
  {
    name: "Razorpay",
    provider: "RAZORPAY",
    description: "Accept payments via UPI, Credit/Debit cards, and Netbanking. Automate refunds and reconciliations.",
    icon: <CreditCard className="text-blue-600" size={24} />,
    color: "bg-blue-600",
  },
  {
    name: "Google Ads",
    provider: "GOOGLE_ADS",
    description: "Track conversions, optimize your search campaigns, and attribute lead sources directly to your ad spend.",
    icon: <TrendingUp className="text-red-500" size={24} />,
    color: "bg-red-500",
  },
  {
    name: "Meta Pixel",
    provider: "META_PIXEL",
    description: "Monitor website events, build custom audiences, and measure campaign performance from a unified dashboard.",
    icon: <Target className="text-indigo-600" size={24} />,
    color: "bg-indigo-500",
  },
  {
    name: "Mailsuite",
    provider: "MAILSUITE",
    description: "Campaign email provider. Transactional/system emails use backend Gmail SMTP env credentials only.",
    icon: <Mail className="text-blue-600" size={24} />,
    color: "bg-blue-600",
  },
  {
    name: "Sender",
    provider: "SENDER",
    description: "Campaign email provider. Keep Sender credentials here for campaign flows only.",
    icon: <Send className="text-emerald-600" size={24} />,
    color: "bg-emerald-600",
  },
  {
    name: "Brevo",
    provider: "BREVO",
    description: "Campaign email provider. Transactional onboarding and system emails are not sent via Brevo in this phase.",
    icon: <MailCheck className="text-indigo-600" size={24} />,
    color: "bg-indigo-600",
  },
];

import { motion } from "framer-motion";

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await IntegrationsAPI.getAll();
      setIntegrations(data);
    } catch (error) {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleConnect = (providerInfo: any) => {
    const existing = integrations.find(i => i.provider === providerInfo.provider);
    setSelectedProvider({
      ...providerInfo,
      id: existing?.id || "",
      isConnected: !!existing?.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDisconnect = async (providerInfo: any) => {
    const existing = integrations.find(i => i.provider === providerInfo.provider);
    if (!existing) return;

    if (!confirm(`Are you sure you want to disconnect ${providerInfo.name}? This will stop all active syncs.`)) {
      return;
    }

    try {
      await IntegrationsAPI.update(existing.id, { is_active: false });
      toast.success(`${providerInfo.name} disconnected successfully`);
      fetchIntegrations();
    } catch (error) {
      toast.error("Failed to disconnect integration");
    }
  };

  const enrichedProviders = PROVIDERS.map(p => {
    const existing = integrations.find(i => i.provider === p.provider);
    return {
      ...p,
      id: existing?.id || "",
      isConnected: !!existing?.is_active,
      lastConnected: existing?.connected_at,
    } as IntegrationProvider;
  });

  return (
    <div className="p-10 max-w-[1400px] mx-auto min-h-screen bg-gray-50/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-10"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <LayoutGrid className="text-primary" size={18} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Settings</span>
            </div>
            <p className="text-gray-500 max-w-2xl leading-relaxed text-base font-medium">
              Supercharge your workflows by connecting with industry-leading tools. 
              Manage authentication, event tracking, and automated syncs from a single, secure interface.
              <span className="block mt-2 text-sm">
                Transactional emails (lead/application/agent onboarding) are sent via backend Gmail SMTP env config only.
                Mail integrations below are reserved for campaign workflows.
              </span>
            </p>
          </div>
          <Button 
            variant="flat" 
            onPress={fetchIntegrations}
            isIconOnly
            className="bg-white shadow-sm border border-gray-100 h-12 w-12 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : "text-gray-500"} />
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group"
            >
                <div className="p-4 bg-green-50 rounded-2xl group-hover:bg-green-100 transition-colors duration-500">
                    <Zap size={24} className="text-green-600" />
                </div>
                <div>
                    <div className="text-3xl font-black text-gray-900 leading-none mb-1">
                        {enrichedProviders.filter(p => p.isConnected).length}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Integrations</div>
                </div>
            </motion.div>
        </div>

        <div className="space-y-8">
            <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                    Connectable Services
                </span>
                <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1" />
            </div>

            {loading && integrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <Spinner size="lg" color="primary" />
                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
                    </div>
                    <p className="text-gray-400 text-sm font-bold tracking-wide animate-pulse">Syncing Provider Status...</p>
                </div>
            ) : (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {enrichedProviders.map((provider) => (
                        <motion.div
                          key={provider.provider}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                            <IntegrationCard
                                integration={provider}
                                onConnect={handleConnect}
                                onDisconnect={handleDisconnect}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>

        {/* Future Integrations Section */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100/50 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Plus className="text-indigo-400" size={32} />
            </div>
            <div className="space-y-1">
                <h4 className="font-bold text-gray-900">Need more integrations?</h4>
                <p className="text-sm text-gray-500 max-w-md">
                    We're constantly adding new tools. Suggestions for Zapier, Slack, or WhatsApp? 
                    Let our support team know!
                </p>
            </div>
        </div>
      </motion.div>

      <IntegrationConfigModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        integration={selectedProvider}
        existingConfig={integrations.find(i => i.provider === selectedProvider?.provider)}
        onSuccess={fetchIntegrations}
      />
    </div>
  );
}
