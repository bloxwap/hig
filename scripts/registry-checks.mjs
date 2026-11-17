export const registryChecks = {
  web: {script:'packed-smoke',args:[],label:'web/SSR'},
  next: {script:'packed-next-smoke',args:[],label:'Next production hydration/font binding'},
  'rn-0.81': {script:'packed-native-smoke',args:['--profile','rn-0.81'],label:'RN 0.81 Metro/Expo export'},
  'rn-0.83': {script:'packed-native-smoke',args:['--profile','rn-0.83'],label:'RN 0.83 Metro/Expo export'},
  'rn-0.88': {script:'packed-native-smoke',args:['--profile','rn-0.88'],label:'RN 0.88 Metro/Expo export'},
};
export function selectRegistryChecks(name = 'all') {
  if(name === 'all') return Object.values(registryChecks);
  if(!Object.hasOwn(registryChecks,name)) throw Error(`Unknown registry check: ${name}`);
  return [registryChecks[name]];
}
