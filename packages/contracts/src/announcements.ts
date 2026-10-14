export interface NotificationMessage {id:string;message:string;severity:'info'|'success'|'warning'|'error'}
/** One announcement per committed burst; repeated ids/content do not create repeated effects. */
export function notificationDelta(previous:ReadonlyMap<string,string>,notices:readonly NotificationMessage[]){
 const unique=[...new Map(notices.map(notice=>[notice.id,notice])).values()];
 const next=new Map(unique.map(notice=>[notice.id,JSON.stringify([notice.message,notice.severity])]));
 const changed=unique.filter(notice=>previous.get(notice.id)!==next.get(notice.id));
 const important=changed.find(notice=>notice.severity==='error')??changed.at(-1);
 return {next,id:important?.id,message:important?.message,severity:important?.severity??'info'};
}
