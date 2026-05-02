"use client";

import { useEffect, useMemo, useState, useRef } from 'react';
import { AgentsAPI, BranchesAPI, ContractsAPI } from '@/lib/api';
import { getFileUrl } from '@/lib/utils';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tab,
  Textarea,
  Tooltip,
  useDisclosure,
} from '@heroui/react';
import { Pencil, Trash2, CheckCircle, XCircle, FileDown, Plus, Search, Eye, Check, X, UserCheck } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';

interface Agent {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  category_id?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  agency_name?: string;
  created_at?: string;
}

interface AgentCategory {
  id: string;
  name: string;
  label?: string | null;
  is_active?: boolean;
}

interface Branch {
  id: string;
  name: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  mobile: string;
  company_name?: string;
  company_address?: string;
  contact_person?: string;
  contact_designation?: string;
  contact_department?: string;
  website?: string;
  city?: string;
  country?: string;
  source_country?: string;
  operation_countries?: string;
  accreditation_details?: string;
  associations?: string;
  moe_approvals?: string;
  message?: string;
  documents?: { id: string; label?: string; file_url: string }[];
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED' | string;
  created_at?: string;
}

interface ContractRow {
  id: string;
  title: string;
  content: string;
  status: 'PENDING' | 'SIGNED' | 'APPROVED' | 'REJECTED' | string;
  rejection_note?: string | null;
  agent_id?: string;
  agent?: { id: string; name: string; email: string };
}

