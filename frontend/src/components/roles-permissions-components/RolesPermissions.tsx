'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Checkbox,
  CheckboxGroup,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
  Chip,
  Accordion,
  AccordionItem,
} from '@heroui/react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { PermissionGroupsAPI, PermissionsAPI, RolesAPI } from '@/lib/api';

interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  permission_group_id?: string;
  permission_group?: PermissionGroup;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  role_permissions?: {
    permission_id: string;
    permission: Permission;
  }[];
}

export default function RolesPermissions() {
  const [activeTab, setActiveTab] = useState('roles');
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Permission Group form
  const [groupName, setGroupName] = useState('');
  const groupModal = useDisclosure();

  // Permission form
  const [permissionName, setPermissionName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const permissionModal = useDisclosure();

  // Role form
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const roleModal = useDisclosure();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [groupsData, permissionsData, rolesData] = await Promise.all([
        PermissionGroupsAPI.getAll(),
        PermissionsAPI.getAll(),
        RolesAPI.getAll(),
      ]);
      setPermissionGroups(groupsData);
      setPermissions(permissionsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Permission Group handlers
  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await PermissionGroupsAPI.create({ name: groupName });
      setGroupName('');
      groupModal.onClose();
      fetchAllData();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission group?')) return;
    try {
      await PermissionGroupsAPI.delete(id);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // Permission handlers
  const handleCreatePermission = async () => {
    if (!permissionName.trim()) return;
    try {
      await PermissionsAPI.create({
        name: permissionName,
        permission_group_id: selectedGroupId || undefined,
      });
      setPermissionName('');
      setSelectedGroupId('');
      permissionModal.onClose();
      fetchAllData();
    } catch (error) {
      console.error('Error creating permission:', error);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    try {
      await PermissionsAPI.delete(id);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
  };

  // Role handlers
  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setSelectedPermissions(role.role_permissions?.map(rp => rp.permission_id) || []);
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
    }
    roleModal.onOpen();
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    try {
      if (editingRole) {
        await RolesAPI.update(editingRole.id, {
          name: roleName,
          description: roleDescription,
          permissionIds: selectedPermissions,
        });
      } else {
        await RolesAPI.create({
          name: roleName,
          description: roleDescription,
          permissionIds: selectedPermissions,
        });
      }
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);
      setEditingRole(null);
      roleModal.onClose();
      fetchAllData();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await RolesAPI.delete(id);
      fetchAllData();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  // Group permissions by group
  const groupedPermissions = permissionGroups.map(group => ({
    ...group,
    permissions: permissions.filter(p => p.permission_group_id === group.id),
  }));

  const ungroupedPermissions = permissions.filter(p => !p.permission_group_id);

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system roles and access control</p>
        </div>
      </div>

      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        size="lg"
        className="mb-6"
      >
        {/* Roles Tab */}
        <Tab key="roles" title={
          <div className="flex items-center gap-2">
            <span>Roles</span>
            <Chip size="sm" variant="flat">{roles.length}</Chip>
          </div>
        }>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Roles</h2>
                <p className="text-sm text-gray-500 mt-1">Create and configure user roles with specific permissions</p>
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={() => handleOpenRoleModal()}
                className="text-white"
                size="lg"
              >
                Create Role
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="border-2 hover:border-primary transition-colors">
                  <CardBody className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                          <Chip size="sm" color="primary" variant="flat">
                            {role.role_permissions?.length || 0} permissions
                          </Chip>
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-600">{role.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          onPress={() => handleOpenRoleModal(role)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleDeleteRole(role.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {role.role_permissions?.slice(0, 6).map((rp) => (
                          <Chip key={rp.permission_id} size="sm" variant="bordered" className="text-xs">
                            {rp.permission.name}
                          </Chip>
                        ))}
                        {(role.role_permissions?.length || 0) > 6 && (
                          <Chip size="sm" variant="flat" className="text-xs">
                            +{(role.role_permissions?.length || 0) - 6} more
                          </Chip>
                        )}
                        {(!role.role_permissions || role.role_permissions.length === 0) && (
                          <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {roles.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardBody className="py-16">
                  <p className="text-center text-gray-400 text-lg">No roles created yet</p>
                  <p className="text-center text-gray-400 text-sm mt-2">Create your first role to get started</p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>

        {/* Permissions Tab */}
        <Tab key="permissions" title={
          <div className="flex items-center gap-2">
            <span>Permissions</span>
            <Chip size="sm" variant="flat">{permissions.length}</Chip>
          </div>
        }>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Permissions</h2>
                <p className="text-sm text-gray-500 mt-1">Define specific access controls and capabilities</p>
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={permissionModal.onOpen}
                className="text-white"
                size="lg"
              >
                Create Permission
              </Button>
            </div>
            
            <div className="space-y-6">
              {groupedPermissions.map((group) => (
                <Card key={group.id} className="border-2">
                  <CardBody className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                        <Chip size="sm" color="primary" variant="flat">
                          {group.permissions.length}
                        </Chip>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDeleteGroup(group.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-gray-300 transition-colors group"
                        >
                          <span className="text-sm font-medium text-gray-700">{permission.name}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onPress={() => handleDeletePermission(permission.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {group.permissions.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-4">No permissions in this group</p>
                    )}
                  </CardBody>
                </Card>
              ))}

              {ungroupedPermissions.length > 0 && (
                <Card className="border-2 border-dashed">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Ungrouped Permissions</h3>
                      <Chip size="sm" variant="flat">{ungroupedPermissions.length}</Chip>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {ungroupedPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-gray-300 transition-colors group"
                        >
                          <span className="text-sm font-medium text-gray-700">{permission.name}</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onPress={() => handleDeletePermission(permission.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {groupedPermissions.length === 0 && ungroupedPermissions.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardBody className="py-16">
                    <p className="text-center text-gray-400 text-lg">No permissions created yet</p>
                    <p className="text-center text-gray-400 text-sm mt-2">Create your first permission to get started</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </Tab>

        {/* Permission Groups Tab */}
        <Tab key="groups" title={
          <div className="flex items-center gap-2">
            <span>Permission Groups</span>
            <Chip size="sm" variant="flat">{permissionGroups.length}</Chip>
          </div>
        }>
          <div className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Permission Groups</h2>
                <p className="text-sm text-gray-500 mt-1">Organize permissions into logical groups</p>
              </div>
              <Button
                color="primary"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={groupModal.onOpen}
                className="text-white"
                size="lg"
              >
                Create Group
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map((group) => (
                <Card key={group.id} className="border-2 hover:border-primary transition-colors">
                  <CardBody className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{group.name}</h3>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color="primary" variant="flat">
                            {permissions.filter(p => p.permission_group_id === group.id).length}
                          </Chip>
                          <span className="text-xs text-gray-500">permissions</span>
                        </div>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={() => handleDeleteGroup(group.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {permissionGroups.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardBody className="py-16">
                  <p className="text-center text-gray-400 text-lg">No permission groups created yet</p>
                  <p className="text-center text-gray-400 text-sm mt-2">Create your first group to organize permissions</p>
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Create Permission Group Drawer */}
      <Drawer isOpen={groupModal.isOpen} onClose={groupModal.onClose} placement="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1 border-b">
            <h2 className="text-xl font-bold">Create Permission Group</h2>
            <p className="text-sm text-gray-500 font-normal">Group related permissions together</p>
          </DrawerHeader>
          <DrawerBody className="pt-6">
            <Input
              label="Group Name"
              placeholder="e.g., User Management, Reports"
              value={groupName}
              onValueChange={setGroupName}
              size="lg"
              variant="bordered"
            />
          </DrawerBody>
          <DrawerFooter className="border-t">
            <Button variant="flat" onPress={groupModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateGroup} className="text-white" isDisabled={!groupName.trim()}>
              Create Group
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Create Permission Drawer */}
      <Drawer isOpen={permissionModal.isOpen} onClose={permissionModal.onClose} placement="right">
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1 border-b">
            <h2 className="text-xl font-bold">Create Permission</h2>
            <p className="text-sm text-gray-500 font-normal">Define a new access control permission</p>
          </DrawerHeader>
          <DrawerBody className="pt-6">
            <div className="space-y-4">
              <Input
                label="Permission Name"
                placeholder="e.g., create_user, view_reports"
                value={permissionName}
                onValueChange={setPermissionName}
                size="lg"
                variant="bordered"
              />
              <Select
                label="Permission Group (Optional)"
                placeholder="Select a group"
                selectedKeys={selectedGroupId ? [selectedGroupId] : []}
                onSelectionChange={(keys) => setSelectedGroupId(Array.from(keys)[0] as string)}
                size="lg"
                variant="bordered"
              >
                {permissionGroups.map((group) => (
                  <SelectItem key={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </DrawerBody>
          <DrawerFooter className="border-t">
            <Button variant="flat" onPress={permissionModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreatePermission} className="text-white" isDisabled={!permissionName.trim()}>
              Create Permission
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Create/Edit Role Drawer */}
      <Drawer 
        isOpen={roleModal.isOpen} 
        onClose={roleModal.onClose}
        placement="right"
        size="2xl"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1 border-b">
            <h2 className="text-xl font-bold">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
            <p className="text-sm text-gray-500 font-normal">
              {editingRole ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
            </p>
          </DrawerHeader>
          <DrawerBody className="pt-6">
            <div className="space-y-6">
              <Input
                label="Role Name"
                placeholder="e.g., Admin, Manager"
                value={roleName}
                onValueChange={setRoleName}
                size="lg"
                variant="bordered"
                isRequired
              />
              <Input
                label="Description (Optional)"
                placeholder="Role description"
                value={roleDescription}
                onValueChange={setRoleDescription}
                size="lg"
                variant="bordered"
              />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase">Assign Permissions</h3>
                    <p className="text-xs text-gray-500 mt-1">Select permissions to grant to this role</p>
                  </div>
                  <Chip color="primary" variant="flat">
                    {selectedPermissions.length} selected
                  </Chip>
                </div>
                
                <CheckboxGroup
                  value={selectedPermissions}
                  onValueChange={setSelectedPermissions}
                  className="w-full"
                >
                  {groupedPermissions.length > 0 && (
                    <Accordion variant="bordered" selectionMode="multiple">
                      {groupedPermissions.map((group) => (
                        <AccordionItem
                          key={group.id}
                          title={
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">{group.name}</span>
                                <Chip size="sm" variant="flat" color="primary">
                                  {group.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {group.permissions.length}
                                </Chip>
                              </div>
                            </div>
                          }
                          className="border-b last:border-b-0"
                        >
                          <div className="grid grid-cols-2 gap-1 pb-4">
                            {group.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                                <Checkbox value={permission.id} className="w-full">
                                  <span className="text-sm font-medium">{permission.name}</span>
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}

                  {ungroupedPermissions.length > 0 && (
                    <div className="mt-6 border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="font-bold text-gray-900">Other Permissions</h4>
                        <Chip size="sm" variant="flat">
                          {ungroupedPermissions.filter(p => selectedPermissions.includes(p.id)).length} / {ungroupedPermissions.length}
                        </Chip>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {ungroupedPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                            <Checkbox value={permission.id} className="w-full">
                              <span className="text-sm font-medium">{permission.name}</span>
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CheckboxGroup>

                {permissions.length === 0 && (
                  <Card className="border-2 border-dashed">
                    <CardBody className="py-8">
                      <p className="text-center text-gray-400">
                        No permissions available. Create permissions first.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="border-t">
            <Button variant="flat" onPress={roleModal.onClose} size="lg">
              Cancel
            </Button>
            <Button color="primary" onPress={handleSaveRole} className="text-white" size="lg" isDisabled={!roleName.trim()}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
