import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import HomeTab from '@/components/stay/HomeTab';import HeroSection from '@/components/stay/HeroSection';import BottomNavigation from '@/components/stay/BottomNavigation';
import i18n from '@/i18n';import '@/index.css';
i18n.changeLanguage('vi');
const noop=()=>{};
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><main className="pb-20 min-h-screen bg-background"><HeroSection guestName="Khách minh họa" roomName="201"/><HomeTab isGuest hasActiveFolio folioId="demo" roomId="demo" roomNumber="201" hotelPhone="" /><BottomNavigation activeTab="home" onTabChange={noop} isGuest cartCount={0} onCartClick={noop}/></main></QueryClientProvider>);
