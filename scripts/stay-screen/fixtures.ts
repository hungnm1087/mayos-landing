export {groupBySection,parseWifiContent} from '../../../stay-at-lamay/src/hooks/useHotelInfo';
const data=[
 {id:'1',section:'wifi',title:'Wi-Fi khách sạn',content:'LaMay Guest: welcome-demo',icon:'Wifi',sort_order:1},
 {id:'2',section:'checkin_checkout',title:'Giờ nhận & trả phòng',content:'Nhận phòng từ 14:00 · Trả phòng trước 12:00. Lễ tân sẵn sàng hỗ trợ khi bạn cần.',icon:'Clock',sort_order:2},
 {id:'3',section:'contact',title:'Lễ tân',content:'Hãy liên hệ lễ tân nếu bạn cần hỗ trợ trong kỳ nghỉ.',icon:'Phone',sort_order:3},
];
export function useHotelInfo(){return {data,isLoading:false,error:null};}
export function useWeather(){return {data:null,isLoading:false};}
const images=['dawn','sunrise','morning','noon','afternoon','sunset','twilight','night'].map(time_category=>({id:time_category,time_category,image_url:'/hotel-photo.jpg'}));
export function useActiveHeroImages(){return {data:images};}
export const track=()=>{};export const initStaySession=()=>{};export const updateStayContext=()=>{};
export const callOpsFunction=async()=>({ok:false,data:null});export const setStaySessionToken=()=>{};
export const OPS_SUPABASE_URL='http://127.0.0.1:4216/offline';
export const opsSupabase={from:()=>{throw Error('Screenshot fixture: backend disabled');}};
