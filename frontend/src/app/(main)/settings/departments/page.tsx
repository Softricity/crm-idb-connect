"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Plus, Save, Trash2, Workflow } from "lucide-react";
import {
  DepartmentStatusInput,
  DepartmentsAPI,
} from "@/lib/api";
import { BranchPermission, hasPermission } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DepartmentOrderConfig {
  id?: string;
  order_index: number;
  is_active: boolean;
  is_default: boolean;
}

interface DepartmentStatusConfig extends DepartmentStatusInput {
  id?: string;
}

interface DepartmentRecord {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  department_orders: DepartmentOrderConfig[];
  department_statuses: DepartmentStatusConfig[];
  _count?: {
    partner_departments: number;
  };
}

const EMPTY_NEW_DEPARTMENT = {
  name: "",
  code: "",
};

function sortStatuses(statuses: DepartmentStatusConfig[]) {
  return [...statuses].sort((a, b) => a.order_index - b.order_index);
}

function normalizeStatusKey(rawKey: string, fallbackLabel: string) {
  const key = rawKey.trim();
  if (key) {
    return key;
  }

  return fallbackLabel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function ensureSingleDefaultStatus(statuses: DepartmentStatusConfig[]) {
  const activeStatuses = statuses.filter((status) => status.is_active !== false);
  if (activeStatuses.length === 0) {
    return statuses.map((status) => ({ ...status, is_default: false }));
  }

  const firstDefault = activeStatuses.find((status) => status.is_default);
  const defaultKey = firstDefault?.key || firstDefault?.label || activeStatuses[0].label;

  let defaultAssigned = false;
  return statuses.map((status) => {
    const shouldBeDefault =
      status.is_active !== false &&
      !defaultAssigned &&
      (status.key === defaultKey || status.label === defaultKey);

    if (shouldBeDefault) {
      defaultAssigned = true;
      return { ...status, is_default: true };
    }

    return { ...status, is_default: false };
  });
}

function getOrderConfig(department: DepartmentRecord): DepartmentOrderConfig {
  return (
    department.department_orders[0] || {
      order_index: 0,
      is_active: department.is_active,
      is_default: false,
    }
  );
}

function normalizeDepartment(department: any): DepartmentRecord {
  return {
    id: department.id,
    name: department.name,
    code: department.code,
    is_active: department.is_active,
    department_orders: department.department_orders || [],
    department_statuses: sortStatuses(department.department_statuses || []),
    _count: department._count,
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const canManageBranches = user?.permissions
    ? hasPermission(user.permissions, BranchPermission.BRANCH_MANAGE)
    : false;

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingDepartmentId, setSavingDepartmentId] = useState<string | null>(null);
  const [savingStatusesDepartmentId, setSavingStatusesDepartmentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDepartment, setNewDepartment] = useState(EMPTY_NEW_DEPARTMENT);
  const [statusDrawerDepartmentId, setStatusDrawerDepartmentId] = useState<string | null>(null);

  const selectedDepartment =
    departments.find((department) => department.id === statusDrawerDepartmentId) || null;

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await DepartmentsAPI.fetchDepartments(true);
      const normalized = Array.isArray(data)
        ? data.map((department) => normalizeDepartment(department))
        : [];
      setDepartments(normalized);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !canManageBranches) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }

    if (user && canManageBranches) {
      fetchDepartments();
    }
  }, [user, canManageBranches, router]);

  useEffect(() => {
    if (statusDrawerDepartmentId && !selectedDepartment) {
      setStatusDrawerDepartmentId(null);
    }
  }, [selectedDepartment, statusDrawerDepartmentId]);

  const setDepartmentState = (
    departmentId: string,
    updater: (department: DepartmentRecord) => DepartmentRecord,
  ) => {
    setDepartments((prev) =>
      prev.map((department) =>
        department.id === departmentId ? updater(department) : department,
      ),
    );
  };

  const handleCreateDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.code.trim()) {
      toast.error("Department name and code are required");
      return;
    }

    const maxOrder = departments.reduce((acc, department) => {
      const currentOrder = getOrderConfig(department).order_index;
      return Math.max(acc, currentOrder);
    }, -1);

    setIsCreating(true);
    try {
      await DepartmentsAPI.createDepartment({
        name: newDepartment.name.trim(),
        code: newDepartment.code.trim(),
        is_active: true,
        order_index: maxOrder + 1,
      });
      toast.success("Department created successfully");
      setNewDepartment(EMPTY_NEW_DEPARTMENT);
      await fetchDepartments();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create department");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveDepartment = async (department: DepartmentRecord) => {
    if (!department.name.trim() || !department.code.trim()) {
      toast.error("Department name and code are required");
      return;
    }

    const orderConfig = getOrderConfig(department);

    setSavingDepartmentId(department.id);
    try {
      await DepartmentsAPI.updateDepartment(department.id, {
        name: department.name.trim(),
        code: department.code.trim(),
        is_active: department.is_active,
        order_index: orderConfig.order_index,
        is_default: orderConfig.is_default,
      });
      toast.success(`Saved ${department.name}`);
      await fetchDepartments();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save department");
    } finally {
      setSavingDepartmentId(null);
    }
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await DepartmentsAPI.updateDepartmentOrder(
        departments.map((department) => {
          const orderConfig = getOrderConfig(department);
          return {
            department_id: department.id,
            order_index: orderConfig.order_index,
            is_active: orderConfig.is_active,
            is_default: orderConfig.is_default,
          };
        }),
      );
      toast.success("Department order updated");
      await fetchDepartments();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update department order");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleAddStatus = (departmentId: string) => {
    setDepartmentState(departmentId, (department) => {
      const nextOrderIndex =
        department.department_statuses.length > 0
          ? Math.max(...department.department_statuses.map((status) => status.order_index)) + 1
          : 0;

      const nextStatuses = [
        ...department.department_statuses,
        {
          key: "",
          label: "",
          order_index: nextOrderIndex,
          is_terminal: false,
          is_default: department.department_statuses.length === 0,
          is_active: true,
        },
      ];

      return {
        ...department,
        department_statuses: sortStatuses(nextStatuses),
      };
    });
  };

  const handleUpdateStatus = (
    departmentId: string,
    statusIndex: number,
    patch: Partial<DepartmentStatusConfig>,
  ) => {
    setDepartmentState(departmentId, (department) => {
      const nextStatuses = department.department_statuses.map((status, index) => {
        if (index !== statusIndex) {
          return status;
        }

        return {
          ...status,
          ...patch,
        };
      });

      const normalizedStatuses =
        patch.is_default === true
          ? nextStatuses.map((status, index) => ({
              ...status,
              is_default: index === statusIndex,
            }))
          : nextStatuses;

      return {
        ...department,
        department_statuses: sortStatuses(normalizedStatuses),
      };
    });
  };

  const handleDeleteStatus = (departmentId: string, statusIndex: number) => {
    setDepartmentState(departmentId, (department) => {
      const nextStatuses = department.department_statuses.filter(
        (_, index) => index !== statusIndex,
      );

      return {
        ...department,
        department_statuses: ensureSingleDefaultStatus(sortStatuses(nextStatuses)),
      };
    });
  };

  const handleSaveStatuses = async (department: DepartmentRecord) => {
    const filteredStatuses = department.department_statuses
      .map((status) => {
        const key = normalizeStatusKey(status.key, status.label);
        return {
          ...status,
          key,
          label: status.label.trim(),
        };
      })
      .filter((status) => status.key && status.label);

    if (filteredStatuses.length === 0) {
      toast.error("Add at least one valid status before saving");
      return;
    }

    const keySet = new Set<string>();
    const orderSet = new Set<number>();
    for (const status of filteredStatuses) {
      if (keySet.has(status.key.toLowerCase())) {
        toast.error(`Duplicate status key: ${status.key}`);
        return;
      }
      keySet.add(status.key.toLowerCase());

      if (orderSet.has(status.order_index)) {
        toast.error(`Duplicate status order: ${status.order_index}`);
        return;
      }
      orderSet.add(status.order_index);
    }

    const sanitizedStatuses = ensureSingleDefaultStatus(filteredStatuses).map(
      (status) => ({
        key: status.key,
        label: status.label,
        order_index: status.order_index,
        is_terminal: status.is_terminal,
        is_default: status.is_default,
        is_active: status.is_active,
      }),
    );

    setSavingStatusesDepartmentId(department.id);
    try {
      await DepartmentsAPI.upsertDepartmentStatuses(department.id, sanitizedStatuses);
      toast.success(`Saved statuses for ${department.name}`);
      await fetchDepartments();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save department statuses");
    } finally {
      setSavingStatusesDepartmentId(null);
    }
  };

  if (!user || !canManageBranches) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[65vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {/* Removed h1 title as it's in the universal header */}
          <p className="text-sm text-gray-500 mt-1">
            Configure departments, routing order, and department-specific statuses.
          </p>
        </div>
        <Button
          color="primary"
          onPress={handleSaveOrder}
          isLoading={savingOrder}
          startContent={<Save size={16} />}
        >
          Save Department Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create Department</h2>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Department Name"
              value={newDepartment.name}
              onChange={(event) =>
                setNewDepartment((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <Input
              label="Department Code"
              value={newDepartment.code}
              onChange={(event) =>
                setNewDepartment((prev) => ({ ...prev, code: event.target.value }))
              }
            />
            <Button
              color="secondary"
              className="md:self-end"
              onPress={handleCreateDepartment}
              isLoading={isCreating}
              startContent={<Plus size={16} />}
            >
              Add Department
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Existing Departments</h2>
            <p className="text-xs text-gray-500 mt-1">
              Edit rows inline and open status editor when needed.
            </p>
          </div>
          <Chip variant="flat" size="sm">
            {departments.length} total
          </Chip>
        </CardHeader>
        <CardBody>
          <div className="border rounded-lg overflow-x-auto">
            <Table aria-label="Departments table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>CODE</TableColumn>
                <TableColumn>ORDER</TableColumn>
                <TableColumn>ACTIVE</TableColumn>
                <TableColumn>DEFAULT</TableColumn>
                <TableColumn>PARTNERS</TableColumn>
                <TableColumn>STATUSES</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={departments} emptyContent="No departments found">
                {(department) => {
                  const orderConfig = getOrderConfig(department);
                  const activeStatuses = department.department_statuses.filter(
                    (status) => status.is_active !== false,
                  ).length;

                  return (
                    <TableRow key={department.id}>
                      <TableCell>
                        <Input
                          size="sm"
                          value={department.name}
                          onChange={(event) =>
                            setDepartmentState(department.id, (current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          size="sm"
                          value={department.code}
                          onChange={(event) =>
                            setDepartmentState(department.id, (current) => ({
                              ...current,
                              code: event.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          size="sm"
                          type="number"
                          value={String(orderConfig.order_index)}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setDepartmentState(department.id, (current) => ({
                              ...current,
                              department_orders: [
                                {
                                  ...getOrderConfig(current),
                                  order_index: Number.isNaN(value) ? 0 : value,
                                },
                              ],
                            }));
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="sm"
                          isSelected={department.is_active}
                          onValueChange={(isSelected) =>
                            setDepartmentState(department.id, (current) => ({
                              ...current,
                              is_active: isSelected,
                              department_orders: [
                                {
                                  ...getOrderConfig(current),
                                  is_active: isSelected,
                                },
                              ],
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          size="sm"
                          isSelected={orderConfig.is_default}
                          onValueChange={(isSelected) => {
                            setDepartments((prev) =>
                              prev.map((item) => {
                                const itemOrder = getOrderConfig(item);
                                return {
                                  ...item,
                                  department_orders: [
                                    {
                                      ...itemOrder,
                                      is_default:
                                        item.id === department.id
                                          ? isSelected
                                          : isSelected
                                            ? false
                                            : itemOrder.is_default,
                                    },
                                  ],
                                };
                              }),
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {department._count?.partner_departments || 0}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="secondary">
                            {activeStatuses}/{department.department_statuses.length}
                          </Chip>
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => setStatusDrawerDepartmentId(department.id)}
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            color="primary"
                            size="sm"
                            onPress={() => handleSaveDepartment(department)}
                            isLoading={savingDepartmentId === department.id}
                            startContent={<Save size={14} />}
                          >
                            Save
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Drawer
        isOpen={Boolean(statusDrawerDepartmentId)}
        onClose={() => setStatusDrawerDepartmentId(null)}
        placement="right"
        size="5xl"
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 border-b">
                <h3 className="text-xl font-semibold">
                  {selectedDepartment ? `${selectedDepartment.name} Statuses` : "Department Statuses"}
                </h3>
                {selectedDepartment && (
                  <p className="text-sm text-gray-500">Code: {selectedDepartment.code}</p>
                )}
              </DrawerHeader>
              <DrawerBody className="pt-5">
                {selectedDepartment && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Status Configuration</h4>
                      <Button
                        variant="flat"
                        size="sm"
                        onPress={() => handleAddStatus(selectedDepartment.id)}
                        startContent={<Plus size={14} />}
                      >
                        Add Status
                      </Button>
                    </div>

                    {selectedDepartment.department_statuses.length === 0 && (
                      <p className="text-sm text-gray-500">No statuses configured yet.</p>
                    )}

                    <div className="space-y-3">
                      {selectedDepartment.department_statuses.map((status, statusIndex) => (
                        <div
                          key={`${selectedDepartment.id}-status-${statusIndex}`}
                          className="grid gap-3 md:grid-cols-12 border rounded-md p-3"
                        >
                          <Input
                            className="md:col-span-2"
                            label="Key"
                            value={status.key}
                            onChange={(event) =>
                              handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                key: event.target.value,
                              })
                            }
                          />
                          <Input
                            className="md:col-span-3"
                            label="Label"
                            value={status.label}
                            onChange={(event) =>
                              handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                label: event.target.value,
                              })
                            }
                          />
                          <Input
                            className="md:col-span-2"
                            label="Order"
                            type="number"
                            value={String(status.order_index)}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                order_index: Number.isNaN(value) ? 0 : value,
                              });
                            }}
                          />
                          <div className="md:col-span-4 grid grid-cols-3 gap-2 items-center">
                            <Switch
                              size="sm"
                              isSelected={status.is_active !== false}
                              onValueChange={(isSelected) =>
                                handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                  is_active: isSelected,
                                })
                              }
                            >
                              Active
                            </Switch>
                            <Switch
                              size="sm"
                              isSelected={status.is_default === true}
                              onValueChange={(isSelected) =>
                                handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                  is_default: isSelected,
                                })
                              }
                            >
                              Default
                            </Switch>
                            <Switch
                              size="sm"
                              isSelected={status.is_terminal === true}
                              onValueChange={(isSelected) =>
                                handleUpdateStatus(selectedDepartment.id, statusIndex, {
                                  is_terminal: isSelected,
                                })
                              }
                            >
                              Terminal
                            </Switch>
                          </div>
                          <div className="md:col-span-1 flex items-center justify-end">
                            <Button
                              isIconOnly
                              color="danger"
                              variant="light"
                              onPress={() => handleDeleteStatus(selectedDepartment.id, statusIndex)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DrawerBody>
              <DrawerFooter className="border-t">
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="secondary"
                  onPress={() => {
                    if (selectedDepartment) {
                      handleSaveStatuses(selectedDepartment);
                    }
                  }}
                  isDisabled={!selectedDepartment}
                  isLoading={
                    selectedDepartment
                      ? savingStatusesDepartmentId === selectedDepartment.id
                      : false
                  }
                  startContent={<Save size={14} />}
                >
                  Save Statuses
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
