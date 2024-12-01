export interface Balance {
    balance: string;
    events: any[]; // Replace `any` with a specific type if known
    escrowEvents: any[]; // Replace `any` with a specific type if known
}

export interface ContentData {
    reason: string;
    dueDate: string; // ISO 8601 date format
    builderId: string;
    createdWith: string;
}

export interface CreatorOrParticipant {
    type: string; // e.g., 'ethereumAddress'
    value: string; // Ethereum address
}

export interface CurrencyInfo {
    type: string; // e.g., 'ERC20'
    value: string; // Token contract address
    network: string; // e.g., 'sepolia'
}

export interface Meta {
    ignoredTransactions: any[]; // Replace `any` with a specific type if known
    transactionManagerMeta: Record<string, any>; // Replace `any` if a specific type is known
}

export interface Extension {
    [key: string]: Record<string, any>; // Replace `any` with specific types if possible
}

export interface RequestData {
    balance: Balance;
    contentData: ContentData;
    creator: CreatorOrParticipant;
    currency: string; // e.g., 'fUSDC-sepolia'
    currencyInfo: CurrencyInfo;
    events: any[]; // Replace `any` with a specific event type if known
    expectedAmount: string; // In smallest currency unit
    extensions: Extension;
    extensionsData: Record<string, any>[]; // Replace `any` with specific types if possible
    meta: Meta;
    payee: CreatorOrParticipant;
    payer: CreatorOrParticipant;
    pending: null | any; // Replace `any` if a specific type is known
    requestId: string;
    state: string; // e.g., 'created'
    timestamp: number; // Unix timestamp
    version: string; // e.g., '2.0.3'
    _events: Record<string, any>; // Replace `any` with specific types if known
    _eventsCount: number;
    _maxListeners?: number; // Optional
}

export interface RequestArray {
    [index: number]: RequestData; // Represents an array of `RequestData`
}
