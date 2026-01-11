"use client";

import { useEffect } from "react";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { Card, CardHeader, CardBody, CardFooter, Chip, Button } from "@heroui/react";
import { Bell, Megaphone, Trash2 } from "lucide-react";
import { format } from "date-fns";
import CreateAnnouncementDialog from "@/components/announcement-components/CreateAnnouncementDialog";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AnnouncementsPage() {
  const { announcements, fetchAnnouncements, loading, deleteAnnouncement } = useAnnouncementStore();
  const { user } = useAuthStore();
  
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
            <p className="text-gray-500 text-sm">Updates, news, and important notices.</p>
          </div>
        </div>
        {isAdmin && <CreateAnnouncementDialog />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading ? (
          <div className="flex justify-center items-center py-20 col-span-2">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-default-500">Loading announcements...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-default-50 rounded-xl border-2 border-dashed border-default-200 col-span-2">
            <Bell className="mx-auto h-12 w-12 text-default-300 mb-3" />
            <h3 className="text-lg font-medium text-default-900">No Announcements</h3>
            <p className="text-default-500">You are all caught up!</p>
          </div>
        ) : (
          announcements.map((item) => (
            <Card 
              key={item.id} 
              className="group relative overflow-visible hover:shadow-lg transition-shadow"
              shadow="sm"
            >
              <CardHeader className="flex-row justify-between items-start gap-3 pb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-default-900">{item.title}</h3>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        className="capitalize"
                      >
                        {item.target_audience.replace('-', ' ')}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-500">
                      {item.created_at ? format(new Date(item.created_at), "PPP 'at' p") : "Just now"}
                    </p>
                  </div>
                </div>
                
                {isAdmin && item.id && (
                  <Button 
                    isIconOnly
                    variant="light" 
                    color="danger"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => item.id && deleteAnnouncement(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </CardHeader>
              
              <CardBody className="pt-0 pl-16">
                <p className="text-default-700 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </CardBody>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}