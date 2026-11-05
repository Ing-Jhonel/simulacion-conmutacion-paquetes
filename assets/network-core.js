(function (root) {
  'use strict';
  // Figura 10.6 de Stallings. Cada fila: a, b, coste a→b, coste b→a.
  const links = [[1,2,2,3],[1,3,5,8],[1,4,1,7],[2,3,3,6],[2,4,2,2],[3,4,3,3],[3,5,1,1],[3,6,5,8],[4,5,1,1],[5,6,2,4]];
  const nodes = [1,2,3,4,5,6];
  const edges = links.flatMap(([a,b,ab,ba]) => [[a,b,ab],[b,a,ba]]);
  function makeStep(dist, prev, fixed, label, round) {
    return {dist: {...dist}, prev: {...prev}, fixed: [...fixed], label, round};
  }
  function dijkstra(source) {
    const dist = Object.fromEntries(nodes.map(n => [n, n === source ? 0 : Infinity]));
    const prev = {}, fixed = [source];
    edges.filter(e => e[0] === source).forEach(([,v,w]) => {dist[v] = w; prev[v] = source;});
    const steps = [makeStep(dist,prev,fixed,`Inicio: fijamos el origen ${source} y los costes de sus vecinos.`,0)];
    while (fixed.length < nodes.length) {
      const u = nodes.filter(n => !fixed.includes(n)).sort((a,b) => dist[a]-dist[b] || a-b)[0];
      if (!Number.isFinite(dist[u])) break;
      fixed.push(u);
      const improved = [];
      edges.filter(e => e[0] === u).forEach(([,v,w]) => {
        if (!fixed.includes(v) && dist[u]+w < dist[v]) {dist[v]=dist[u]+w;prev[v]=u;improved.push(v);}
      });
      steps.push(makeStep(dist,prev,fixed,`Fijamos el nodo ${u} (coste ${dist[u]}). ${improved.length ? 'Mejoran las etiquetas de: '+improved.join(', ')+'.' : 'No mejoran otras etiquetas.'}`,steps.length));
    }
    return steps;
  }
  function bellmanFord(source) {
    let dist = Object.fromEntries(nodes.map(n => [n,n === source ? 0 : Infinity])), prev = {};
    let paths = {[source]:[source]};
    const steps = [makeStep(dist,prev,[],`h = 0: solo el origen ${source} es alcanzable sin recorrer enlaces.`,0)];
    steps[0].paths=structuredPaths(paths);
    for (let h=1;h<nodes.length;h++) {
      const next={...dist}, before={...prev}, nextPaths=structuredPaths(paths);
      edges.forEach(([u,v,w])=>{if(dist[u]+w<next[v]) {next[v]=dist[u]+w;before[v]=u;nextPaths[v]=[...paths[u],v];}});
      const changed = nodes.filter(n=>next[n]!==dist[n]);
      dist=next;prev=before;paths=nextPaths;
      steps.push(makeStep(dist,prev,[],`h = ${h}: caminos de hasta ${h} enlace${h===1?'':'s'}. ${changed.length ? 'Mejoran: '+changed.join(', ')+'.' : 'Sin cambios: el cálculo ha convergido.'}`,h));
      steps[steps.length-1].paths=structuredPaths(paths);
      if(!changed.length)break;
    }
    return steps;
  }
  function structuredPaths(paths) {return Object.fromEntries(Object.entries(paths).map(([n,path])=>[n,[...path]]));}
  function pathTo(source, target, step) {
    if(step.paths)return step.paths[target]?[...step.paths[target]]:[];
    if (!Number.isFinite(step.dist[target])) return [];
    const path=[target];
    while(path[0]!==source) {
      const p=step.prev[path[0]];
      if(p===undefined || path.includes(p)) return [];
      path.unshift(p);
    }
    return path;
  }
  function packetTime(count) { return (40/count + 3)*(3+count-1); }
  const api={nodes,links,edges,dijkstra,bellmanFord,pathTo,packetTime};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else root.NetworkCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
