import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Extrato</DialogTitle>
          <DialogDescription>
            Clique no botão abaixo para exportar seu extrato de transações em formato Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={onExport} 
            disabled={isLoading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> 
            {isLoading ? 'Exportando...' : 'Exportar para Excel'}
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
