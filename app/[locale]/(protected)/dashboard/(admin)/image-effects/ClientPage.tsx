'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FilePenLine } from 'lucide-react';
import { ImageEffectFormDialog } from './ImageEffectFormDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const ImageEffectsPageClient = ({ initialEffects }: { initialEffects: any[] }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [effectToEdit, setEffectToEdit] = useState<any | null>(null);

  const handleAddNew = () => {
    setEffectToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (effect: any) => {
    setEffectToEdit(effect);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Image Effects Management</h1>
          <p className="text-muted-foreground">Manage your image effect templates here.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Effect
        </Button>
      </div>

      <ImageEffectFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        effectToEdit={effectToEdit}
      />

      <div className="mt-6 border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Provider Model</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialEffects.map((effect) => (
              <TableRow key={effect.id}>
                <TableCell className="font-medium">{effect.title}</TableCell>
                <TableCell className="text-muted-foreground">{effect.slug}</TableCell>
                <TableCell className="font-mono text-xs">{effect.provider_model}</TableCell>
                <TableCell>{effect.display_order}</TableCell>
                <TableCell>
                  <Badge variant={effect.is_active ? "default" : "destructive"}>
                    {effect.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(effect)}>
                    <FilePenLine className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
