"use client";

import { useEffect, useMemo, useState } from 'react';
import { AgentsAPI, ContractsAPI } from '@/lib/api';
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
  useDisclosure,
} from '@heroui/react';
import { Pencil, Trash2, CheckCircle, XCircle, FileDown, Plus, Search } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  agency_name?: string;
  created_at?: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  mobile: string;
  company_name?: string;
  website?: string;
  city?: string;
  country?: string;
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
  const [tab, setTab] = useState('agreements');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [agreements, setAgreements] = useState<ContractRow[]>([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ agent_id: '', title: '', content: '' });
  const [editingContract, setEditingContract] = useState<ContractRow | null>(null);
  const [rejectingContractId, setRejectingContractId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();

  const load = async () => {
    const [a, iq, c] = await Promise.all([
      AgentsAPI.getAll(),
      AgentsAPI.getInquiries(),
      ContractsAPI.getAll(),
    ]);
    setAgents(a || []);
    setInquiries(iq || []);
    setAgreements(c || []);
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

  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter((i) => i.status !== 'CONVERTED')
      .filter((i) => {
        const q = search.toLowerCase();
        return (
          i.name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.company_name?.toLowerCase().includes(q)
        );
      });
  }, [inquiries, search]);

  const createContract = async () => {
    if (!form.agent_id || !form.title || !form.content) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await ContractsAPI.create(form);
      alert('Contract created');
      setForm({ agent_id: '', title: '', content: '' });
    } catch (e: any) {
      alert(e?.message || 'Failed to create contract');
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

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      await AgentsAPI.updateInquiryStatus(id, status);
      await load(); // CONVERTED disappears from inquiry tab and appears in agents list
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

  const openCreateForAgent = (agent: Agent) => {
    setForm((prev) => ({
      ...prev,
      agent_id: agent.id,
      title: prev.title || `${agent.name} Agreement`,
    }));
    setTab('agreements');
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
          <h1 className="text-3xl font-bold tracking-tight">Agent Agreements</h1>
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
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Create Agreement</h3>
                <Select
                  label="Agent"
                  selectedKeys={form.agent_id ? [form.agent_id] : []}
                  onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                >
                  {agents.map((a) => (
                    <SelectItem key={a.id} textValue={`${a.name} (${a.email})`}>
                      {a.name} ({a.email})
                    </SelectItem>
                  ))}
                </Select>
                <Input label="Contract Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Textarea label="Contract Content (HTML allowed)" minRows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                <div className="flex justify-end">
                  <Button color="primary" className="text-white" isLoading={loading} onPress={createContract}>
                    <Plus className="h-4 w-4 mr-1" /> Create Agreement
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table aria-label="Agreements table">
                  <TableHeader>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>AGENT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>REJECTION NOTE</TableColumn>
                    <TableColumn align="center">ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={filteredAgreements} emptyContent="No agreements found">
                    {(row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.agent?.name || row.agent?.email || '-'}</TableCell>
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
                            {row.status === 'SIGNED' ? (
                              <Button isIconOnly size="sm" variant="light" color="success" onPress={() => approveAgreement(row.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {row.status !== 'REJECTED' ? (
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
                            <Button isIconOnly size="sm" variant="light" onPress={() => downloadAgreement(row.id)}>
                              <FileDown className="h-4 w-4" />
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
                          <Button size="sm" variant="flat" onPress={() => openCreateForAgent(agent)}>Create Agreement</Button>
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
            <div className="border rounded-lg">
              <Table aria-label="Inquiries table">
                <TableHeader>
                  <TableColumn>NAME</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>MOBILE</TableColumn>
                  <TableColumn>COMPANY</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn align="center">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody items={filteredInquiries} emptyContent="No active inquiries found">
                  {(iq) => (
                    <TableRow key={iq.id}>
                      <TableCell>{iq.name}</TableCell>
                      <TableCell>{iq.email}</TableCell>
                      <TableCell>{iq.mobile}</TableCell>
                      <TableCell>{iq.company_name || '-'}</TableCell>
                      <TableCell>{statusChip(iq.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="flat" onPress={() => updateInquiryStatus(iq.id, 'CONTACTED')}>Contacted</Button>
                          <Button size="sm" color="success" variant="flat" onPress={() => updateInquiryStatus(iq.id, 'CONVERTED')}>Convert</Button>
                          <Button size="sm" color="danger" variant="flat" onPress={() => updateInquiryStatus(iq.id, 'REJECTED')}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardBody>
      </Card>

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
                <Textarea
                  label="Content"
                  value={editingContract?.content || ''}
                  minRows={12}
                  onChange={(e) => setEditingContract((prev) => (prev ? { ...prev, content: e.target.value } : prev))}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>Cancel</Button>
                <Button color="primary" className="text-white" isLoading={loading} onPress={updateContract}>Save</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
