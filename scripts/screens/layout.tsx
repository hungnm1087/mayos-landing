import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
export const OPEN_SWITCH_ACCOUNT_EVENT='demo-switch';
export default function Layout({children}:{children:React.ReactNode}) {
 return <div className="min-h-dvh min-w-0 bg-secondary/30"><div className="hidden xl:block"><TopNavigation/></div><div className="xl:hidden"><MobileHeader/></div><main className="w-full min-w-0 pb-20 xl:pb-0">{children}</main><div className="xl:hidden"><MobileBottomNav/></div></div>;
}
