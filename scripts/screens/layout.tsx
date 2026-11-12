export default function Layout({children}:{children:React.ReactNode}) {
 return <div className="min-h-screen bg-background"><header className="flex items-center justify-between border-b px-6 py-3"><b className="text-primary">MayOS <span className="font-normal text-muted-foreground">/ Ops</span></b><span className="text-xs text-muted-foreground">Dữ liệu minh họa</span></header>{children}</div>;
}
