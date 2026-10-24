import type {Item,Order,OrderItem,Status} from './data';

const API_BASE=(import.meta.env.VITE_API_BASE_URL||'https://dine-ease-1.onrender.com').replace(/\/$/,'');
type ApiMenuItem={id:string;name:string;description:string;price:string|number;category:string;veg:boolean;available:boolean;emoji:string};
type ApiOrder={id:number|string;table_number:string;items:OrderItem[];status:Status;created_at:string;total:string|number};
async function request<T>(path:string,init?:RequestInit):Promise<T>{
 const response=await fetch(`${API_BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...init?.headers}});
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(body.error||`Tabilo service returned ${response.status}`);
 return body as T;
}
const menuItem=(item:ApiMenuItem):Item=>({...item,price:Number(item.price),available:Boolean(item.available),veg:Boolean(item.veg)});
const orderItem=(item:OrderItem):OrderItem=>({...item,price:Number(item.price),qty:Number(item.qty),note:item.note||''});
export const api={
 async getMenu():Promise<Item[]>{return (await request<ApiMenuItem[]>('/api/menu')).map(menuItem)},
 async setItemAvailability(id:string,available:boolean):Promise<Item>{return menuItem(await request<ApiMenuItem>(`/api/menu/${encodeURIComponent(id)}/availability`,{method:'PATCH',body:JSON.stringify({available})}))},
 async getOrders():Promise<Order[]>{return (await request<ApiOrder[]>('/api/orders')).map(row=>{const at=new Date(row.created_at).getTime();return{id:`DE-${row.id}`,backendId:Number(row.id),table:row.table_number,created:at,items:(row.items||[]).map(orderItem),status:row.status,lastUpdate:at,history:[{status:row.status,at}]}})},
 async createOrder(table:string,items:OrderItem[]):Promise<Order>{const row=await request<ApiOrder>('/api/orders',{method:'POST',body:JSON.stringify({table,items:items.map(({id,qty,note})=>({id,qty,note}))})});const at=new Date(row.created_at).getTime();return{id:`DE-${row.id}`,backendId:Number(row.id),table:row.table_number,created:at,items:(row.items||[]).map(orderItem),status:row.status,lastUpdate:at,history:[{status:row.status,at}]}},
 async updateOrderStatus(id:number,status:Status):Promise<void>{await request(`/api/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status})})}
};

