'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EffectsList } from './EffectsList';
import { AddEffectFormDialog } from './AddEffectFormDialog';

import { ReactNode } from 'react';

const EffectsPageShell = ({ children }: { children: ReactNode }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Video Effects Management</h1>
          <p className="text-muted-foreground">Manage your video effect templates here.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Effect
        </Button>
      </div>

      <AddEffectFormDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <div className="mt-6">
        {children}
      </div>

    </div>
  );
};

export default EffectsPageShell;
