export interface User {
  uid: string;
  email: string;
  role: 'super_admin' | 'store_admin' | 'warehouse_manager' | 'sales_agent';
  storeId?: string;
}

export const canManageStores = (user: User) => user.role === 'super_admin';

export const canManageStoreData = (user: User, storeId?: string) => 
  user.role === 'super_admin' || (user.role === 'store_admin' && !!storeId && user.storeId === storeId);

export const canAccessInventory = (user: User, storeId?: string) => 
  user.role === 'super_admin' || (!!storeId && user.storeId === storeId && ['store_admin', 'warehouse_manager', 'sales_agent'].includes(user.role));

export const canRecordSales = (user: User, storeId?: string) => 
  user.role === 'super_admin' || (!!storeId && user.storeId === storeId && ['store_admin', 'sales_agent'].includes(user.role));

export const canManageContacts = (user: User, storeId?: string) => 
  canManageStoreData(user, storeId) || user.role === 'sales_agent';
