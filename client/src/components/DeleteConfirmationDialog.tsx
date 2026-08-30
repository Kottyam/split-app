import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  cancelLabel: string;
  deleteLabel: string;
  onConfirm: () => void;
}

export default function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  cancelLabel,
  deleteLabel,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-2 border-[#d7e4dc] bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-kharcha-navy">{title}</DialogTitle>
          <DialogDescription className="text-sm font-medium leading-6 text-gray-600">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-2 border-[#d7e4dc] font-bold text-kharcha-navy"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
          >
            {deleteLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
