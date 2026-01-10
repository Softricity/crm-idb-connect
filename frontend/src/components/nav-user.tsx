"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/useAuthStore"
import { useRouter } from "next/navigation"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role?: string
  }
}) {
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="mb-4 px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <Avatar className="h-10 w-10 rounded-lg grayscale">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col leading-tight">
              <span className="truncate font-semibold text-gray-900">{user.name}</span>
              <span className="truncate text-gray-500 text-xs">{user.email}</span>
              {user.role && <span className="truncate text-gray-400 text-xs">{user.role}</span>}
            </div>
            <IconDotsVertical className="w-5 h-5 text-gray-400" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="min-w-[220px] rounded-lg shadow-lg border border-gray-200"
          side="right"
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-2 font-normal">
            <div className="flex items-center gap-3 p-1">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-gray-500 text-sm">{user.email}</span>
                {user.role && <span className="truncate text-gray-400 text-sm">{user.role}</span>}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-1" />
          
          <DropdownMenuGroup className="px-1">
            <DropdownMenuItem className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
              <IconUserCircle className="w-4 h-4 text-gray-600" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
              <IconCreditCard className="w-4 h-4 text-gray-600" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
              <IconNotification className="w-4 h-4 text-gray-600" />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 hover:bg-red-100 text-red-600 rounded-md cursor-pointer"
          >
            <IconLogout className="w-4 h-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