export default function AgreementsPage() {
  const AGREEMENT_VARIABLES = [
    { key: 'today_date', label: "Today's Date (DD/MM/YYYY)" },
    { key: 'today_iso', label: "Today's Date (YYYY-MM-DD)" },
    { key: 'current_year', label: 'Current Year' },
    { key: 'agent_name', label: 'Agent Name' },
    { key: 'agent_email', label: 'Agent Email' },
    { key: 'agent_mobile', label: 'Agent Mobile' },
    { key: 'agency_name', label: 'Agency Name' },
    { key: 'agent_category', label: 'Agent Category' },
    { key: 'agent_branch', label: 'Agent Branch' },
  ] as const;

  const [tab, setTab] = useState('agreements');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<AgentCategory[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [agreements, setAgreements] = useState<ContractRow[]>([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    assignment_mode: 'CATEGORY' as 'CATEGORY',
    category_id: '',
    title: '',
    content: '',
  });
  const [editingContract, setEditingContract] = useState<ContractRow | null>(null);
  
  // Bulk Assign State
  const [assigningContract, setAssigningContract] = useState<ContractRow | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onOpenChange: onAssignOpenChange } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();

  const [rejectingContractId, setRejectingContractId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [convertBranchId, setConvertBranchId] = useState('');
  const [convertCategoryId, setConvertCategoryId] = useState('');
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailOpenChange } = useDisclosure();
  
  const editorRef = useRef<any>(null);
  const editEditorRef = useRef<any>(null);

  const insertVariable = (key: string, mode: 'create' | 'edit') => {
    const token = `{{${key}}}`;
    const targetEditor = mode === 'create' ? editorRef.current : editEditorRef.current;
    if (targetEditor && typeof targetEditor.insertContent === 'function') {
      targetEditor.insertContent(token);
      return;
    }

    if (mode === 'create') {
      setForm((prev) => ({ ...prev, content: `${prev.content || ''}${token}` }));
    } else {
      setEditingContract((prev) =>
        prev ? { ...prev, content: `${prev.content || ''}${token}` } : prev,
      );
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [a, cat, br, iq, c] = await Promise.all([
        AgentsAPI.getAll(),
        AgentsAPI.getCategories(),
        BranchesAPI.fetchBranches(),
        AgentsAPI.getInquiries(),
        ContractsAPI.getAll(),
      ]);
      setAgents(a || []);
      setCategories(cat || []);
      setBranches(br || []);
      setInquiries(iq || []);
      setAgreements(c || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAgreements = useMemo(() => {
    return agreements.filter((row) => {
      const q = search.toLowerCase();
      return (
        row.title?.toLowerCase().includes(q) ||
        row.agent?.name?.toLowerCase().includes(q) ||
        row.agent?.email?.toLowerCase().includes(q)
      );
    });
  }, [agreements, search]);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      const q = search.toLowerCase();
      return (
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.agency_name?.toLowerCase().includes(q)
      );
    });
  }, [agents, search]);

  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('ALL');
  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter((i) => inquiryStatusFilter === 'ALL' || i.status === inquiryStatusFilter)
      .filter((i) => {
        const q = search.toLowerCase();
        return (
          i.name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.company_name?.toLowerCase().includes(q)
        );
      });
  }, [inquiries, search, inquiryStatusFilter]);

  const createContract = async () => {
    if (!form.title || !form.content) {
      alert('Please fill title and content');
      return;
    }
    if (!form.category_id) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const template = await ContractsAPI.create({
        title: form.title,
        content: form.content,
      });
      const categoryAgents = agents.filter((a) => a.category_id === form.category_id);
      if (categoryAgents.length > 0) {
        await ContractsAPI.bulkAssign(template.id, categoryAgents.map((a) => a.id));
      }
      alert(
        categoryAgents.length > 0
          ? `Assigned agreement to ${categoryAgents.length} agents in selected category`
          : 'Template created. No agents currently found in selected category.'
      );

      setForm({ assignment_mode: 'CATEGORY', category_id: '', title: '', content: '' });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!assigningContract || selectedAgentIds.length === 0) return;
    setLoading(true);
    try {
      await ContractsAPI.bulkAssign(assigningContract.id, selectedAgentIds);
      alert(`Assigned to ${selectedAgentIds.length} agents`);
      onAssignOpenChange();
      setAssigningContract(null);
      setSelectedAgentIds([]);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to assign template');
    } finally {
      setLoading(false);
    }
  };

  const updateContract = async () => {
    if (!editingContract?.id || !editingContract.title || !editingContract.content) return;
    setLoading(true);
    try {
      await ContractsAPI.updateContent(editingContract.id, {
        title: editingContract.title,
        content: editingContract.content,
      });
      await load();
      onEditOpenChange();
      setEditingContract(null);
    } catch (e: any) {
      alert(e?.message || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  const approveAgreement = async (id: string) => {
    try {
      await ContractsAPI.approve(id);
      await load();
    } catch (e: any) {
      alert(e?.body?.message || e?.message || 'Failed to approve agreement');
    }
  };

  const rejectAgreement = async () => {
    if (!rejectingContractId) return;
    try {
      await ContractsAPI.reject(rejectingContractId, rejectionNote);
      await load();
      setRejectingContractId(null);
      setRejectionNote('');
      onOpenChange();
    } catch (e: any) {
      alert(e?.message || 'Failed to reject agreement');
    }
  };

  const downloadAgreement = async (id: string) => {
    try {
      const blob = await ContractsAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Failed to download agreement');
    }
  };

  const deleteAgreement = async (id: string) => {
    if (!confirm('Delete this agreement? This action cannot be undone.')) return;
    try {
      await ContractsAPI.delete(id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete agreement');
    }
  };

  const updateInquiryStatus = async (
    id: string,
    status: string,
    extras?: { branch_id?: string; category_id?: string }
  ) => {
    try {
      await AgentsAPI.updateInquiryStatus(id, status, extras);
      await load(); 
    } catch (e: any) {
      alert(e?.message || 'Failed to update inquiry status');
    }
  };

  const updateAgentStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await AgentsAPI.updateStatus(id, status);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to update agent status');
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    try {
      await AgentsAPI.delete(id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete agent');
    }
  };

  const statusChip = (status?: string) => {
    if (!status) return <Chip size="sm" variant="flat">UNKNOWN</Chip>;
    const color =
      status === 'APPROVED' ? 'success' :
      status === 'SIGNED' ? 'primary' :
      status === 'REJECTED' ? 'danger' :
      status === 'CONTACTED' ? 'secondary' :
      'warning';
    return <Chip size="sm" color={color as any} variant="flat">{status}</Chip>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Removed h1 title as it's in the universal header */}
          <p className="text-muted-foreground">Manage agents, inquiries and agreement lifecycle from one place</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by name, email, title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<Search className="h-4 w-4 text-gray-400" />}
          className="max-w-sm"
        />
      </div>

      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))} variant="underlined">
        <Tab key="agreements" title={`Agreements (${filteredAgreements.length})`} />
        <Tab key="agents" title={`Agents (${filteredAgents.length})`} />
        <Tab key="inquiries" title={`Inquiries (${filteredInquiries.length})`} />
      </Tabs>

      <Card>
        <CardBody className="space-y-4">
          {tab === 'agreements' ? (
            <>
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50/30">
                <h3 className="font-semibold">Create Category Agreement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Category"
                      selectedKeys={form.category_id ? [form.category_id] : []}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      placeholder="Select a category"
                    >
                      {categories
                        .filter((category) => category.is_active !== false)
                        .map((category) => (
                          <SelectItem key={category.id} textValue={category.label || category.name}>
                            {category.label || category.name}
                          </SelectItem>
                        ))}
                    </Select>
                    <Input label="Contract Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Contract Content (HTML allowed)</label>
                  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-default-50">
                    <span className="text-xs text-default-500 mr-1">Insert Variable:</span>
                    {AGREEMENT_VARIABLES.map((v) => (
                      <Button
                        key={v.key}
                        size="sm"
                        variant="flat"
                        className="h-7 text-xs"
                        onPress={() => insertVariable(v.key, 'create')}
                      >
                        {`{{${v.key}}}`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-default-400 ml-1">
                    Variables are auto-resolved when assigning agreements to agents.
                  </p>
                  <div className="min-h-[300px] border rounded-xl overflow-hidden bg-white shadow-inner">
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      onInit={(evt, editor) => editorRef.current = editor}
                      initialValue={form.content}
                      onEditorChange={(content) => setForm({ ...form, content })}
                      init={{
                        height: 400,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help | code',
                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                        skin: 'oxide',
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button color="primary" className="text-white" isLoading={loading} onPress={createContract}>
                    <Plus className="h-4 w-4 mr-1" /> Create & Assign by Category
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table aria-label="Agreements table" removeWrapper>
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>ASSIGNED TO</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>REJECTION NOTE</TableColumn>
                    <TableColumn align="center">ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={filteredAgreements} emptyContent="No agreements found">
                    {(row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell>
                            {!row.agent_id ? (
                                <Chip size="sm" variant="flat" color="secondary">TEMPLATE</Chip>
                            ) : (
                                <span>{row.agent?.name || row.agent?.email || '-'}</span>
                            )}
                        </TableCell>
                        <TableCell>{statusChip(row.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.rejection_note || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setEditingContract(row);
                                onEditOpen();
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            {!row.agent_id && (
                                <Button 
                                    size="sm" 
                                    variant="flat" 
                                    color="secondary"
                                    onPress={() => {
                                        setAssigningContract(row);
                                        onAssignOpen();
                                    }}
                                >
                                    Assign
                                </Button>
                            )}

                            {row.status === 'SIGNED' ? (
                              <Button isIconOnly size="sm" variant="light" color="success" onPress={() => approveAgreement(row.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {row.status !== 'REJECTED' && row.agent_id ? (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => {
                                  setRejectingContractId(row.id);
                                  setRejectionNote('');
                                  onOpen();
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {row.agent_id && (
                                <Button isIconOnly size="sm" variant="light" onPress={() => downloadAgreement(row.id)}>
                                    <FileDown className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => deleteAgreement(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}

          {tab === 'agents' ? (
            <div className="border rounded-lg">
              <Table aria-label="Agents table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>AGENCY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn align="center">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={filteredAgents} emptyContent="No agents found">
                  {(agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>{agent.name}</TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.agency_name || '-'}</TableCell>
                      <TableCell>{statusChip(agent.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {agent.status !== 'APPROVED' ? (
                            <Button size="sm" color="success" variant="flat" onPress={() => updateAgentStatus(agent.id, 'APPROVED')}>Approve</Button>
                          ) : null}
                          {agent.status !== 'REJECTED' ? (
                            <Button size="sm" color="danger" variant="flat" onPress={() => updateAgentStatus(agent.id, 'REJECTED')}>Reject</Button>
                          ) : null}
                          <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => deleteAgent(agent.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {tab === 'inquiries' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Tabs 
                  size="sm" 
                  radius="full" 
                  selectedKey={inquiryStatusFilter} 
                  onSelectionChange={(k) => setInquiryStatusFilter(String(k))}
                >
                  <Tab key="ALL" title="All" />
                  <Tab key="NEW" title="New" />
                  <Tab key="CONTACTED" title="Contacted" />
                  <Tab key="CONVERTED" title="Converted" />
                  <Tab key="REJECTED" title="Rejected" />
                </Tabs>
              </div>
              <div className="border rounded-lg">
                <Table aria-label="Inquiries table">
                  <TableHeader>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>EMAIL</TableColumn>
                    <TableColumn>COMPANY</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn align="center">ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={filteredInquiries} emptyContent="No inquiries found">
                    {(iq) => (
                      <TableRow key={iq.id}>
                        <TableCell className="font-medium">{iq.name}</TableCell>
                        <TableCell>{iq.email}</TableCell>
                        <TableCell>{iq.company_name || '-'}</TableCell>
                        <TableCell>{statusChip(iq.status)}</TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {iq.created_at ? new Date(iq.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                              <Tooltip content="View inquiry details">
                              <Button 
                                isIconOnly 
                                size="sm" 
                                variant="flat" 
                                onPress={() => {
                                setSelectedInquiry(iq);
                                setConvertBranchId('');
                                setConvertCategoryId('');
                                  onDetailOpen();
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            {iq.status === 'NEW' && (
                              <Tooltip content="Mark as contacted">
                                <Button isIconOnly size="sm" color="secondary" variant="flat" onPress={() => updateInquiryStatus(iq.id, 'CONTACTED')}>
                                  <Check className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                            {iq.status !== 'CONVERTED' && iq.status !== 'REJECTED' && (
                              <Tooltip content="Convert to agent">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="success"
                                  variant="flat"
                                  onPress={() => {
                                    setSelectedInquiry(iq);
                                    setConvertBranchId('');
                                    setConvertCategoryId('');
                                    onDetailOpen();
                                  }}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                            {iq.status !== 'REJECTED' && (
                              <Tooltip content="Reject inquiry">
                                <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => updateInquiryStatus(iq.id, 'REJECTED')}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Reject Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Reject Agreement</ModalHeader>
              <ModalBody>
                <Textarea
                  label="Rejection Note"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  minRows={4}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancel</Button>
                <Button color="danger" className="text-white" onPress={rejectAgreement}>Reject</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="4xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Edit Agreement</ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  label="Title"
                  value={editingContract?.title || ''}
                  onChange={(e) => setEditingContract((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Content</label>
                  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-default-50">
                    <span className="text-xs text-default-500 mr-1">Insert Variable:</span>
                    {AGREEMENT_VARIABLES.map((v) => (
                      <Button
                        key={v.key}
                        size="sm"
                        variant="flat"
                        className="h-7 text-xs"
                        onPress={() => insertVariable(v.key, 'edit')}
                      >
                        {`{{${v.key}}}`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-default-400 ml-1">
                    Variables are auto-resolved when assigning agreements to agents.
                  </p>
                  <div className="min-h-[400px] border rounded-xl overflow-hidden bg-white shadow-inner">
                    <Editor
                      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                      onInit={(evt, editor) => editEditorRef.current = editor}
                      initialValue={editingContract?.content || ''}
                      onEditorChange={(content) => setEditingContract((prev: any) => (prev ? { ...prev, content } : prev))}
                      init={{
                        height: 500,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help | code',
                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                        skin: 'oxide',
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancel</Button>
                <Button color="primary" className="text-white" isLoading={loading} onPress={updateContract}>Save</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Inquiry Detail Modal */}
      <Modal isOpen={isDetailOpen} onOpenChange={onDetailOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">Inquiry Details</span>
                  {selectedInquiry && statusChip(selectedInquiry.status)}
                </div>
                <p className="text-sm text-default-400 font-normal">Received on {selectedInquiry?.created_at ? new Date(selectedInquiry.created_at).toLocaleString() : '-'}</p>
              </ModalHeader>
              <ModalBody className="pb-8">
                {selectedInquiry && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                          <CheckCircle size={16} /> Personal Information
                        </h4>
                        <div className="space-y-2">
                          <div><p className="text-xs text-default-400">Full Name</p><p className="font-medium">{selectedInquiry.name}</p></div>
                          <div><p className="text-xs text-default-400">Email Address</p><p className="font-medium">{selectedInquiry.email}</p></div>
                          <div><p className="text-xs text-default-400">Mobile Number</p><p className="font-medium">{selectedInquiry.mobile}</p></div>
                          <div><p className="text-xs text-default-400">Contact Person</p><p className="font-medium">{selectedInquiry.contact_person || 'N/A'}</p></div>
                          <div><p className="text-xs text-default-400">Designation</p><p className="font-medium">{selectedInquiry.contact_designation || 'N/A'}</p></div>
                          <div><p className="text-xs text-default-400">Department</p><p className="font-medium">{selectedInquiry.contact_department || 'N/A'}</p></div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                          <Plus size={16} /> Agency Details
                        </h4>
                        <div className="space-y-2">
                          <div><p className="text-xs text-default-400">Company Name</p><p className="font-medium">{selectedInquiry.company_name || 'N/A'}</p></div>
                          <div><p className="text-xs text-default-400">Company Address</p><p className="font-medium">{selectedInquiry.company_address || 'N/A'}</p></div>
                          <div>
                            <p className="text-xs text-default-400">Website</p>
                            {selectedInquiry.website ? (
                              <a href={selectedInquiry.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline">
                                {selectedInquiry.website}
                              </a>
                            ) : (
                              <p className="font-medium">N/A</p>
                            )}
                          </div>
                          <div><p className="text-xs text-default-400">Location</p><p className="font-medium">{selectedInquiry.city}{selectedInquiry.country ? `, ${selectedInquiry.country}` : ''}</p></div>
                          <div><p className="text-xs text-default-400">Source Country</p><p className="font-medium">{selectedInquiry.source_country || 'N/A'}</p></div>
                          <div><p className="text-xs text-default-400">Operation Countries</p><p className="font-medium">{selectedInquiry.operation_countries || 'N/A'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                        <CheckCircle size={16} /> Accreditation & Compliance
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><p className="text-xs text-default-400">Accreditation Details</p><p className="font-medium whitespace-pre-wrap">{selectedInquiry.accreditation_details || 'N/A'}</p></div>
                        <div><p className="text-xs text-default-400">Associations</p><p className="font-medium whitespace-pre-wrap">{selectedInquiry.associations || 'N/A'}</p></div>
                        <div><p className="text-xs text-default-400">MoE Approvals</p><p className="font-medium whitespace-pre-wrap">{selectedInquiry.moe_approvals || 'N/A'}</p></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                        <Plus size={16} /> Additional Notes
                      </h4>
                      <p className="font-medium whitespace-pre-wrap">{selectedInquiry.message || 'N/A'}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                        <FileDown size={16} /> Attachments / Documents
                      </h4>
                      {selectedInquiry.documents && selectedInquiry.documents.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {selectedInquiry.documents.map((doc: any) => (
                            <a 
                              key={doc.id}
                              href={getFileUrl(doc.file_url)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 border border-divider transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm">
                                  <FileDown size={16} className="text-default-400 group-hover:text-primary transition-colors" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium truncate max-w-[250px]">{doc.label || 'Document'}</p>
                                </div>
                              </div>
                              <Button isIconOnly size="sm" variant="light" className="text-primary">
                                <FileDown size={16} />
                              </Button>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-divider">
                          <p className="text-default-400 text-sm italic">No documents uploaded with this inquiry.</p>
                        </div>
                      )}
                    </div>

                    {selectedInquiry.status !== 'CONVERTED' && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-primary flex items-center gap-2 border-b pb-1">
                          <UserCheck size={16} /> Conversion Assignment
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Select
                            label="Assign Branch"
                            selectedKeys={convertBranchId ? [convertBranchId] : []}
                            onChange={(e) => setConvertBranchId(e.target.value)}
                            placeholder="Select branch"
                          >
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} textValue={branch.name}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </Select>
                          <Select
                            label="Assign Category"
                            selectedKeys={convertCategoryId ? [convertCategoryId] : []}
                            onChange={(e) => setConvertCategoryId(e.target.value)}
                            placeholder="Select category"
                          >
                            {categories
                              .filter((category) => category.is_active !== false)
                              .map((category) => (
                                <SelectItem key={category.id} textValue={category.label || category.name}>
                                  {category.label || category.name}
                                </SelectItem>
                              ))}
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="border-t">
                <Button variant="flat" onPress={close}>Close</Button>
                {selectedInquiry?.status !== 'CONVERTED' && (
                  <Button color="success" className="text-white font-bold" onPress={() => {
                    if (!convertBranchId || !convertCategoryId) {
                      alert('Please assign both branch and category before converting.');
                      return;
                    }
                    updateInquiryStatus(selectedInquiry.id, 'CONVERTED', {
                      branch_id: convertBranchId,
                      category_id: convertCategoryId,
                    });
                    close();
                  }} isDisabled={!convertBranchId || !convertCategoryId}>
                    Convert to Agent
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal isOpen={isAssignOpen} onOpenChange={onAssignOpenChange} size="2xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>Assign Template to Agents</ModalHeader>
              <ModalBody className="space-y-4">
                <div className="p-3 bg-secondary-50 border border-secondary-100 rounded-lg">
                    <p className="text-sm text-secondary-700">
                        Assigning template: <strong>{assigningContract?.title}</strong>
                    </p>
                </div>
                <Select
                    label="Select Agents"
                    selectionMode="multiple"
                    placeholder="Search and select agents"
                    selectedKeys={selectedAgentIds}
                    onSelectionChange={(keys) => setSelectedAgentIds(Array.from(keys) as string[])}
                >
                    {agents.map((a) => (
                        <SelectItem key={a.id} textValue={a.name}>
                            {a.name} ({a.agency_name || 'Individual'})
                        </SelectItem>
                    ))}
                </Select>
                <p className="text-[10px] text-gray-400">
                    A copy of this agreement will be created for each selected agent.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancel</Button>
                <Button 
                    color="secondary" 
                    className="text-white" 
                    isLoading={loading} 
                    onPress={handleBulkAssign}
                    isDisabled={selectedAgentIds.length === 0}
                >
                  Assign to {selectedAgentIds.length} Agents
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
