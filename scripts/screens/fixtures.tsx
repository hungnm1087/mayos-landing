export const rooms=Array.from({length:8},(_,i)=>({id:'room-'+i,name:String(201+i),room_type_id:'deluxe',type_id:'deluxe',floor:2,status:'ACTIVE',housekeeping_status:i===5?'DIRTY':'INSPECTED',bed_config:'KING',default_bed_setup:'KING'}));
export const roomTypes=[{id:'deluxe',name:'Deluxe Balcony King',base_price:950000,max_adults:2,max_children:1,bed_config:'KING',color:'#7c9b78'}];
export const reservations=rooms.flatMap((room,i)=>[
 {id:'booking-'+i,code:'MINHHOA-'+(101+i),room_id:room.id,room_type_id:'deluxe',guest_id:'guest-'+i,
  guest:{id:'guest-'+i,name:['Gia đình An','Khách Minh','Khách Linh','Khách Bình','Gia đình Mai','Khách Nam','Khách Hà','Khách Chi'][i],phone:''},
  check_in:'2026-11-'+String(12+i%3),check_out:'2026-11-'+String(15+i%3),
  status:['CHECKED_IN','CONFIRMED','PENDING'][i%3],source:['Booking.com','Agoda','Website'][i%3],
  total_price:2850000,paid_amount:i%3===0?2850000:500000,prepayment_amount:500000,prepayment_status:'RECEIVED',
  room_charge_locked:2850000,adults:2,children:0,is_group_master:false,deleted_at:null,
  room,room_type:roomTypes[0]},
]);
const idle=async()=>{};
export function useAuth(){return {role:new URLSearchParams(location.search).get('scene')==='housekeeping'?'housekeeping':'admin',isAdmin:true,user:{id:'staff-demo'},profile:{name:'Nhân viên minh họa'},signOut:idle,lockDevice:idle};}
export function useFeedbacks(){return {newCount:0};}
export function useActivityLog(){return {logActivity:idle};}
export function useActiveBikeRentalsForReservation(){return [];}
export function usePendingLaundryCount(){return 0;}
export function useGuestManifestCount(){return 0;}
const empty:never[]=[];const emptyCounts={};
export function useHotel(){return {rooms:seedRooms,roomTypes:seedTypes,reservations:seedReservations,roomBlocks:empty,pricingRules:empty,activeBikeRentals:empty,pendingLaundryCounts:emptyCounts,isLoading:false,updateRoomHousekeeping:idle,updateReservation:idle,refetchRooms:idle,refetchRoomBlocks:idle,ensureReservationRange:idle};}
export function useHotelActions(){return useHotel();}
const blocked=()=>{throw Error('Screenshot fixture: writes and external requests disabled');};
export const supabase={from(){const q={select:()=>q,eq:()=>q,is:()=>q,in:()=>q,order:()=>q,then:(resolve:Function)=>Promise.resolve({data:[],error:null}).then(resolve as never)};return q;},functions:{invoke:blocked},rpc:blocked,auth:{getUser:async()=>({data:{user:{id:'staff-demo'}}})}};
const kq={
 doanhThu:{phong:171000000,dichVu:12000000,posVangLai:2000000,noShow:0,phiHuy:0,tong:185000000},
 chiPhi:{nhom:[{nhom:'van_hanh',danhMuc:[
  {id:'nha',ten:'Thuê nhà',kieu:'fixed',tong:45000000},{id:'dien',ten:'Điện',kieu:'variable',tong:12000000},
  {id:'nuoc',ten:'Nước',kieu:'variable',tong:2000000},{id:'giat',ten:'Giặt là',kieu:'variable',tong:6500000},
 ]}],dinhPhi:45000000,bienPhi:20500000,tong:65500000},
 luong:{luong:35000000,thuong:2000000,anCa:1500000,thangTamTinh:[]},
 chiPhiTrongYeu:{thue_nha:45000000,dien:12000000,nuoc:2000000,giat_la:6500000,luong:35000000},
 bienPhi:33000000,dinhPhi:80000000,laiTrenBienPhi:152000000,loiNhuan:72000000,
 hoaHongOta:9000000,phiHuyChoOta:0,demBan:180,demCoTheBan:240,congSuat:.75,adr:950000,revpar:712500,
 hoaVonDem:95,hoaVonCongSuat:95/240,bienPhiMoiDem:33000000/180,nhanTruocCuoiKy:18000000,
};
export function usePnl(){return {kq,dangTai:false,loi:null};}
export const seedTypes=[
 {id:'deluxe',name:'Deluxe Balcony King',base_price:950000,max_adults:2,max_children:1,bed_config:'KING'},
 {id:'family',name:'Family Double Double',base_price:1450000,max_adults:4,max_children:1,bed_config:'DOUBLE_DOUBLE'},
 {id:'superior',name:'Superior King',base_price:800000,max_adults:2,max_children:1,bed_config:'KING'},
];
export const seedRooms=Array.from({length:20},(_,i)=>({id:'demo-room-'+i,name:String((Math.floor(i/5)+2)*100+i%5+1),room_type_id:seedTypes[Math.floor(i/7)%3].id,type_id:seedTypes[Math.floor(i/7)%3].id,floor:Math.floor(i/5)+2,status:'ACTIVE',housekeeping_status:['INSPECTED','DIRTY','CLEANING','OCCUPIED'][i%4],bed_config:i>=7&&i<14?'DOUBLE_DOUBLE':'KING',default_bed_setup:'KING'}));
const start=new Date(); start.setHours(0,0,0,0);
const day=(n:number)=>{const d=new Date(start);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
export const seedReservations=seedRooms.flatMap((room,r)=>{
 const bookings=[];let d=-7;
 while(d<30){
  if(((d*7+r*3)%20+20)%20<4){d++;continue;}
  const from=d;const max=2+((r+d)%3+3)%3;
  while(d<30&&((d*7+r*3)%20+20)%20>=4&&d-from<max)d++;
  const nights=d-from;const type=seedTypes.find(t=>t.id===room.type_id)!;
  bookings.push({id:'DEMO-'+r+'-'+from,code:'DEMO-'+(1000+r*30+from),room_id:room.id,room_type_id:type.id,
   guest_id:'demo-guest-'+r+'-'+from,guest:{id:'demo-guest-'+r+'-'+from,name:['Nguyễn Minh An','Trần Khánh Linh','Lê Hoàng Nam','Phạm Thu Hà','Alex Morgan','Taylor Lee','Vũ Bảo Anh','Đỗ Ngọc Mai'][((r+from)%8+8)%8],phone:''},
   check_in:day(from),check_out:day(d),status:d<=0?'CHECKED_OUT':from<=0?'CHECKED_IN':(r+from)%7===0?'PENDING':'CONFIRMED',
   actual_check_in:from<=0?day(from)+'T07:00:00Z':null,actual_check_out:d<=0?day(d)+'T05:00:00Z':null,
   source:['Booking.com','Agoda','Website','Zalo','Facebook'][r%5],total_price:nights*type.base_price,room_charge_locked:nights*type.base_price,paid_amount:from===0?nights*type.base_price:500000,
   prepayment_amount:500000,prepayment_status:'RECEIVED',adults:type.max_adults,children:0,deleted_at:null,is_group_master:false,
   room,room_type:type,created_at:start.toISOString(),updated_at:start.toISOString()});
 }
 return bookings;
});
export const occupancy={available:740,sold:seedReservations.reduce((s,b)=>s+Math.round((Date.parse(b.check_out)-Date.parse(b.check_in))/86400000),0)};
