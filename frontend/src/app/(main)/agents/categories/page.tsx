"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  Checkbox, 
  Input, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Divider,
  Chip,
  Switch
} from '@heroui/react';
import { AgentsAPI, UniversitiesAPI } from '@/lib/api';
import { PermissionGuard } from '@/components/PermissionGuard';
import { AgentsPermission } from '@/lib/utils';
import { 
  PlusCircle, 
  Globe, 
  Pencil, 
  Trash2, 
  ShieldCheck, 
  Users 
} from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isAccessOpen, 
    onOpen: onAccessOpen, 
    onClose: onAccessClose 
  } = useDisclosure();

  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    label: '',
    description: '',
    is_active: true
  });

  const [selectedCategoryForAccess, setSelectedCategoryForAccess] = useState<any>(null);
  const [accessMap, setAccessMap] = useState<Record<string, { active: boolean, percent: number }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, uRes] = await Promise.allSettled([
        AgentsAPI.getCategories(),
        UniversitiesAPI.getAll(),
      ]);
      setCategories(cRes.status === 'fulfilled' ? cRes.value : []);
      setUniversities(uRes.status === 'fulfilled' ? uRes.value : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', label: '', description: '', is_active: true });
    onOpen();
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      label: category.label || '',
      description: category.description || '',
      is_active: category.is_active
    });
    onOpen();
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        await AgentsAPI.updateCategory(editingCategory.id, categoryForm);
      } else {
        await AgentsAPI.createCategory(categoryForm);
      }
      onClose();
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManageAccess = async (category: any) => {
    setSelectedCategoryForAccess(category);
    const access = await AgentsAPI.getCategoryAccess(category.id);
    const map: Record<string, { active: boolean, percent: number }> = {};
    
    // Initialize with existing access
    access.forEach((a: any) => {
      map[a.university_id] = {
        active: a.is_active,
        percent: Number(a.commission_percent)
      };
    });
    
    setAccessMap(map);
    onAccessOpen();
  };

  const saveAccess = async () => {
    if (!selectedCategoryForAccess) return;
    
    const payload = Object.entries(accessMap)
      .filter(([_, data]) => data.active)
      .map(([uniId, data]) => ({
        university_id: uniId,
        commission_percent: data.percent,
        is_active: true
      }));

    try {
      await AgentsAPI.setCategoryAccess(selectedCategoryForAccess.id, payload);
      onAccessClose();
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const groupedUniversities = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const u of universities) {
      const key = u.country?.name || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }
    return Array.from(map.entries());
  }, [universities]);

  const columns = [
    { name: "NAME", uid: "name" },
    { name: "LABEL", uid: "label" },
    { name: "DESCRIPTION", uid: "description" },
    { name: "AGENTS", uid: "agents" },
    { name: "STATUS", uid: "status" },
    { name: "ACTIONS", uid: "actions" },
  ];

  const renderCell = (category: any, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return <div className="font-semibold">{category.name}</div>;
      case "label":
        return <div>{category.label || '-'}</div>;
      case "description":
        return <div className="text-sm text-default-500 max-w-xs truncate">{category.description || '-'}</div>;
      case "agents":
        return <Chip size="sm" variant="flat">{category._count?.agents || 0} Agents</Chip>;
      case "status":
        return (
          <Chip color={category.is_active ? "success" : "danger"} size="sm" variant="flat">
            {category.is_active ? "Active" : "Inactive"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex items-center gap-2">
            <Tooltip content="Edit Category">
              <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(category)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Manage University Access">
              <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => handleManageAccess(category)}>
                <Globe className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PermissionGuard requiredPermissions={[AgentsPermission.AGENTS_CREATE, AgentsPermission.AGENTS_UPDATE]}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agent Categories</h1>
            <p className="text-default-500">Manage B2B agent segments and their university commission structures.</p>
          </div>
          <Button color="primary" startContent={<PlusCircle className="h-4 w-4" />} onPress={handleCreate}>
            New Category
          </Button>
        </div>

        <Card className="shadow-sm border-none bg-background/60 backdrop-blur-md">
          <CardBody>
            <Table aria-label="Categories table" removeWrapper>
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody items={categories} loadingContent={<div>Loading...</div>} isLoading={loading}>
                {(item) => (
                  <TableRow key={item.id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Modal: Category Form */}
        <Modal isOpen={isOpen} onClose={onClose} placement="center">
          <ModalContent>
            <ModalHeader>{editingCategory ? 'Edit Category' : 'Create Category'}</ModalHeader>
            <ModalBody className="pb-6">
              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="e.g. Category A"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                />
                <Input
                  label="Label"
                  placeholder="e.g. Premium Agents"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm({...categoryForm, label: e.target.value})}
                />
                <Input
                  label="Description"
                  placeholder="Internal notes about this segment"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm">Is Active</span>
                  <Switch 
                    isSelected={categoryForm.is_active} 
                    onValueChange={(checked) => setCategoryForm({...categoryForm, is_active: checked})}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>Cancel</Button>
              <Button color="primary" onPress={saveCategory}>Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal: University Access */}
        <Modal isOpen={isAccessOpen} onClose={onAccessClose} size="3xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>
              <div className="flex flex-col">
                <span>University Access: {selectedCategoryForAccess?.name}</span>
                <span className="text-xs font-normal text-default-500">Toggle universities and set commission percentages.</span>
              </div>
            </ModalHeader>
            <ModalBody className="pb-6">
              <div className="space-y-8">
                {groupedUniversities.map(([country, unis]) => (
                  <div key={country} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-divider flex-grow" />
                      <span className="text-xs font-bold text-default-400 uppercase tracking-widest">{country}</span>
                      <div className="h-px bg-divider flex-grow" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unis.map((u) => {
                        const data = accessMap[u.id] || { active: false, percent: 0 };
                        return (
                          <div key={u.id} className={`p-3 rounded-xl border-2 transition-all flex flex-col gap-3 ${data.active ? 'border-primary/20 bg-primary/5' : 'border-divider'}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-grow">
                                <div className="font-semibold text-sm">{u.name}</div>
                                <div className="text-xs text-default-500">{u.city}</div>
                              </div>
                              <Checkbox 
                                isSelected={data.active}
                                onValueChange={(checked) => {
                                  setAccessMap({
                                    ...accessMap,
                                    [u.id]: { 
                                      active: checked, 
                                      percent: checked ? (data.percent || Number(u.commission_value || 0)) : 0 
                                    }
                                  });
                                }}
                              />
                            </div>
                            
                            {data.active && (
                              <div className="flex items-center gap-2 mt-auto">
                                <Input
                                  size="sm"
                                  type="number"
                                  label="Commission %"
                                  labelPlacement="outside"
                                  placeholder="0.00"
                                  value={data.percent.toString()}
                                  onChange={(e) => {
                                    setAccessMap({
                                      ...accessMap,
                                      [u.id]: { ...data, percent: Number(e.target.value) }
                                    });
                                  }}
                                  endContent={<span className="text-default-400">%</span>}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onAccessClose}>Cancel</Button>
              <Button color="primary" onPress={saveAccess}>Save Changes</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
