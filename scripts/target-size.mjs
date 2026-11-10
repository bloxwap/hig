// Runs in the browser so the gate measures layout, including wrapping label hit areas.
export function undersizedTargets({density,scope='.example-frame'}){
 const minimum=density==='compact'?36:44;
 return [...document.querySelectorAll(`${scope} button, ${scope} a[href], ${scope} input, ${scope} select, ${scope} textarea, ${scope} [role=tab], ${scope} [role=option], ${scope} [role=menuitem], ${scope} [role=switch]`)].flatMap(el=>{
  if(el.matches('p .hig-link')||el.closest('[hidden],[inert]'))return [];
  const target=el.matches('input')?el.closest('label.hig-choice,label.hig-segment')??el:el;
  const rect=target.getBoundingClientRect();
  if(!rect.width||!rect.height||getComputedStyle(target).visibility==='hidden')return [];
  return rect.width+0.01>=minimum&&rect.height+0.01>=minimum?[]:[{element:el.outerHTML.slice(0,240),width:rect.width,height:rect.height,density,minimum}];
 });
}
