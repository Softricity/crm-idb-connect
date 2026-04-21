"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Chip,
  Skeleton,
  Select,
  SelectItem
} from '@heroui/react';
import { MailAPI, DropdownsAPI } from '@/lib/api';
import { ArrowLeft, Save, Info, Sparkles, Plus, FolderTree } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Editor } from '@tinymce/tinymce-react';

export default function EmailTemplateEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const router = useRouter();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
    variables: [] as string[]
  });

  const [categories, setCategories] = useState<any[]>([]);

  const [newVar, setNewVar] = useState('');

  const loadCategories = async () => {
    try {
      const all = await DropdownsAPI.getAllCategories();
      const cat = all.find((c: any) => c.name === 'email_template_categories');
      if (cat) {
        setCategories(cat.options || []);
      }
    } catch (error) {
      console.error('Failed to load email categories', error);
    }
  };

  useEffect(() => {
    loadCategories();
    if (!isNew && typeof id === 'string') {
      loadTemplate(id);
    }
  }, [id, isNew]);

  const loadTemplate = async (templateId: string) => {
    try {
      const data = await MailAPI.getTemplate(templateId);
      setFormData({
        name: data.name,
        subject: data.subject,
        body: data.body,
        category: data.category || '',
        variables: data.variables || []
      });
    } catch (error) {
      toast.error('Failed to load template');
      router.push('/settings/email-templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const body = editorRef.current ? editorRef.current.getContent() : formData.body;
    if (!formData.name || !formData.subject || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData, body };
      if (isNew) {
        await MailAPI.createTemplate(payload);
        toast.success('Template created successfully');
      } else if (typeof id === 'string') {
        await MailAPI.updateTemplate(id, payload);
        toast.success('Template updated successfully');
      }
      router.push('/settings/email-templates');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () => {
    if (!newVar) return;
    if (formData.variables.includes(newVar)) {
      toast.error('Variable already exists');
      return;
    }
    setFormData({ ...formData, variables: [...formData.variables, newVar] });
    setNewVar('');
  };

  const removeVariable = (v: string) => {
    setFormData({ ...formData, variables: formData.variables.filter(item => item !== v) });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-1/4 rounded-lg" />
        <Card>
          <CardBody className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button 
          isIconOnly 
          variant="flat" 
          onPress={() => router.push('/settings/email-templates')}
          className="bg-background/60 backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-default-800">
            {isNew ? 'Create New Template' : `Edit Template: ${formData.name}`}
          </h1>
          <p className="text-default-500 text-sm">Design your email notifications using HTML and dynamic variables.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-background/60 backdrop-blur-md">
            <CardBody className="p-6 space-y-4">
              <Input
                label="Template Name"
                placeholder="e.g. INQUIRY_RECEIVED"
                value={formData.name}
                onValueChange={(v) => setFormData({ ...formData, name: v })}
                isDisabled={!isNew}
                variant="bordered"
                description={isNew ? "Give this template a unique identifier." : "Template identifier cannot be changed."}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Subject"
                  placeholder="Subject of the email"
                  value={formData.subject}
                  onValueChange={(v) => setFormData({ ...formData, subject: v })}
                  variant="bordered"
                />
                <div className="space-y-1">
                  <Select
                    label="Purpose / Category"
                    placeholder="Select a category"
                    selectedKeys={formData.category ? [formData.category] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      setFormData({ ...formData, category: String(val) });
                    }}
                    variant="bordered"
                    startContent={<FolderTree size={18} className="text-default-400" />}
                  >
                    {categories.map((cat) => (
                      <SelectItem key={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <p className="text-[10px] text-default-400 ml-1">
                    Manage these categories in the <a href="/customise" className="text-primary hover:underline font-medium">Customise Hub</a>.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700 ml-1 flex items-center gap-2">
                  Body Content <Sparkles size={14} className="text-primary" />
                </label>
                <div className="min-h-[400px] border border-divider rounded-xl overflow-hidden shadow-inner bg-white">
                  <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    onInit={(evt, editor) => editorRef.current = editor}
                    initialValue={formData.body}
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
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary/5 border-1 border-primary/10">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Info size={18} />
                <span>Available Variables</span>
              </div>
              <p className="text-xs text-default-500 leading-relaxed">
                Add variables that will be dynamically replaced when sending emails. Use double curly braces like <code className="bg-primary/10 px-1 rounded">{"{{variable_name}}"}</code> in your body or subject.
              </p>
              
              <div className="flex gap-2">
                <Input 
                  size="sm" 
                  placeholder="variable_name"
                  value={newVar}
                  onValueChange={setNewVar}
                  variant="bordered"
                />
                <Button size="sm" color="primary" isIconOnly onPress={addVariable}>
                  <Plus size={18} />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {formData.variables.map(v => (
                  <Chip 
                    key={v} 
                    onClose={() => removeVariable(v)}
                    variant="flat"
                    color="primary"
                    className="capitalize"
                  >
                    {v}
                  </Chip>
                ))}
                {formData.variables.length === 0 && (
                  <span className="text-xs text-default-400 italic">No variables added yet.</span>
                )}
              </div>
            </CardBody>
          </Card>

          <Button 
            color="primary" 
            fullWidth 
            size="lg" 
            onPress={handleSave} 
            isLoading={saving}
            startContent={!saving && <Save size={20} />}
            className="shadow-lg shadow-primary/25 text-white font-bold h-14"
          >
            {isNew ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
