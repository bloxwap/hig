export interface NotificationMessage {id:string;message:string;severity:'info'|'success'|'warning'|'error'}
/** One announcement per committed burst; repeated ids/content do not create repeated effects. */
export function notificationDelta(previous:ReadonlyMap<string,string>,notices:readonly NotificationMessage[]){
 const next=new Map<string,string>();
 let important:NotificationMessage|undefined;
 for(const notice of notices){
  if(next.has(notice.id)){
   // Duplicate IDs keep their first position and their final content.
   const unique=new Map<string,NotificationMessage>();
   for(const item of notices)unique.set(item.id,item);
   return notificationDelta(previous,[...unique.values()]);
  }
  const signature=JSON.stringify([notice.message,notice.severity]);
  next.set(notice.id,signature);
  if(previous.get(notice.id)!==signature && important?.severity!=='error')important=notice;
 }
 return {next,id:important?.id,message:important?.message,severity:important?.severity??'info'};
}
