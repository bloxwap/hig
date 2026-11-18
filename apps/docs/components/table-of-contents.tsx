'use client';

import {useMediaQuery} from 'fumadocs-core/utils/use-media-query';
import {TOC,TOCPopover,type TOCProps,type TOCPopoverProps} from 'fumadocs-ui/layouts/docs/page/slots/toc';

// Match the xl breakpoint used by the docs layout. Both controls render in server HTML.
const wideViewport='(min-width: 80rem)';
export function DesktopContents(props:TOCProps){
  return useMediaQuery(wideViewport)===false?null:<TOC {...props}/>;
}
export function CompactContents(props:TOCPopoverProps){
  return useMediaQuery(wideViewport)===true?null:<TOCPopover {...props}/>;
}
