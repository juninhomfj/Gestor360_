// Complete types definition - Replace existing content

export enum ProductType { BASICA = 'BASICA', NATAL = 'NATAL' }
export interface CommissionRule { id: string; minPercent: number; maxPercent: number | null; commissionRate: number; }
export interface CommissionTable { type: ProductType; rules: CommissionRule[]; }
export interface Sale { id: string; client: string; quantity: number; type: ProductType; valueProposed: number; valueSold: number; date: string; observations?: string; quoteNumber?: string; completionDate?: string; trackingCode?: string; boletoStatus?: 'PENDING' | 'SENT' | 'PAID'; boletoPaidDate?: string; marginPercent: number; commissionBaseTotal: number; commissionValueTotal: number; commissionRateApplied: number; }
export interface SaleFormData { client: string; quantity: number; type: ProductType; valueProposed: number; valueSold: number; date: string; observations: string; quoteNumber?: string; completionDate?: string; trackingCode?: string; boletoStatus?: 'PENDING' | 'SENT' | 'PAID'; marginPercent: number; }
export interface ClientMetric { name: string; totalOrders: number; totalSpent: number; lastPurchaseDate: string; firstPurchaseDate: string; averageTicket: number; status: 'ACTIVE' | 'INACTIVE' | 'NEW' | 'LOST'; daysSinceLastPurchase: number; typesBought: ProductType[]; }
export interface ReportConfig { daysForNewClient: number; daysForInactive: number; daysForLost: number; }
export interface SystemConfig { backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER'; lastBackupDate: string | null; googleDriveConnected: boolean; googleDriveAccount?: string; includeNonAccountingInTotal: boolean; }
export interface Snapshot { sales: Sale[]; timestamp: number; }
export interface ImportMapping { [key: string]: number; }
export interface DashboardWidgetConfig { showStats: boolean; showCharts: boolean; showRecents: boolean; }
export interface AppPreferences { hideValues: boolean; salesConfig: DashboardWidgetConfig; financeConfig: DashboardWidgetConfig; }

// AUTH
export type UserRole = 'ADMIN' | 'USER';
export interface User { id: string; username: string; name: string; role: UserRole; avatar?: string; createdAt: string; createdBy?: string; }
export interface AuthState { user: User | null; isAuthenticated: boolean; }

// FINANCE
export type AppMode = 'SALES' | 'FINANCE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type PersonType = 'PF' | 'PJ';
export type TransactionStatus = 'PENDING' | 'PAID';

export interface FinanceAccount { id: string; name: string; type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH' | 'INTERNAL'; balance: number; color: string; isAccounting: boolean; }
export interface CreditCard { id: string; name: string; limit: number; currentInvoice: number; closingDay: number; dueDay: number; color: string; }
export interface TransactionCategory { id: string; name: string; type: TransactionType; personType: PersonType; icon?: string; color?: string; subcategories: string[]; }
export interface Transaction { id: string; description: string; amount: number; type: TransactionType; date: string; categoryId: string; subcategory?: string; personType: PersonType; accountId?: string; targetAccountId?: string; cardId?: string; isPaid: boolean; tags?: string[]; }
export interface FinanceGoal { id: string; name: string; description?: string; targetValue: number; currentValue: number; deadline?: string; icon?: string; status: 'ACTIVE' | 'COMPLETED'; }
export interface Receivable { id: string; description: string; value: number; date: string; status: 'PENDING' | 'EFFECTIVE'; distributed: boolean; deductions?: CommissionDeduction[]; }
export type ChallengeModel = 'LINEAR' | 'PROPORTIONAL' | 'CUSTOM';
export interface Challenge { id: string; name: string; targetValue: number; depositCount: number; model: ChallengeModel; createdAt: string; status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'; }
export interface ChallengeCell { id: string; challengeId: string; number: number; value: number; status: 'PENDING' | 'PAID'; paidDate?: string; }
export interface CommissionDeduction { id: string; description: string; amount: number; }