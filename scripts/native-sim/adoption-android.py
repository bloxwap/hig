#!/usr/bin/env python3
"""Android adoption NumberFlow checks: canonical final labels, not visual bidi certification."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get('ADB', str(Path.home() / 'Library/Android/sdk/platform-tools/adb'))
OUT = Path(os.environ['HIG_ADOPTION_OUT'])
PREFIX = os.environ.get('HIG_ADOPTION_PREFIX', 'default')
FULL = os.environ.get('HIG_ADOPTION_NUMBER_MODE', 'full') == 'full'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'captures').mkdir(exist_ok=True)
(OUT / 'trees').mkdir(exist_ok=True)


def adb(*args):
    return subprocess.run([ADB, *args], check=True, capture_output=True).stdout


def nodes():
    for _ in range(3):
        adb('shell', 'rm', '-f', '/sdcard/hig-number-adoption.xml')
        result = adb('shell', 'uiautomator', 'dump', '/sdcard/hig-number-adoption.xml')
        if b'dumped to' not in result:
            time.sleep(1)
            continue
        try:
            return [node.attrib for node in ET.fromstring(adb('shell', 'cat', '/sdcard/hig-number-adoption.xml')).iter('node')]
        except ET.ParseError:
            time.sleep(1)
    return []


def bounds(node):
    return [int(value) for value in re.findall(r'\d+', node['bounds'])]


def label(node):
    return (node.get('content-desc') or node.get('text') or '') if node else ''


def find(test_id, timeout=5, within=None, visible=True):
    end = time.monotonic() + timeout
    while True:
        for node in nodes():
            if node.get('resource-id') != test_id:
                continue
            if not visible:
                return node
            x1, y1, x2, y2 = bounds(node)
            contained = within is None or (within[0] <= x1 and within[1] <= y1 and x2 <= within[2] and y2 <= within[3])
            if x2 > x1 and y2 > y1 and contained:
                return node
        if time.monotonic() >= end:
            return None


def scroll(owner):
    x1, y1, x2, y2 = bounds(owner)
    x = str((x1+x2)//2)
    adb('shell', 'input', 'swipe', x, str(int(y1+(y2-y1)*0.82)), x, str(int(y1+(y2-y1)*0.18)), '350')
    time.sleep(0.5)


def reveal(test_id, backwards=False):
    owner = find('adoption-number-scroll', timeout=10)
    assert owner, 'Number scroll viewport is missing'
    for _ in range(30):
        target = find(test_id, timeout=0.4, within=bounds(owner))
        if target:
            return target
        if backwards:
            x1, y1, x2, y2 = bounds(owner)
            x = str((x1+x2)//2)
            adb('shell', 'input', 'swipe', x, str(int(y1+(y2-y1)*0.18)), x, str(int(y1+(y2-y1)*0.82)), '350')
            time.sleep(0.5)
        else:
            scroll(owner)
    raise AssertionError(f'Number control is not reachable: {test_id}')


def tap(test_id):
    target = reveal(test_id)
    x1, y1, x2, y2 = bounds(target)
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    time.sleep(0.15)


def assert_final(expected, timeout=6):
    end = time.monotonic() + timeout
    actual = None
    while True:
        readout = find('adoption-number', timeout=0, visible=False)
        actual = label(readout) if readout else None
        if actual == expected:
            return
        if time.monotonic() >= end:
            break
        time.sleep(0.1)
    raise AssertionError(f'Canonical final accessible label: expected {expected!r}, got {actual!r}')


def capture(name):
    (OUT / 'captures' / (name+'.png')).write_bytes(adb('exec-out', 'screencap', '-p'))
    (OUT / 'trees' / (name+'.json')).write_text(json.dumps(nodes(), ensure_ascii=False, indent=2)+'\n')


adb('shell', 'am', 'force-stop', 'com.bloxwap.hig.gallery')
adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'bloxwaphig://adoption?section=number', 'com.bloxwap.hig.gallery')
assert find('adoption-ready', timeout=30), 'Adoption fixture did not load'
environment = find('adoption-number-environment', timeout=15, visible=False)
assert environment, 'Number environment did not render'
environment_label = label(environment)
expected_motion = os.environ.get('HIG_ADOPTION_EXPECT_MOTION')
if expected_motion:
    end = time.monotonic() + 10
    while f'motion {expected_motion}' not in environment_label and time.monotonic() < end:
        time.sleep(0.2)
        environment_label = label(find('adoption-number-environment', visible=False))
    assert f'motion {expected_motion}' in environment_label, environment_label
minimum_scale = float(os.environ.get('HIG_ADOPTION_MIN_FONT_SCALE', '0'))
scale_match = re.search(r'scale ([0-9.]+)', environment_label)
assert scale_match and float(scale_match.group(1)) >= minimum_scale, environment_label

cases = [
    {'id': 'en-US', 'direction': 'ltr', 'initial': '999.99', 'carry': '1,000.00', 'group': '1,234,567.89', 'sign': '-250.50', 'fraction': '12.30', 'burst': '7,654,321.09'},
    {'id': 'ar-EG', 'direction': 'rtl', 'initial': '٩٩٩٫٩٩', 'carry': '١٬٠٠٠٫٠٠', 'group': '١٬٢٣٤٬٥٦٧٫٨٩', 'sign': '\u061c-٢٥٠٫٥٠', 'fraction': '١٢٫٣٠', 'burst': '٧٬٦٥٤٬٣٢١٫٠٩'},
    {'id': 'fa-IR', 'direction': 'rtl', 'initial': '۹۹۹٫۹۹', 'carry': '۱٬۰۰۰٫۰۰', 'group': '۱٬۲۳۴٬۵۶۷٫۸۹', 'sign': '\u200e−۲۵۰٫۵۰', 'fraction': '۱۲٫۳۰', 'burst': '۷٬۶۵۴٬۳۲۱٫۰۹'},
    {'id': 'en-u-nu-arab', 'direction': 'ltr', 'initial': '٩٩٩٫٩٩', 'carry': '١٬٠٠٠٫٠٠', 'group': '١٬٢٣٤٬٥٦٧٫٨٩', 'sign': '\u061c-٢٥٠٫٥٠', 'fraction': '١٢٫٣٠', 'burst': '٧٬٦٥٤٬٣٢١٫٠٩'},
]
results = []
for case in cases if FULL else [case for case in cases if case['id'] == 'en-u-nu-arab']:
    tap('adoption-locale-'+case['id'])
    environment_label = label(find('adoption-number-environment', visible=False))
    assert f"locale {case['id']}" in environment_label, environment_label
    assert f"direction {case['direction']}" in environment_label, environment_label
    assert_final('Number flow: '+case['initial'])
    if FULL:
        tap('adoption-number-carry')
        assert_final('Number flow: '+case['carry'])
    tap('adoption-number-group')
    assert_final('Number flow: '+case['group'])
    if FULL:
        tap('adoption-number-sign')
        assert_final('Number flow: '+case['sign'])
        tap('adoption-number-fraction')
        assert_final('Number flow: '+case['fraction'])
    tap('adoption-number-burst')
    assert_final('Number flow: '+case['burst'])
    time.sleep(0.7)
    assert_final('Number flow: '+case['burst'], timeout=0)
    reveal('adoption-number', backwards=True)
    capture(f"number-{PREFIX}-{case['id']}")
    tap('adoption-number-null')
    assert_final('Number flow: —')
    rtl_static = ''
    if FULL:
        tap('adoption-number-nan')
        assert_final('Number flow: —')
        tap('adoption-number-infinity')
        assert_final('Number flow: —')
        if case['id'] == 'en-u-nu-arab':
            tap('adoption-number-direction')
            environment_label = label(find('adoption-number-environment', visible=False))
            assert 'direction rtl' in environment_label, environment_label
            tap('adoption-number-group')
            assert_final('Number flow: '+case['group'])
            rtl_static = 'Number flow: '+case['group']
    results.append({'locale': case['id'], 'direction': case['direction'], 'initial': case['initial'], 'group': case['group'], 'burst': case['burst'], 'fallback': '—', 'rtlStaticFallback': rtl_static, 'environment': environment_label})

report = {'mode': 'full' if FULL else 'smoke', 'cases': results, 'limits': 'Final accessibility labels only; captures require visual/manual review for glyph shaping, bidi order and animation quality. No TalkBack speech or physical-device claim.'}
(OUT / f'number-{PREFIX}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(report, ensure_ascii=False), flush=True)
