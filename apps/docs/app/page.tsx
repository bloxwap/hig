import {HomeHeader} from '@/components/home-header';
import {basePath} from '@/lib/site';
import {Playground} from '@/components/playground';
export const metadata={alternates:{canonical:`${basePath}/`}};
export default function Page(){
 return <div id='nd-home-layout'><HomeHeader/>
  <main id="main-content">
   <section className="hero">
    <div>
     <p className="eyebrow">BLOXWAP HUMAN INTERFACE GUIDELINES</p>
     <h1>One language.<br/><span>Every decision.</span></h1>
     <p className="hero-description">Clear controls. Quiet feedback. Built for the moments that matter, from the first tap to the final review.</p>
     <div className="hero-actions">
      <a id="explore-components" className="hig-button" href={`${basePath}/docs/catalog/`}>Explore components <span aria-hidden="true">↗</span></a>
      <a href={`${basePath}/docs/guides/foundations/principles/`}>Read the principles</a>
     </div>
    </div>
    <div className="hero-note"><span className="status-dot"/>Designed for web &amp; native<br/><span>Versioned. Composable. Bloxwap-owned.</span></div>
   </section>
   <Playground/>
  </main>
 </div>;
}
