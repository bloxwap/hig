'use client';

import { useStaticSearch } from 'fumadocs-core/search/client/orama-static';
import {
  SearchDialog, SearchDialogClose, SearchDialogContent, SearchDialogHeader,
  SearchDialogIcon, SearchDialogInput, SearchDialogList, SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { asset } from '@/lib/site';

export default function StaticSearch(props: SharedProps) {
  const { search, onSearchChange, isLoading, data } = useStaticSearch({ from: asset('/search.json') });
  return <SearchDialog search={search} onSearchChange={onSearchChange} isLoading={isLoading} {...props}>
    <SearchDialogOverlay />
    <SearchDialogContent>
      <SearchDialogHeader className="search-header"><SearchDialogIcon /><SearchDialogInput /><SearchDialogClose /></SearchDialogHeader>
      <SearchDialogList items={data?.items ?? null} />
    </SearchDialogContent>
  </SearchDialog>;
}
