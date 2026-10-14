import {HomeLayout} from 'fumadocs-ui/layouts/home';
import {basePath,layoutOptions} from '@/lib/site';
import {Demo} from '@/components/demo';
export const metadata={alternates:{canonical:`${basePath}/`}};
export default function Page(){return <HomeLayout {...layoutOptions()}><Demo route=''/></HomeLayout>;}
