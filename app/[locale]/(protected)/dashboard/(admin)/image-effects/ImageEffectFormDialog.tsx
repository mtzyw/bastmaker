'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from '@/i18n/routing';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createImageEffect } from '@/actions/image-effects/create';
import { updateImageEffect } from '@/actions/image-effects/update';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEXT_TO_IMAGE_MODEL_OPTIONS } from '@/components/ai/text-image-models';

type ModelOption = {
  value: string;
  label: string;
  description?: string;
  credits?: number;
};

const DETAIL_IMAGE_COUNT = 6;
const ALLOWED_MODEL_VALUES = new Set(["Nano Banana Free", "Seedream 4", "Seedream 4 Edit"]);

const BASE_MODEL_OPTIONS: ModelOption[] = TEXT_TO_IMAGE_MODEL_OPTIONS.filter((option) =>
  ALLOWED_MODEL_VALUES.has(option.value)
).map((option) => ({
  value: option.apiValue ?? option.value,
  label: option.label,
  description: option.description,
  credits: option.credits,
}));

const formSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().optional(),
  provider_model: z.string().min(1),
  pricing_credits_override: z.coerce.number().int().min(0).default(6),
  display_order: z.coerce.number().int().default(0),
  preview_image_url: z.string().url().optional(),
  prompt: z.string().min(1),
  mainImageUrl: z.string().url().optional(),
  detailImageUrls: z.array(z.string().url()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ImageEffectFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  effectToEdit?: Record<string, any> | null;
}

export const ImageEffectFormDialog = ({ isOpen, onOpenChange, effectToEdit }: ImageEffectFormDialogProps) => {
  const router = useRouter();
  const isEditMode = !!effectToEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultModelOption = BASE_MODEL_OPTIONS[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_model: defaultModelOption?.value ?? '',
      pricing_credits_override: 6,
      display_order: 0,
      detailImageUrls: Array(DETAIL_IMAGE_COUNT).fill(''),
    },
  });

  const modelOptions = useMemo(() => {
    const base = [...BASE_MODEL_OPTIONS];
    const rawMetadata = (effectToEdit?.metadata_json ?? {}) as Record<string, any>;
    const existingValue = effectToEdit?.provider_model;
    if (existingValue && !base.some((option) => option.value === existingValue)) {
      base.unshift({
        value: existingValue,
        label: (rawMetadata.model_display_name as string) || effectToEdit?.title || existingValue,
        description: '当前模板使用的自定义模型',
      });
    }
    return base;
  }, [effectToEdit]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const metadata = (effectToEdit?.metadata_json ?? {}) as Record<string, any>;
    const freepikParams = (metadata.freepik_params ?? {}) as Record<string, any>;
    const pageContent = (metadata.pageContent ?? {}) as Record<string, any>;

    const inferredProviderModel =
      (effectToEdit?.provider_model as string | undefined) ??
      modelOptions[0]?.value ??
      form.getValues('provider_model') ??
      '';

    const defaultValues: FormValues = {
      id: effectToEdit?.id || undefined,
      slug: effectToEdit?.slug || '',
      title: effectToEdit?.title || '',
      description: effectToEdit?.description || '',
      provider_model: inferredProviderModel,
      pricing_credits_override: effectToEdit?.pricing_credits_override ?? 6,
      display_order: effectToEdit?.display_order ?? 0,
      preview_image_url: effectToEdit?.preview_image_url || '',
      prompt: (freepikParams.prompt as string) || '',
      mainImageUrl: (pageContent.mainImageUrl as string) || '',
      detailImageUrls: Array.isArray(pageContent.detailImageUrls)
        ? (pageContent.detailImageUrls as string[])
        : Array(DETAIL_IMAGE_COUNT).fill(''),
    };

    if (!defaultValues.detailImageUrls || defaultValues.detailImageUrls.length === 0) {
      defaultValues.detailImageUrls = Array(DETAIL_IMAGE_COUNT).fill('');
    } else if (defaultValues.detailImageUrls.length < DETAIL_IMAGE_COUNT) {
      defaultValues.detailImageUrls = [
        ...defaultValues.detailImageUrls,
        ...Array(DETAIL_IMAGE_COUNT - defaultValues.detailImageUrls.length).fill(''),
      ];
    }

    form.reset(defaultValues);
  }, [isOpen, effectToEdit, modelOptions, form]);

  const providerModel = form.watch('provider_model');

  const handleModelSelect = (value: string) => {
    form.setValue('provider_model', value, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    const toastId = toast.info(isEditMode ? 'Updating effect...' : 'Creating new effect...');

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'detailImageUrls' && Array.isArray(value)) {
        value.forEach((url, index) => {
          if (url) {
            formData.append(`detailImageUrls.${index}`, url);
          }
        });
      } else if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    const result = isEditMode
      ? await updateImageEffect(formData)
      : await createImageEffect(formData);

    if (result.success) {
      toast.success(
        `Effect '${values.title}' ${isEditMode ? 'updated' : 'created'} successfully!`,
        { id: toastId }
      );
      onOpenChange(false);
      router.refresh();
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
          <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Image Effect</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Editing the effect: ${effectToEdit?.title}`
              : 'Create a new effect template by filling out the form below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ScrollArea className="h-[70vh] pr-6">
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" {...form.register('title')} />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" {...form.register('slug')} placeholder="e.g., ai-cartoonize" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register('description')} />
                  </div>
                  <div>
                    <Label htmlFor="preview_image_url">Preview Image URL</Label>
                    <Input id="preview_image_url" {...form.register('preview_image_url')} placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider_model">Provider Model</Label>
                    <Select value={providerModel} onValueChange={handleModelSelect}>
                      <SelectTrigger id="provider_model">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            {option.credits ? ` · ${option.credits} Credits` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pricing_credits_override">Credits</Label>
                      <Input
                        id="pricing_credits_override"
                        type="number"
                        {...form.register('pricing_credits_override')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input id="display_order" type="number" {...form.register('display_order')} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mainImageUrl">Main Gallery Image URL</Label>
                    <Input id="mainImageUrl" placeholder="https://..." {...form.register('mainImageUrl')} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea id="prompt" className="min-h-[120px]" {...form.register('prompt')} />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Detail Gallery Images (最多 6 张)</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Input
                      key={index}
                      placeholder={`https://example.com/detail-${index + 1}.jpg`}
                      {...form.register(`detailImageUrls.${index}` as const)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
