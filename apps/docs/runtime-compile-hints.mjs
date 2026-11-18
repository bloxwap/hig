// Cold mobile traces attribute startup compilation to hydration, sidebar setup and class merging.
export function hintRuntimeCompilation(webpack){
 const name='HintRuntimeCompilation';
 const startupModule=/[\\/]next[\\/]dist[\\/](?:(?:esm[\\/])?client[\\/]app-index|compiled[\\/]react-dom(?:-experimental)?[\\/]cjs[\\/]react-dom-client\.production)\.js$/;
 return {apply(compiler){
  compiler.hooks.thisCompilation.tap(name,compilation=>{
   compilation.hooks.processAssets.tap({
    name,stage:webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE+1,
   },()=>{
    for(const chunk of compilation.chunks){
     if(!chunk.canBeInitial())continue;
     const modules=compilation.chunkGraph.getChunkModulesIterable(chunk);
     const eager=chunk.name==='docs-classes'||Array.from(modules).some(module=>{
      const path=module.nameForCondition?.();
      return startupModule.test(path)||/[\\/]fumadocs-ui[\\/]dist[\\/]layouts[\\/]docs[\\/]slots[\\/]sidebar\.js$/.test(path);
     });
     if(!eager)continue;
     for(const file of chunk.files){
      if(file.endsWith('.js'))compilation.updateAsset(file,source=>new webpack.sources.ConcatSource('//# allFunctionsCalledOnLoad\n',source));
     }
    }
   });
  });
 }};
}
