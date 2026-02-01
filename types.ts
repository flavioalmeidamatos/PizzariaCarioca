export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
}

export type ViewState = 'login' | 'dashboard';

export interface DashboardStat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

// Changed dl=0 to raw=1 to ensure images render directly in <img> tags
export const LOGO_URL = "https://www.dropbox.com/scl/fi/qegqz7xhpk54bfh4ravxm/PIZZARIA-CARIOCA.png?rlkey=s85el2fdslfxcm42ekk4v9fh2&raw=1";
export const PRELOADER_URL = "https://www.dropbox.com/scl/fi/bsdcq69ug1ihqen4kqamp/PRELOADER.png?rlkey=jsxg51lfoxfdjezb8lgfa5329&raw=1";