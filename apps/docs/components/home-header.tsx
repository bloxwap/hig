import {HomeMenu} from './home-menu';
import {HomeSearch} from './home-search';
import {DocsLink} from './docs-link';
import {githubUrl,SiteBrand,navigationLinks} from '../lib/site';

function NavigationLinks(){
  return navigationLinks.map(({url,text})=><DocsLink key={url} href={url} aria-current={url==='/'?'page':undefined}>{text}</DocsLink>);
}

function GitHubLink(){
  return <a href={githubUrl} aria-label="GitHub" target="_blank" rel="noopener noreferrer">GitHub</a>;
}

export function HomeHeader(){
  return <header className="home-header" id="nd-nav"><nav aria-label="Main navigation">
    <DocsLink className="home-brand" href="/"><SiteBrand/></DocsLink>
    <div className="home-links"><NavigationLinks/></div>
    <div className="home-desktop-tools">
      <HomeSearch full/>
      <GitHubLink/>
    </div>
    <div className="home-mobile-tools">
      <HomeSearch/>
      <button type="button" popoverTarget="home-navigation" aria-label="Toggle Menu"><span className="home-chevron" aria-hidden="true"/></button>
      <HomeMenu><NavigationLinks/><GitHubLink/></HomeMenu>
    </div>
  </nav></header>;
}
