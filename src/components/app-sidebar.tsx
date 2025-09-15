"use client"
import * as React from "react"
import {
  Home,
  LayoutDashboard,
  FileText,
  Activity,
  GraduationCap,
  Bell,
  Users,
  MessageCircle,
  School,
  FileCheck,
  Building,
  DollarSign,
  CheckSquare,
  Clock,
  HelpCircle,
  Settings
} from "lucide-react";

const data = {
  user: {
    name: "Ishwor Ghimire",
    email: "ishwor@idbglobal.co",
    avatar: "/avatars/ishwor.jpg",
  },
  navMain: [

    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Reports",
      url: "#",
      icon: FileText,
    },
    {
      title: "Activity Logs",
      url: "#",
      icon: Activity,
    },
  ],
  navStudentManagement: [
    {
      title: "Course Wiz",
      icon: GraduationCap,
      url: "/courses",
    },
    {
      title: "Announcements",
      icon: Bell,
      url: "#",
    },
    {
      title: "Leads",
      icon: Users,
      url: "/leads",
    },
    {
      title: "Counsellings",
      icon: MessageCircle,
      url: "/counsellings",
    },
    {
      title: "Admissions",
      icon: School,
      url: "#",
    },
    {
      title: "Visas",
      icon: FileCheck,
      url: "#",
    },
  ],
  navBusiness: [
    {
      title: "B2B Hub",
      icon: Building,
      url: "#",
      badge: "42",
    },
    {
      title: "Commissions",
      icon: DollarSign,
      url: "#",
    },
  ],
  navTaskManagement: [
    {
      title: "Tasks",
      icon: CheckSquare,
      url: "#",
      badge: "1",
    },
    {
      title: "Follow Ups",
      icon: Clock,
      url: "#",
      badge: "25",
    },
  ],
  navSupport: [
    {
      title: "Helpdesk",
      url: "#",
      icon: HelpCircle,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
  ],
}

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";
import Link from "next/link";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentRoute = usePathname();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="w-full h-14 flex items-center justify-center">

              <img src="/logo.gif" alt="" className="w-3/4 h-auto rounded-lg" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* dotted line */}
        {/* Main Navigation */}
        <NavMain items={data.navMain} />
        <hr className="border-t-2 border-border mx-4 border-dotted my-0.5" />
        {/* Study Abroad Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Study Abroad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navStudentManagement.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className={item.url === currentRoute ? "bg-primary text-primary-foreground" : ""}>
                    <Link href={item.url} className="flex w-full items-center gap-3">
                      <item.icon className="h-4 w-4"/>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        <hr className="border-t-2 border-border mx-4 border-dotted my-1" />
        {/* Business Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navBusiness.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={item.url === currentRoute ? "bg-primary text-primary-foreground" : ""}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4"/>
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <hr className="border-t-2 border-border mx-4 border-dotted my-1" />
        {/* Task Management Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navTaskManagement.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={item.url === currentRoute ? "bg-primary text-primary-foreground" : ""}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4"/>
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Support Section */}
        <NavSecondary items={data.navSupport} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}