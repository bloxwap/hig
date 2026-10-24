import {fileURLToPath} from 'node:url';

export function launchBrowser(type,options={}){
 if(type.name()!=='webkit'||process.platform!=='darwin')return type.launch(options);
 // The acceptance suites exercise full keyboard navigation with ordinary Tab,
 // including native controls. Scope that macOS preference to this WebKit child;
 // never change the shared runner's global defaults or alter focus-trap keys.
 const executable=options.executablePath??type.executablePath();
 return type.launch({...options,executablePath:fileURLToPath(new URL('./webkit-keyboard.sh',import.meta.url)),env:{...process.env,...options.env,HIG_WEBKIT_EXECUTABLE:executable}});
}
