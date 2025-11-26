'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FREepik_MODELS } from '@/config/freepik-models';
import { createVideoEffect } from '@/actions/effects/create';
import { updateVideoEffect } from '@/actions/effects/update';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

// Zod schema now includes an optional id for edit mode
const formSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  model_display_name: z.string().min(1),
  resolution: z.string().min(1),
  duration: z.union([z.string(), z.coerce.number()]),
  pricing_credits_override: z.coerce.number().int().min(0),
  display_order: z.coerce.number().int(),
  prompt: z.string().min(1),
  preview_video_url: z.string().url().or(z.literal('')),
  mainVideoUrl: z.string().url().or(z.literal('')).optional(),
  detailVideoUrls: z.array(z.string().url().or(z.literal(''))).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EffectFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  effectToEdit?: Record<string, any> | null;
}

export const EffectFormDialog = ({ isOpen, onOpenChange, effectToEdit }: EffectFormDialogProps) => {
  const router = useRouter();
  const isEditMode = !!effectToEdit;

  const [selectedModel, setSelectedModel] = useState(() => {
    const initialModelName = effectToEdit?.metadata_json?.model_display_name || FREepik_MODELS[0].displayName;
    return FREepik_MODELS.find(m => m.displayName === initialModelName) || FREepik_MODELS[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const defaultValues = {
        id: effectToEdit?.id || undefined,
        slug: effectToEdit?.slug || '',
        title: effectToEdit?.title || '',
        description: effectToEdit?.description || '',
        category: effectToEdit?.category || '舞蹈演示',
        pricing_credits_override: effectToEdit?.pricing_credits_override ?? 25,
        display_order: effectToEdit?.display_order ?? 0,
        model_display_name: effectToEdit?.metadata_json?.model_display_name || FREepik_MODELS[0].displayName,
        resolution: effectToEdit?.metadata_json?.freepik_params?.resolution || FREepik_MODELS[0].options.resolutions[0],
        duration: effectToEdit?.metadata_json?.freepik_params?.duration || FREepik_MODELS[0].options.durations[0],
        prompt: effectToEdit?.metadata_json?.freepik_params?.prompt || '',
        preview_video_url: effectToEdit?.preview_video_url || '',
        mainVideoUrl: effectToEdit?.metadata_json?.pageContent?.mainVideoUrl || '',
        detailVideoUrls: effectToEdit?.metadata_json?.pageContent?.detailVideoUrls || Array(7).fill(''),
      };
      form.reset(defaultValues);
      const model = FREepik_MODELS.find(m => m.displayName === defaultValues.model_display_name) || FREepik_MODELS[0];
      setSelectedModel(model);
    }
  }, [isOpen, effectToEdit, form]);

  const handleModelChange = (displayName: string) => {
    const model = FREepik_MODELS.find(m => m.displayName === displayName);
    if (model) {
      setSelectedModel(model);
      form.setValue('model_display_name', model.displayName);
      form.setValue('resolution', model.options.resolutions[0]);
      form.setValue('duration', model.options.durations[0]);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const toastId = toast.info(isEditMode ? 'Updating effect...' : 'Creating new effect...');

    const formData = new FormData();
    
    const modelDef = FREepik_MODELS.find(m => m.displayName === values.model_display_name);
    let provider_model = '';
    if (modelDef) {
      if (typeof modelDef.providerModelMap === 'string') {
        provider_model = modelDef.providerModelMap;
      } else {
        provider_model = modelDef.providerModelMap[values.resolution] ?? '';
      }
    }

    if (!provider_model) {
        toast.error('Could not determine provider model from selection.', { id: toastId });
        setIsSubmitting(false);
        return;
    }

    Object.entries(values).forEach(([key, value]) => {
        if (key === 'detailVideoUrls' && Array.isArray(value)) {
            value.forEach((url, index) => { formData.append(`detailVideoUrls.${index}`, url); });
        } else if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    formData.append('provider_code', 'freepik');
    formData.append('provider_model', provider_model);

    const result = isEditMode ? await updateVideoEffect(formData) : await createVideoEffect(formData);

    if (result.success) {
      toast.success(`Effect '${values.title}' ${isEditMode ? 'updated' : 'created'} successfully!`, { id: toastId });
      onOpenChange(false); // Close dialog
      router.refresh(); // Refresh server components on the page
    } else {
      toast.error(result.error || 'An unknown error occurred.', { id: toastId });
      console.error(result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Video Effect</DialogTitle>
          <DialogDescription>
            {isEditMode ? `Editing the effect: ${effectToEdit?.title}` : 'Create a new effect template by filling out the form below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-8 py-4">
                {/* Form content remains the same, react-hook-form handles the values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input id="slug" {...form.register('slug')} placeholder="e.g., ai-cool-dance" />
                            {form.formState.errors.slug && <p className="text-red-500 text-xs mt-1">{form.formState.errors.slug.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...form.register('description')} />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" {...form.register('category')} />
                            {form.formState.errors.category && <p className="text-red-500 text-xs mt-1">{form.formState.errors.category.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="prompt">Prompt</Label>
                            <Textarea id="prompt" {...form.register('prompt')} className="min-h-[100px]" />
                            {form.formState.errors.prompt && <p className="text-red-500 text-xs mt-1">{form.formState.errors.prompt.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Model</Label>
                            <Select onValueChange={handleModelChange} value={selectedModel.displayName}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {FREepik_MODELS.map(model => (
                                        <SelectItem key={model.displayName} value={model.displayName}>{model.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Resolution</Label>
                                <Controller control={form.control} name="resolution" render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{selectedModel.options.resolutions.map(res => <SelectItem key={res} value={res}>{res}</SelectItem>)}</SelectContent>
                                    </Select>
                                )}/>
                            </div>
                            <div>
                                <Label>Duration (seconds)</Label>
                                <Controller control={form.control} name="duration" render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={String(field.value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{selectedModel.options.durations.map(dur => <SelectItem key={String(dur)} value={String(dur)}>{String(dur)}</SelectItem>)}</SelectContent>
                                    </Select>
                                )}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="pricing_credits_override">Credits</Label>
                                <Input id="pricing_credits_override" type="number" {...form.register('pricing_credits_override')} />
                            </div>
                            <div>
                                <Label htmlFor="display_order">Display Order</Label>
                                <Input id="display_order" type="number" {...form.register('display_order')} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Content URLs</h3>
                    <div>
                        <Label htmlFor="preview_video_url">Preview Video URL (for list page)</Label>
                        <Input id="preview_video_url" {...form.register('preview_video_url')} />
                        {form.formState.errors.preview_video_url && <p className="text-red-500 text-xs mt-1">{form.formState.errors.preview_video_url.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="mainVideoUrl">Main Video URL (for detail page)</Label>
                        <Input id="mainVideoUrl" {...form.register('mainVideoUrl')} />
                        {form.formState.errors.mainVideoUrl && <p className="text-red-500 text-xs mt-1">{form.formState.errors.mainVideoUrl.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Detail Video URLs (7 URLs for detail page sections)</Label>
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i}>
                                <Input {...form.register(`detailVideoUrls.${i}`)} placeholder={`Detail URL ${i + 1}`} />
                                {form.formState.errors.detailVideoUrls?.[i] && <p className="text-red-500 text-xs mt-1">{form.formState.errors.detailVideoUrls[i]?.message}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Create Effect'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
