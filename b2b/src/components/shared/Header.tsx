"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge } from "@heroui/react";

export default function Header() {
  const { partner, logout } = useAuth();
  
  const urls = [
    { name: "Home", path: "/" },
    { name: "My Applications", path: "/my-applications" },
    { name: "Contract Hub", path: "/contract-hub" },
    { name: "Commission Hub", path: "/commission-hub" },
    { name: "Analytics", path: "/analytics" },
    { name: "Support", path: "/support" },
  ];

  const current = usePathname();

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="h-30 flex items-center justify-between px-10">
            <img src="/logo.gif" className="h-18" alt="IDB Global Logo" />
            <div className="flex justify-end items-center space-x-6">
                <div className="flex items-center border-[1.25px] border-gray-400 bg-white px-3 py-1 rounded-xl focus:ring-1 focus:ring-gray-400 focus:outline-none">
                    <Search className="w-5 h-5 stroke-[1.25px] mr-2" />
                    <input type="text" className="focus:ring-none focus:outline-none" />
                </div>
                
                <Badge content="5" color="danger" size="sm">
                  <Bell className="w-6 h-6 stroke-[1.25px] cursor-pointer hover:text-gray-600" />
                </Badge>
                
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                      <UserCircle className="w-6 h-6 stroke-[1.25px]" />
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">{partner?.name || 'User'}</span>
                        <span className="text-xs text-gray-500 capitalize">{partner?.role || 'Agent'}</span>
                      </div>
                    </div>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="User Actions">
                    <DropdownItem key="profile" className="h-14 gap-2">
                      <p className="font-semibold">Signed in as</p>
                      <p className="font-semibold text-gray-600">{partner?.email}</p>
                    </DropdownItem>
                    {partner?.branch_name ? (
                      <DropdownItem key="branch" isReadOnly>
                        <p className="text-xs text-gray-500">Branch: {partner.branch_name}</p>
                      </DropdownItem>
                    ) : null}
                    <DropdownItem 
                      key="logout" 
                      color="danger" 
                      className="text-danger"
                      onPress={logout}
                      startContent={<LogOut className="w-4 h-4" />}
                    >
                      Log Out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
            </div>
        </div>
      </div>
      <div className="w-full">
        <div className="container shadow-lg mx-auto border rounded-2xl border-gray-300 bg-gray-200 p-2">
          <LayoutGroup>
            <nav className="flex items-center relative overflow-x-auto py-2 bg-white rounded-xl ">
              {urls.map((url) => {
                const isActive = current === url.path;

                return (
                  <Link
                    key={url.name}
                    href={url.path}
                    className="relative mx-2 px-4 py-2 text-nowrap"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-nav"
                        className="absolute inset-0 bg-black rounded-xl"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      />
                    )}

                    <span
                      className={`relative z-10 ${
                        isActive ? "text-white" : "text-black"
                      }`}
                    >
                      {url.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}
