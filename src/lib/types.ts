export type TransactionType = "income" | "expense";

export type Category =
  | "salary"
  | "freelance"
  | "investments"
  | "gifts"
  | "food"
  | "transport"
  | "housing"
  | "utilities"
  | "entertainment"
  | "health"
  | "shopping"
  | "education"
  | "subscriptions"
  | "travel"
  | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string
  createdAt: string;
  isFixed?: boolean;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: Record<Category, number>;
}

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; color: string; bgColor: string }
> = {
  salary: { label: "Salario", color: "#346538", bgColor: "#EDF3EC" },
  freelance: { label: "Freelance", color: "#1F6C9F", bgColor: "#E1F3FE" },
  investments: { label: "Inversiones", color: "#956400", bgColor: "#FBF3DB" },
  gifts: { label: "Regalos", color: "#8B5CF6", bgColor: "#EDE9FE" },
  food: { label: "Comida", color: "#9F2F2D", bgColor: "#FDEBEC" },
  transport: { label: "Transporte", color: "#1F6C9F", bgColor: "#E1F3FE" },
  housing: { label: "Vivienda", color: "#956400", bgColor: "#FBF3DB" },
  utilities: { label: "Servicios", color: "#346538", bgColor: "#EDF3EC" },
  entertainment: {
    label: "Entretenimiento",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
  },
  health: { label: "Salud", color: "#9F2F2D", bgColor: "#FDEBEC" },
  shopping: { label: "Compras", color: "#D97706", bgColor: "#FEF3C7" },
  education: { label: "Educacion", color: "#1F6C9F", bgColor: "#E1F3FE" },
  subscriptions: {
    label: "Suscripciones",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  travel: { label: "Viajes", color: "#0D9488", bgColor: "#CCFBF1" },
  other: { label: "Otros", color: "#787774", bgColor: "#F0F0EE" },
};

export interface FixedItem {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  active: boolean;
}

export interface ScannedReceipt {
  id: string;
  imageData: string; // base64 data URL
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO string
  createdAt: string;
  addedAsTransaction: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  monthlySavings: number;
  savedAmount: number;
  createdAt: string;
}

export const INCOME_CATEGORIES: Category[] = [
  "salary",
  "freelance",
  "investments",
  "gifts",
  "other",
];

export const EXPENSE_CATEGORIES: Category[] = [
  "food",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "health",
  "shopping",
  "education",
  "subscriptions",
  "travel",
  "other",
];
