import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeleteRequest {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface DeleteConfirmationContextValue {
  requestDelete: (request: DeleteRequest) => void;
}

const DeleteConfirmationContext = createContext<DeleteConfirmationContextValue>({ requestDelete: () => undefined });

export function DeleteConfirmationProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [request, setRequest] = useState<DeleteRequest | null>(null);

  const requestDelete = useCallback((nextRequest: DeleteRequest) => {
    setRequest(nextRequest);
  }, []);

  const value = useMemo(() => ({ requestDelete }), [requestDelete]);

  return (
    <DeleteConfirmationContext.Provider value={value}>
      {children}
      <DeleteConfirmationDialog
        open={request !== null}
        onOpenChange={open => {
          if (!open) setRequest(null);
        }}
        title={request?.title ?? ''}
        message={request?.message ?? ''}
        cancelLabel={t('auditCancel' as any)}
        deleteLabel={t('auditDelete' as any)}
        onConfirm={() => {
          request?.onConfirm();
          setRequest(null);
        }}
      />
    </DeleteConfirmationContext.Provider>
  );
}

export function useDeleteConfirmation() {
  return useContext(DeleteConfirmationContext);
}
