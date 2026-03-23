"use client";

import React, { useEffect } from "react";
import { 
  Badge, 
  Button, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  Tabs, 
  Tab,
  ScrollShadow,
  Spinner
} from "@heroui/react";
import { Bell, Megaphone, CheckCircle2 } from "lucide-react";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { format } from "date-fns";

export default function NotificationBell() {
  const { 
    announcements, 
    unreadCount, 
    fetchAnnouncements, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead,
    loading 
  } = useAnnouncementStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchAnnouncements(); // Fetch initial list
  }, [fetchUnreadCount, fetchAnnouncements]);

  const unreadAnnouncements = announcements.filter(
    (a) => !a.announcement_reads?.length
  );
  const readAnnouncements = announcements.filter(
    (a) => a.announcement_reads?.length
  );

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    fetchAnnouncements(); // Refresh list to update tabs
  };

  const AnnouncementItem = ({ item, isRead }: { item: any; isRead: boolean }) => (
    <div className="flex flex-col gap-1 p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
            <Megaphone size={14} className={isRead ? 'text-gray-500' : 'text-blue-600'} />
          </div>
          <span className="font-semibold text-sm line-clamp-1">{item.title}</span>
        </div>
        {!isRead && (
          <Button 
            isIconOnly 
            size="sm" 
            variant="light" 
            color="primary"
            title="Mark as read"
            onPress={() => item.id && handleMarkRead(item.id)}
          >
            <CheckCircle2 size={16} />
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 pl-8">{item.content}</p>
      <span className="text-[10px] text-gray-400 pl-8">
        {item.created_at ? format(new Date(item.created_at), "MMM d, p") : "Just now"}
      </span>
    </div>
  );

  return (
    <Popover placement="bottom-end" showArrow offset={10}>
      <PopoverTrigger>
        <Button 
          isIconOnly
          variant="solid"
          color="primary"
          radius="full"
          className="relative shadow-sm"
          aria-label="Notifications"
        >
          <Bell size={20} className="text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primary ring-0" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 overflow-hidden">
        <div className="w-full">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                size="sm" 
                variant="light" 
                color="primary" 
                onPress={markAllAsRead}
                className="text-xs h-7 px-2"
              >
                Mark all as read
              </Button>
            )}
          </div>
          
          <Tabs 
            aria-label="Notifications tabs" 
            variant="underlined" 
            fullWidth
            classNames={{
              tabList: "px-4",
              panel: "p-0"
            }}
          >
            <Tab key="unread" title={`Unread (${unreadCount})`}>
              <ScrollShadow className="max-h-[400px]">
                {loading ? (
                  <div className="flex justify-center p-8"><Spinner size="sm" /></div>
                ) : unreadAnnouncements.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No unread notifications</div>
                ) : (
                  unreadAnnouncements.map((item) => (
                    <AnnouncementItem key={item.id} item={item} isRead={false} />
                  ))
                )}
              </ScrollShadow>
            </Tab>
            <Tab key="read" title="Read">
              <ScrollShadow className="max-h-[400px]">
                {loading ? (
                  <div className="flex justify-center p-8"><Spinner size="sm" /></div>
                ) : readAnnouncements.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No read notifications</div>
                ) : (
                  readAnnouncements.map((item) => (
                    <AnnouncementItem key={item.id} item={item} isRead={true} />
                  ))
                )}
              </ScrollShadow>
            </Tab>
          </Tabs>
          
          <div className="p-2 border-t border-gray-100 text-center">
            <Button 
                variant="light" 
                size="sm" 
                color="primary" 
                className="w-full text-xs"
                onPress={() => window.location.href = '/announcements'}
            >
              View All Announcements
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
