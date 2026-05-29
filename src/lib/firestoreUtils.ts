import { auth } from '../firebase';
import { toast } from 'sonner';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const safeStringify = (obj: any) => {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
};

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const serializedErr = safeStringify(errInfo);
  console.error('Firestore Error Details: ', serializedErr);
  
  let userFriendlyError = errorMessage;
  let toastId: string | undefined = undefined;
  
  if (errorMessage.includes("Quota limit exceeded") || errorMessage.includes("resource-exhausted")) {
    userFriendlyError = "Sistem pulsuz istifadə limitini aşıb (Quota Exceeded). Zəhmət olmasa sabah yenidən yoxlayın və ya paketi yeniləyin.";
    toastId = "quota-error";
  }
  
  toast.error(`Xəta (${operationType}): ${userFriendlyError}`, { id: toastId });
  return userFriendlyError;
}
