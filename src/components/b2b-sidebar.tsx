"use client"
import * as React from "react"
import {
    FileText,
    Bell,
    DollarSign,
    Plus,
    Home,
    BookOpenCheck,
    ClipboardList,
    Building2
} from "lucide-react";

const mainMenu = [
    { title: "Home", url: "/b2b", icon: Home },
    { title: "Course Wiz", url: "#", icon: BookOpenCheck },
    { title: "Agents Leads", url: "/b2b/agent-leads", icon: ClipboardList },
    { title: "Reports", url: "#", icon: FileText },
    { title: "Announcements", url: "#", icon: Bell },
    { title: "University Commissions", url: "#", icon: Building2 },
    { title: "B2B Commissions", url: "#", icon: DollarSign },
];
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
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";
import Link from "next/link";
import LeadFormSheet from "./leads-components/createUpdateLead";
import { usePartnerStore } from "@/stores/usePartnerStore";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const currentRoute = usePathname();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const handleCreateClick = () => {
        setIsSheetOpen(true);
    };
    const partnerDetails = usePartnerStore((s) => s.currentPartner);

    const finalUser = {
        name: partnerDetails?.name ?? "",
        email: partnerDetails?.email ?? "",
        avatar: "https://swiftwebapp.sgp1.digitaloceanspaces.com/images/avatar.png",
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
                                <div className="flex flex-col items-start">
                                    <div className="font-bold leading-tight text-primary text-lg break-words h-6 mt-1 capitalize">
                                        {partnerDetails?.agency_name || ""
                                        }
                                    </div>
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

                    <hr className="border-t-2 border-border mx-4 border-dotted my-0.5" />
                    {/* Study Abroad Section */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {mainMenu.map((item) => (
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
                </SidebarContent>

                <SidebarFooter>
                    <NavUser user={finalUser} />
                </SidebarFooter>
            </Sidebar>
            <LeadFormSheet
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </>
    )
}