import examples from '@/src/code.json';

const files = new Map(Object.entries(examples).map(([name, code]) => [name + '.json', code]));

export const dynamic = 'force-static';
export function generateStaticParams() {
  return Array.from(files.keys(), file => ({file}));
}

export async function GET(_request: Request, context: RouteContext<'/examples/[file]'>) {
  const {file} = await context.params;
  const code = files.get(file);
  return code ? Response.json(code) : new Response(null, {status: 404});
}
