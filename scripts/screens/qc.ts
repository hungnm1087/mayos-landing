export {sangHangMucThuan,sangTraLoiThuan} from '../../../opslamay-visa-compact/src/hooks/useQcRun';
export const items=['Giường & ga gối','Bàn & khu vực làm việc','Tủ đồ & minibar','Ban công','Phòng tắm','Lối vào'].map((label,i)=>({id:'photo-'+i,label,sort_order:i,want_photo:true,fail_creates_issue:true,issue_category:'CLEANLINESS',input_type:'photo_pass_fail',is_required:false,config:{}}));
const results=async()=>[];
const deny=async()=>{throw Error('Không có backend trong bản minh họa');};
export function useQcRun(){return {hangMuc:items,dangTai:false,layKetQua:results,layLinkAnh:deny,luuAnh:deny,hoanTat:deny,ghiKetQua:deny,choGhiXong:async()=>{}};}
