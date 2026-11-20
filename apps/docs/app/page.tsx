import {SiteFooter} from '@/components/site-footer';
import {HomeHeader} from '@/components/home-header';
import {HomeBlockPreview} from '@/components/home-block-preview';
import {basePath} from '@/lib/site';
import content from '../src/demo-content.json';

export const metadata = {alternates: {canonical: `${basePath}/`}};

// Balance the rendered preview heights across desktop widths while keeping the opening row stable.
const columns = [
  ['AccountBlock', 'TradeEntry', 'RewardBlock', 'ModalBlock', 'ScreenHeader', 'TargetBlock'],
  ['SwapBlock', 'ClaimRewardBlock', 'FeedbackBlock', 'MarketingHero', 'NotificationsBlock', 'SignalsBlock', 'TradeHistoryDetailBlock'],
  ['QRCode', 'AdvancedBlock', 'InstallCommand', 'FromPickerBlock', 'SoundHapticsBlock', 'PositionBlock'],
  ['ProfileBlock', 'LoginBlock', 'LanguageBlock', 'TokenActionBlock', 'ConfirmBlock', 'TradeHistoryListBlock'],
  ['PositionsBlock', 'ManagePositionBlock', 'DepositBlock', 'AssetsBlock', 'ToPickerBlock', 'PresetPickerBlock', 'MarketRow'],
];
const catalog = new Set(content.catalog.map(entry => entry.name));
const featured = new Set(columns.flat());
const additional = content.catalog.filter(entry => entry.family === 'blocks' && !featured.has(entry.name));

function SkeletonCard() {
  return <div className="home-skeleton-card" aria-hidden="true"><i/><i/><i/><i/></div>;
}

function SkeletonRail({side}: {side: 'left' | 'right'}) {
  return <div className={`home-skeleton-rail home-skeleton-${side}`} aria-hidden="true">
    {Array.from({length: 24}, (_, i) => <SkeletonCard key={i}/>)}
  </div>;
}

export default function Page() {
  const gallery = columns.map((names, index) => [...names, ...additional.filter((_, i) => i % columns.length === index).map(entry => entry.name)]);
  return <div id="nd-home-layout"><HomeHeader/>
    <main id="main-content">
      <section className="home-intro">
        <h1>Bloxwap HIG</h1>
        <p>Build trading and wallet interfaces for React and React Native. Explore the blocks that power accounts, swaps, positions, and rewards.</p>
        <div className="home-intro-actions">
          <a className="hig-button" href={`${basePath}/docs/guides/installation/`}>Get started</a>
          <a id="explore-components" className="hig-button" data-intent="secondary" href={`${basePath}/docs/catalog/`}>View components</a>
        </div>
      </section>
      <div className="home-gallery-frame">
      <section id="blocks" className="home-gallery" aria-label="Block gallery">
        <SkeletonRail side="left"/>
        {gallery.map((names, column) => <div className="home-gallery-column" key={column}>
          {names.map((name, index) => {
            if (!catalog.has(name)) return null;
            const title = name === 'QRCode' ? 'QR code' : name.replace(/Block$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
            return <article className="home-block-card" key={name} aria-label={title}>
              <HomeBlockPreview name={name} eager={index === 0}/>
            </article>;
          })}
          <div className="home-gallery-tail" aria-hidden="true"><SkeletonCard/></div>
        </div>)}
        <SkeletonRail side="right"/>
      </section>
      </div>
    </main>
    <SiteFooter/>
  </div>;
}
