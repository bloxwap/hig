# Adapted from bloxwap/monorepo packages/tokens/scripts/generate-fonts.py; see source-reconciliation.md.
#!/usr/bin/env python3
"""Derive native/Satori TTFs only from the published @bloxwap/font 0.1.2 package.

Requires fonttools[woff]==4.61.1 and brotli==1.2.0. By default uses the installed
npm dependency; --package-dir accepts an extracted npm package for offline rebuilds.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
import fontTools
if fontTools.__version__ != '4.61.1':
    raise RuntimeError('Use fonttools[woff]==4.61.1 and brotli==1.2.0 for reproducible generation')
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[1]
PACKAGE_VERSION = '0.1.2'
# Unique-ID (name ID 3) prefix of the committed faces. 0.1.2 republished the 0.1.1
# variable sources byte-for-byte (SOURCE_SHA256 below), so the derived faces keep
# their 0.1.1 identity and stay byte-identical. Bump it only with new source bytes.
FACE_ID_VERSION = '0.1.1'

SOURCE_SHA256 = {'fonts/BloxwapSans/BloxwapSans-Variable.woff2': '96f6be58023b1d22152c797336282a4330a47ab4a3c0ab87451be887903746b7', 'fonts/BloxwapMono/BloxwapMono-Variable.woff2': 'fa66e41575807c3d260d8f5b493be349cac127836b0174976c7d4876237d2632', 'fonts/BloxwapSansKR/BloxwapSansKR-Variable.woff2': 'ac41500ba7546e204d07499266cadb848e24c0e9935c2616124aedcfba5a9737', 'fonts/BloxwapSansSC/BloxwapSansSC-Variable.woff2': 'c0244998e334bbd997dc9acfaf3f10bce169facfec1cf2bbcfc4db38c7122893'}

STYLES = {400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black'}

def rename(font, name_id, value):
    font['name'].names = [n for n in font['name'].names if n.nameID != name_id]
    font['name'].setName(value, name_id, 3, 1, 0x409)
    font['name'].setName(value, name_id, 1, 0, 0)

def instance(source, family, weight):
    font = TTFont(source, recalcTimestamp=False)
    axes = {a.axisTag: (weight if a.axisTag == 'wght' else a.defaultValue) for a in font['fvar'].axes}
    font = instantiateVariableFont(font, axes, inplace=True)
    font.flavor = None
    font.recalcTimestamp = False
    style = STYLES[weight]
    display_family = family.replace('Bloxwap', 'Bloxwap ')
    ps = f'{family}-{style}'
    for key, value in {1: display_family, 2: style, 3: f'{FACE_ID_VERSION};Bloxwap;{ps}', 4: f'{display_family} {style}', 6: ps, 16: display_family, 17: style}.items():
        rename(font, key, value)
    font['OS/2'].usWeightClass = weight
    font['OS/2'].fsSelection &= ~((1 << 5) | (1 << 6))
    if weight >= 700: font['OS/2'].fsSelection |= 1 << 5
    elif weight == 400: font['OS/2'].fsSelection |= 1 << 6
    font['head'].macStyle = (font['head'].macStyle & ~1) | (1 if weight >= 700 else 0)
    return font

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--package-dir', type=Path)
args = parser.parse_args()
package_dir = args.package_dir
if package_dir is None:
    # Match workspace/hoisted installs by looking up ancestor node_modules.
    for base in (ROOT / 'packages/native-fonts', ROOT / 'packages', ROOT):
        candidate = base / 'node_modules/@bloxwap/font'
        if (candidate / 'package.json').is_file():
            package_dir = candidate
            break
if package_dir is None:
    raise SystemExit(f'Install @bloxwap/font@{PACKAGE_VERSION} with bun install or pass --package-dir /path/to/package')
pkg = package_dir.resolve()
metadata = json.loads((pkg / 'package.json').read_text())
assert metadata['name'] == '@bloxwap/font' and metadata['version'] == PACKAGE_VERSION, f'Expected the published @bloxwap/font {PACKAGE_VERSION} package'
# Verify every source before writing outputs, including when metadata is unchanged.
for relative, expected in SOURCE_SHA256.items():
    actual = hashlib.sha256((pkg / relative).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit(f'Published {PACKAGE_VERSION} source SHA256 mismatch: {relative}: {actual}')
native = ROOT / 'packages/native-fonts/fonts'
native.mkdir(parents=True, exist_ok=True)
manifest = {'package': '@bloxwap/font', 'version': PACKAGE_VERSION, 'sources': SOURCE_SHA256, 'faces': [], 'outputs': {}}
for family, weights, script in [('BloxwapSans', [400,500,600,700,800,900], 'latin'), ('BloxwapMono', [400,500,600,700,800], 'latin'), ('BloxwapSansKR', [400,600], 'korean'), ('BloxwapSansSC', [400,600], 'simplified-chinese')]:
    source = pkg / f'fonts/{family}/{family}-Variable.woff2'
    for weight in weights:
        suffix = '' if weight == 400 else f'-{STYLES[weight]}'
        filename = f'{family}{suffix}.ttf'
        font = instance(source, family, weight)
        font.save(native / filename, reorderTables=True)
        manifest['outputs'][filename] = hashlib.sha256((native / filename).read_bytes()).hexdigest()
        manifest['faces'].append({'family': family, 'weight': weight, 'asset': filename, 'script': script, 'registration': family + STYLES[weight], 'postscript': family + '-' + STYLES[weight], 'bytes': (native / filename).stat().st_size})
shutil.copyfile(pkg / 'LICENSE', native / 'OFL.txt')
(native / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Generated {len(manifest["faces"])} static faces from pinned @bloxwap/font {PACKAGE_VERSION}')
