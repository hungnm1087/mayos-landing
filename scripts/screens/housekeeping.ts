export {CLEANING_LABEL,hkError,vnDate} from '../../../opslamay-visa-compact/src/hooks/useHousekeepingTasks';
import {seedRooms} from './fixtures';
const base={date:'2026-11-12',created_at:'2026-11-12T02:00:00Z',task_type:'CHECKOUT',cleaning_kind:'checkout',source:'reception',priority:0,notes:null,started_at:null,completed_at:null,wait_reason:null,hold_reason:null,not_before:null,ready_deadline_at:null,requested_time_label:null,expected_arrival_hour:null,priority_bucket:'TURNOVER',manual_priority_level:null,requests:[],current_run:null};
const tasks=[
 {...base,id:'t1',room_id:seedRooms[0].id,room:{...seedRooms[0],housekeeping_status:'CLEANING'},status:'IN_PROGRESS',started_at:new Date(Date.now()-19*60000).toISOString(),current_run:{id:'run-1',status:'in_progress',started_by:'staff-demo',started_at:new Date(Date.now()-19*60000).toISOString(),nguoiThamGia:['staff-demo'],participant_names:['Nhân viên minh họa']}},
 {...base,id:'t2',room_id:seedRooms[1].id,room:seedRooms[1],status:'PENDING',notes:'Khách đến khoảng 14h · ưu tiên chuẩn bị phòng',manual_priority_level:0,expected_arrival_hour:14},
 {...base,id:'t3',room_id:seedRooms[3].id,room:seedRooms[3],status:'PENDING',cleaning_kind:'stayover',task_type:'STAYOVER',source:'stay',requests:[{id:'req-1',source:'stay',notes:'Nhờ dọn sau 11h, cảm ơn!',time_label:'Sau 11:00',created_at:'2026-11-12T02:00:00Z'}]},
 {...base,id:'t4',room_id:seedRooms[4].id,room:seedRooms[4],status:'PENDING',wait_reason:'Chờ khách trả phòng'},
 {...base,id:'t5',room_id:seedRooms[5].id,room:seedRooms[5],status:'DONE',completed_at:new Date().toISOString()},
];
export const hkDb={rpc:async()=>({data:[],error:null})};
export async function generateDailyTasks(){}
export function useHousekeepingTasks(){return {tasks,rooms:seedRooms,isLoading:false,error:null,connected:true,isFetching:false,fetchTasks:async()=>{},reorderTasks:async()=>{},stayoverCount:12};}
