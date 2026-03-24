import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { CheckCircle2, ChevronRight, Settings2, Unlink } from "lucide-react";
import { motion } from "framer-motion";

export interface IntegrationProvider {
  id: string;
  name: string;
  provider: "RAZORPAY" | "GOOGLE_ADS" | "META_PIXEL";
  description: string;
  icon: React.ReactNode;
  color: string;
  isConnected: boolean;
  lastConnected?: string;
}

interface IntegrationCardProps {
  integration: IntegrationProvider;
  onConnect: (integration: IntegrationProvider) => void;
  onDisconnect: (integration: IntegrationProvider) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onDisconnect,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden bg-white/70 backdrop-blur-xl group">
        <CardBody className="p-0 flex flex-col h-full">
          <div className={`h-2 w-full transition-all duration-500 group-hover:h-3 ${integration.color}`} />
          <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                {integration.icon}
              </div>
              {integration.isConnected ? (
                <Chip
                  startContent={<CheckCircle2 size={14} />}
                  color="success"
                  variant="flat"
                  className="font-bold border border-success-200/50"
                  size="sm"
                >
                  Connected
                </Chip>
              ) : (
                <Chip color="default" variant="flat" className="font-bold opacity-60" size="sm">
                  Not Connected
                </Chip>
              )}
            </div>

            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{integration.name}</h3>
            <p className="text-gray-500 text-[13px] leading-relaxed mb-8 flex-grow">
              {integration.description}
            </p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
              {integration.isConnected ? (
                <div className="flex gap-2 w-full">
                  <Button
                    size="md"
                    variant="flat"
                    onPress={() => onConnect(integration)}
                    startContent={<Settings2 size={18} />}
                    className="flex-1 font-bold h-11"
                  >
                    Configure
                  </Button>
                  <Button
                    size="md"
                    variant="light"
                    color="danger"
                    onPress={() => onDisconnect(integration)}
                    isIconOnly
                    className="h-11 w-11"
                  >
                    <Unlink size={18} />
                  </Button>
                </div>
              ) : (
                <Button
                  color="primary"
                  onPress={() => onConnect(integration)}
                  endContent={<ChevronRight size={18} />}
                  className="w-full font-bold h-12 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                  Connect Service
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

