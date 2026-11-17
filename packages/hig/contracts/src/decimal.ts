/** Bounded, nonnegative decimal arithmetic for transaction input. Numbers are display adapters only. */
export function decimal(value:string|number,places=100):string {
 const input=String(value),raw=input.startsWith('.')?'0'+input:input;
 if(raw.length>1000||!Number.isInteger(places)||places<0||places>100)throw new RangeError('Invalid decimal precision or length');
 const match=/^(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(raw);
 if(!match)return '0';
 const exponent=Number(match[3]??0);
 if(!Number.isInteger(exponent)||Math.abs(exponent)>100)return '0';
 const digits=match[1]+(match[2]??''),point=match[1].length+exponent;
 const whole=point<=0?'0':digits.slice(0,point).padEnd(point,'0');
 const fraction=(point<0?'0'.repeat(-point)+digits:digits.slice(point)).slice(0,places).replace(/0+$/,'');
 return whole.replace(/^0+(?=\d)/,'')+(fraction?'.'+fraction:'');
}
function parts(value:string|number){const [whole,fraction='']=decimal(value).split('.');return {n:BigInt(whole+fraction),scale:fraction.length};}
function format(n:bigint,scale:number){const raw=n.toString().padStart(scale+1,'0');return decimal(scale?raw.slice(0,-scale)+'.'+raw.slice(-scale):raw);}
export function decimalMultiply(a:string|number,b:string|number,places=100){const x=parts(a),y=parts(b);return decimal(format(x.n*y.n,x.scale+y.scale),places);}
export function decimalDivide(a:string|number,b:string|number,places=18){const x=parts(a),y=parts(b);if(!y.n)return '0';if(!Number.isInteger(places)||places<0||places>100)throw new RangeError('Invalid decimal precision');return format(x.n*10n**BigInt(y.scale+places)/(y.n*10n**BigInt(x.scale)),places);}
export function decimalCompare(a:string|number,b:string|number){const x=parts(a),y=parts(b),left=x.n*10n**BigInt(y.scale),right=y.n*10n**BigInt(x.scale);return left<right?-1:left>right?1:0;}
/** Localizes an editor's decimal digits without converting the amount to a floating-point number. */
export function localizeDecimal(value:string,locale:string):string{
 try{
  const formatter=new Intl.NumberFormat(locale,{useGrouping:false,maximumFractionDigits:1});
  const separator=formatter.formatToParts(1.1).find(part=>part.type==='decimal')?.value??'.';
  const digits=Array.from({length:10},(_,digit)=>formatter.format(digit));
  return value.replace(/[0-9.]/g,char=>char==='.'?separator:digits[Number(char)]);
 }catch{return value;}
}
