import {fileURLToPath} from 'node:url';
// The shared icon package is a separate release. Local packed checks use the
// reviewed archive; registry checks exercise the published dependency contract.
export const iconConsumerPackage=process.env.HIG_REGISTRY_VERSION
  ? '@bloxwap/icons@^0.1.0'
  : fileURLToPath(new URL('../vendor/bloxwap-icons-0.1.0.tgz',import.meta.url));
