import { Trip, Member } from '@/types';
import { useTrips } from '@/hooks/useTrips';
import { useLanguage } from '@/contexts/LanguageContext';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  member: Member | null;
}

export default function DeleteMemberDialog({
  open,
  onOpenChange,
  trip,
  member,
}: DeleteMemberDialogProps) {
  const { t } = useLanguage();
  const { removeMember } = useTrips();

  if (!member) return null;

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('auditDeleteMember' as any)}
      message={`${t('auditRemoveMemberFromTrip' as any, { name: member.name })} ${t('auditRemoveExpensesByMember' as any, { name: member.name })} ${t('auditActionCannotUndo' as any)}`}
      cancelLabel={t('auditCancel' as any)}
      deleteLabel={t('auditDelete' as any)}
      onConfirm={() => removeMember(trip.id, member.id)}
    />
  );
}
