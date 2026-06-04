"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { motion, LayoutGroup } from "framer-motion";
import { Bell, Search, UserCircle, LogOut, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useState } from "react";
import { AuthAPI } from "@/lib/api";

export default function Header() {
  const { partner, logout } = useAuth();
  const enforce = true;
  const contractApproved = partner?.contract_approved === true;
  const restrictByContract = enforce && !contractApproved;
  const isTeamMember = partner?.type === 'agent_team_member';

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsResetting(true);
    try {
      await AuthAPI.resetPassword(newPassword);
      setSuccess("Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsResetModalOpen(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to reset password. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };
  
  const urls = [
    { name: "Home", path: "/" },
    { name: "Contract Hub", path: "/contract-hub" }, // Feature 3: Swapped
    { name: "My Applications", path: "/my-applications" },
    { name: "Commission Hub", path: "/commission-hub" },
    { name: "Team", path: "/team" },
    { name: "Get Support", path: "/support" },
  ].filter((u) => !(isTeamMember && (u.path === '/commission-hub' || u.path === '/team')));

  const router = useRouter();
  const current = router.pathname;

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
                      key="reset-password"
                      onPress={() => {
                        setError(null);
                        setSuccess(null);
                        setNewPassword("");
                        setConfirmPassword("");
                        setIsResetModalOpen(true);
                      }}
                      startContent={<Key className="w-4 h-4" />}
                    >
                      Reset Password
                    </DropdownItem>
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

                const locked = restrictByContract && url.path !== '/contract-hub';

                return (
                  <Link
                    key={url.name}
                    href={locked ? '#' : url.path}
                    className={`relative mx-2 px-4 py-2 text-nowrap ${locked ? 'opacity-40 pointer-events-none' : ''}`}
                    aria-disabled={locked}
                    title={locked ? 'Sign and get approval in Contract Hub to unlock' : undefined}
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

      {/* Reset Password Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} placement="center">
        <ModalContent>
          <form onSubmit={handleResetPassword}>
            <ModalHeader className="flex flex-col gap-1">Reset Password</ModalHeader>
            <ModalBody className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-200">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Input
                  label="New Password"
                  placeholder="Enter new password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  isRequired
                  variant="bordered"
                />
              </div>
              <div className="space-y-2">
                <Input
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isRequired
                  variant="bordered"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={() => setIsResetModalOpen(false)}>
                Cancel
              </Button>
              <Button color="primary" type="submit" isLoading={isResetting}>
                Reset Password
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
