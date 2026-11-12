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
export function useAuth(){return {role:'admin',isAdmin:true,user:{id:'staff-demo'},profile:{name:'Nhân viên minh họa'}};}
export function useHotel(){return {rooms,roomTypes,reservations,roomBlocks:[],pricingRules:[],activeBikeRentals:[],pendingLaundryCounts:{},updateRoomHousekeeping:async()=>false};}
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
