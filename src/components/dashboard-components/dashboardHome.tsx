"use client";

import { Card, CardBody } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { Input } from "@heroui/react";
import { BellIcon, MegaphoneIcon, CalendarIcon } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* My To-do's */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">My To do's</h2>
          </div>

          <Tabs aria-label="to-dos tabs" variant="underlined">
            <Tab key="current" title="Current">
              <Input
                radius="md"
                placeholder="Add a to do... Use # to mention any lead..."
                className="mt-2"
              />
              <div className="border-t mt-6 pt-6 text-center text-sm text-gray-400">
                No To-do's yet.
              </div>
            </Tab>

            <Tab key="completed" title="Completed">
              <div className="pt-6 text-center text-sm text-gray-400">
                No completed tasks yet.
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Announcements */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MegaphoneIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Announcements</h2>
          </div>

          <Tabs aria-label="announcements" variant="underlined">
            <Tab key="unread" title="Unread">
              <div className="pt-6 text-center text-sm text-gray-400">
                No unread announcements.
              </div>
            </Tab>
            <Tab key="read" title="Read">
              <div className="pt-6 text-center text-sm text-gray-400">
                No read announcements.
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Today's Follow Ups */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Today's Follow Ups</h2>
          </div>

          <Tabs aria-label="follow-ups" variant="underlined">
            <Tab key="pending" title="Pending (0)">
              <div className="pt-6 text-center text-sm text-gray-400">
                Nothing pending.
              </div>
            </Tab>
            <Tab key="complete" title="Completed (0)">
              <div className="pt-6 text-center text-sm text-gray-400">
                No follow ups completed.
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Today's Task Deadlines */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Today's Tasks Deadline</h2>
          </div>

          <div className="pt-6 text-center text-sm text-gray-400">
            No tasks due today.
          </div>
        </CardBody>
      </Card>

    </div>
  );
}
