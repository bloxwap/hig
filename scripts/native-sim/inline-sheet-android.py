#!/usr/bin/env python3
"""HIG inline/dynamic sheet checks on the prepared release fixture via adb/UIAutomator."""
import json
import os
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get('ADB', str(Path.home() / 'Library/Android/sdk/platform-tools/adb'))
OUT = Path(os.environ['HIG_INLINE_OUT'])
OUT.mkdir(parents=True, exist_ok=True)
notes = {}

def adb(*args):
    return subprocess.run([ADB, *args], check=True, capture_output=True).stdout

def nodes():
    for _ in range(3):
        # UIAutomator can report a null root during a cold bundle load without replacing its
        # previous file. Never treat a hierarchy from the prior process as current readiness.
        adb('shell', 'rm', '-f', '/sdcard/hig-adoption.xml')
        result = adb('shell', 'uiautomator', 'dump', '/sdcard/hig-adoption.xml')
        if b'dumped to' not in result:
            time.sleep(1)
            continue
        try:
            return [node.attrib for node in ET.fromstring(adb('shell', 'cat', '/sdcard/hig-adoption.xml')).iter('node')]
        except ET.ParseError:
            time.sleep(1)
    return []

def find(label=None, test_id=None, timeout=5, within=None):
    end = time.monotonic() + timeout
    while True:
        for node in nodes():
            if (test_id and node.get('resource-id') == test_id) or (label and (node.get('content-desc') == label or node.get('text') == label)):
                x1, y1, x2, y2 = bounds(node)
                # UIAutomator includes mounted offscreen rows at empty bounds. A tap at (0,0)
                # would hit the backdrop instead of the recovery action under test.
                contained = within is None or (within[0] <= x1 and within[1] <= y1 and x2 <= within[2] and y2 <= within[3])
                if x2 > x1 and y2 > y1 and contained:
                    return node
        if time.monotonic() >= end:
            return None

def bounds(node):
    return [int(value) for value in re.findall(r'\d+', node['bounds'])]

def tap(node):
    assert node, 'Missing tap target'
    x1, y1, x2, y2 = bounds(node)
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))
    time.sleep(0.8)

def scroll(node):
    assert node, 'Missing scroll owner'
    x1, y1, x2, y2 = bounds(node)
    x = str((x1+x2)//2)
    adb('shell', 'input', 'swipe', x, str(int(y1+(y2-y1)*0.85)), x, str(int(y1+(y2-y1)*0.15)), '400')
    time.sleep(0.7)

def capture(name):
    (OUT / (name+'.png')).write_bytes(adb('exec-out', 'screencap', '-p'))
    (OUT / (name+'.json')).write_text(json.dumps(nodes(), ensure_ascii=False, indent=2)+'\n')

adb('shell', 'am', 'force-stop', 'com.bloxwap.hig.gallery')
adb('shell', 'am', 'start', '-n', 'com.bloxwap.hig.gallery/.MainActivity')
assert find(test_id='inline-ready', timeout=30), 'Fixture did not load'
def state():
    return find(test_id='inline-ready')['text']
assert 'closed · mounts 1 · settled 0' in state(), state()
assert not find(label='Choose ETH', timeout=1), 'Closed content leaked into accessibility hierarchy'
adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
assert 'fallback 1' in state(), 'Closed inline sheet consumed Back'
capture('inline-prepared-closed')
tap(find(test_id='inline-open'))
tap(find(label='Choose ETH'))
assert find(label='Selected ETH')
tap(find(test_id='inline-query'))
adb('shell', 'input', 'text', 'BTC')
adb('shell', 'input', 'keyevent', 'KEYCODE_ENTER')
time.sleep(1)
viewport = find(test_id='inline-list')
assert viewport, 'Inline list absent'
swipes = 0
target = find(test_id='inline-end', timeout=1, within=bounds(viewport))
while not target and swipes < 20:
    scroll(viewport)
    swipes += 1
    target = find(test_id='inline-end', timeout=1, within=bounds(viewport))
assert target, 'Last inline action not reachable'
capture('inline-list-end')
tap(find(label='Reject next close'))
tap(find(label='Try close'))
assert find(label='Close rejected'), 'Controlled close did not veto'
assert 'open · mounts 1 · settled 0' in state(), state()
assert find(test_id='inline-end', within=bounds(find(test_id='inline-list'))), 'Rejected close lost native list offset'
capture('inline-rejected-close')
tap(find(label='Done'))
assert 'closed · mounts 1 · settled 1' in state(), state()
assert not find(label='Choose ETH', timeout=1), 'Dismissed inline content remained accessible'
tap(find(test_id='inline-open'))
assert find(label='Selected ETH'), 'Local selection reset on reopen'
assert find(test_id='inline-query')['text'] == 'BTC', 'Local query reset on reopen'
assert find(test_id='inline-end', within=bounds(find(test_id='inline-list'))), 'Native list offset reset on reopen'
capture('inline-reopened')
adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
assert 'closed · mounts 1 · settled 2' in state(), state()
adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
assert 'fallback 2' in state(), 'Closed inline Back did not defer'
notes['inline'] = {'preparedMounts': 1, 'acceptedSettled': 2, 'rejectedSettled': 0, 'query': 'BTC', 'selectionRetained': True, 'lastActionVisibleAfterReopen': True, 'swipesToLastAction': swipes, 'closedBackDelegated': True, 'openBackClosed': True}
tap(find(label='Open measured card'))
short_y = bounds(find(label='Measured card'))[1]
capture('dynamic-short')
tap(find(label='Change content height'))
tall_y = bounds(find(label='Measured card'))[1]
assert tall_y < short_y - 100, (short_y, tall_y)
capture('dynamic-tall')
tap(find(label='Change content height'))
restored_y = bounds(find(label='Measured card'))[1]
assert abs(restored_y-short_y) < 8, (short_y, restored_y)
tap(find(label='Close measured card'))
assert find(test_id='inline-open')
notes['dynamic'] = {'shortTitleY': short_y, 'tallTitleY': tall_y, 'restoredTitleY': restored_y}
(OUT / 'report.json').write_text(json.dumps(notes, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(notes, ensure_ascii=False), flush=True)
