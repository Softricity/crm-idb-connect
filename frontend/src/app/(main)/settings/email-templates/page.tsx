"use client";

import React, { useEffect, useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Button, 
  Card, 
  CardBody, 
  Chip,
  Tooltip,
  Input,
  Tabs,
  Tab
} from '@heroui/react';
import { MailAPI } from '@/lib/api';
import { Plus, Edit, Trash2, Mail, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await MailAPI.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      toast.error('Failed to load templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await MailAPI.deleteTemplate(id);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                         t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Email Templates
          </h1>
          <p className="text-default-500 mt-1">Manage automated system communications and notifications.</p>
        </div>
        <Button 
          color="primary" 
          startContent={<Plus size={18} />}
          onPress={() => router.push('/settings/email-templates/new')}
          className="shadow-lg shadow-primary/20 text-white font-medium"
        >
          New Template
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
        <CardBody className="p-0">
          <div className="p-4 flex flex-col md:flex-row gap-4 justify-between border-b border-divider items-center">
            <Tabs 
              variant="underlined" 
              color="primary"
              selectedKey={selectedCategory}
              onSelectionChange={(key) => setSelectedCategory(key.toString())}
              aria-label="Filter by category"
            >
              <Tab key="all" title="All Templates" />
              {uniqueCategories.map(cat => (
                <Tab key={String(cat)} title={String(cat)} />
              ))}
            </Tabs>
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              placeholder="Search templates..."
              startContent={<Search size={18} className="text-default-400" />}
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <Table 
            aria-label="Email templates table"
            removeWrapper
            classNames={{
              th: "bg-default-100 text-default-600 font-semibold uppercase text-[11px]",
              td: "py-4 text-sm"
            }}
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>CATEGORY</TableColumn>
              <TableColumn>SUBJECT</TableColumn>
              <TableColumn>VARIABLES</TableColumn>
              <TableColumn>LAST UPDATED</TableColumn>
              <TableColumn align="center">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody loadingState={loading ? "loading" : "idle"} emptyContent={"No templates found"}>
              {filtered.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Mail size={18} />
                      </div>
                      <span className="font-bold text-default-800 tracking-tight">{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      variant="dot" 
                      color={template.category ? "primary" : "default"} 
                      size="sm" 
                      className="border-none bg-default-100 font-medium"
                    >
                      {template.category || 'Uncategorized'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-default-600 truncate max-w-[300px] block">
                      {template.subject}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables?.map((v: string) => (
                        <Chip key={v} size="sm" variant="flat" color="secondary" className="text-[10px] uppercase font-bold">
                          {v}
                        </Chip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-default-400 text-sm">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip content="Edit template">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          onPress={() => router.push(`/settings/email-templates/${template.id}`)}
                        >
                          <Edit size={18} className="text-default-400" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Delete template" color="danger">
                        <Button 
                          isIconOnly 
                          size="sm" 
                          variant="light" 
                          onPress={() => deleteTemplate(template.id)}
                        >
                          <Trash2 size={18} className="text-danger" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
