import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {TooltipProvider} from '@/components/ui/tooltip';
import TimelineGrid from '@/components/timeline/TimelineGrid';
import TimelineHeader from '@/components/timeline/TimelineHeader';
import StatusLegend from '@/components/timeline/StatusLegend';
import PnlPage from '@/pages/PnlPage';
import QcRunDrawer from '@/components/housekeeping/QcRunDrawer';
import Layout from './layout';
import {rooms,roomTypes,reservations} from './fixtures';
import '@/index.css';
const mode=new URLSearchParams(location.search).get('scene');
const dates=Array.from({length:10},(_,i)=>({date:new Date(2026,10,12+i),dateKey:'2026-11-'+(12+i),dayOfWeek:['Thứ Năm','Thứ Sáu','Thứ Bảy','Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư'][i%7],isWeekend:i%7===2||i%7===3,isToday:i===0}));
const none=()=>{};
function Timeline(){return <Layout><main className="p-6 space-y-5"><div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Lịch phòng</h1><p className="text-sm text-muted-foreground">12 – 21 tháng 11, 2026</p></div><div className="rounded-full bg-primary/10 text-primary px-4 py-2 text-sm">Timeline đặt phòng</div></div><div className="border rounded-xl overflow-hidden"><TimelineHeader dates={dates} cellWidth={94} sidebarWidth={180}/><TimelineGrid rooms={rooms as never} roomTypes={roomTypes as never} dates={dates} reservations={reservations as never} roomBlocks={[]} pricingRules={[]} cellWidth={94} sidebarWidth={180} onCellClick={none} onReservationClick={none}/></div><StatusLegend/></main></Layout>;}
function Chat(){return <div style={{fontFamily:'system-ui',background:'#f4f6f5',minHeight:'100vh',paddingBottom:30}}><header style={{padding:'48px 20px 18px',background:'#233c32',color:'#fff'}}><b style={{fontSize:20}}>Lammy</b><p style={{fontSize:12,opacity:.8,marginTop:3}}>Trợ lý La May · Cuộc hội thoại minh họa</p></header><p style={{textAlign:'center',fontSize:12,color:'#7b8580',padding:20}}>23:47 · Khách hỏi phòng cuối tuần</p>{[
 ['guest','Chào bạn, cuối tuần này bên mình còn phòng cho 2 người không?'],
 ['bot','Dạ em chào anh/chị! Anh/chị dự định nhận phòng và trả phòng ngày nào để em hỗ trợ kiểm tra ạ?'],
 ['guest','Mình ở từ thứ Sáu đến Chủ nhật, 2 đêm nhé.'],
 ['bot','Dạ, em đã nắm thông tin 2 khách, 2 đêm. Anh/chị thích một giường lớn hay hai giường riêng ạ?'],
 ['guest','Một giường lớn nhé.'],
 ].map(([who,text],i)=><div key={i} style={{display:'flex',justifyContent:who==='guest'?'flex-end':'flex-start',padding:'6px 16px'}}><p style={{maxWidth:'88%',fontSize:15,lineHeight:1.55,padding:'12px 15px',borderRadius:18,background:who==='guest'?'#dce9df':'#fff',color:'#24362c',boxShadow:'0 1px 3px #00000008'}}>{text}</p></div>)}<p style={{padding:'20px 20px',fontSize:11,color:'#7b8580'}}>Ví dụ nội dung tư vấn · Không phải tin nhắn của khách thật</p></div>;}
const luot={id:'demo-run',status:'in_progress' as const,started_by:'staff-demo',started_at:'2026-11-12T02:00:00Z',nguoiThamGia:['Nhân viên minh họa']};
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><BrowserRouter><TooltipProvider>{mode==='pnl'?<PnlPage/>:mode==='qc'?<QcRunDrawer open onOpenChange={none} luot={luot} roomId="room-demo" roomName="201" tenNguoiThamGia={['Nhân viên minh họa']} onXong={none}/>:mode==='chat'?<Chat/>:<Timeline/>}</TooltipProvider></BrowserRouter></QueryClientProvider>);
