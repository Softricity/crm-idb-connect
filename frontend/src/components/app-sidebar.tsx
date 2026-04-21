"use client"
import * as React from "react"
import {
  LayoutDashboard,
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
  Settings,
  Plus,
  ShieldUser,
  Mail,
  Tags,
  Settings2,
  Briefcase,
  UserPlus,
  Fingerprint
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
      url: "/announcements",
    },
    {
      title: "Leads",
      icon: Users,
      url: "/leads",
    },
    {
      title: "Applications",
      icon: Briefcase,
      url: "/applications",
    },
    {
      title: "Universities",
      icon: School,
      url: "/universities",
    },
    {
      title: "Referrals",
      icon: UserPlus,
      url: "/referrals",
    },
  ],
  navBusiness: [
    {
      title: "Agreements Hub",
      icon: Building,
      url: "/agents/agreements",
    },
    {
      title: "Agents",
      icon: ShieldUser,
      url: "/agents",
    },
    {
      title: "Agent Categories",
      icon: Tags,
      url: "/agents/categories",
    },
    {
      title: "Commissions",
      icon: DollarSign,
      url: "/commissions",
    },
  ],
  navTaskManagement: [
    {
      title: "Tasks",
      icon: CheckSquare,
      url: "/tasks",
    },
    {
      title: "Follow Ups",
      icon: Clock,
      url: "/follow-ups",
    },
  ],
  navSupport: [
    {
      title: "Helpdesk",
      url: "/support",
      icon: HelpCircle,
    },
    {
      title: "Email Templates",
      url: "/settings/email-templates",
      icon: Mail,
    },
    {
      title: "Team Management",
      url: "/team",
      icon: Users,
    },
    {
      title: "Roles & Permissions",
      url: "/roles-permissions",
      icon: Fingerprint,
    },
    {
      title: "Customise",
      url: "/customise",
      icon: Settings2,
    },
    {
      title: "Settings",
      url: "/settings",
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
import LeadFormSheet  from "./leads-components/createUpdateLead";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentRoute = usePathname();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const handleCreateClick = () => {
    setIsSheetOpen(true);
  };
  return (
    <>
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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Add Lead"
                  >
                    <button className="shadow-sm flex items-center w-full gap-3 bg-primary text-white hover:cursor-pointer" onClick={handleCreateClick}><Plus /> <span>Add New Lead</span></button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

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
                        <item.icon className="h-4 w-4" />
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
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
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
      <LeadFormSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  )
}
