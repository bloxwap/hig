import {InstallCommand} from '@bloxwap/hig/react/blocks/install-command';
import {Surface,Text} from '@bloxwap/hig/react/surface';
import {Alert} from '@bloxwap/hig/react/status';

export default function DocsPreset(){
 const install='npm install ./bloxwap-hig-react-0.1.0.tgz';
 return <div className='product-preview docs-block-preview'>
  <p className='eyebrow'>SDK DOCUMENTATION BLOCK</p>
  <h2>Install once. Compose anywhere.</h2>
  <InstallCommand command={install} onCopy={()=>navigator.clipboard.writeText(install)}/>
  <Surface>
   <Text>TypeScript</Text>
   <pre className='hig-code' tabIndex={0}><code>{"import { Button } from '@bloxwap/hig/react/button';\n// Keep host actions and raw financial values with the host."}</code></pre>
  </Surface>
  <Alert title='Candidate packages'><p>Use dry-run tarballs until publication gates are completed.</p></Alert>
 </div>;
}
