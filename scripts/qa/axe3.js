(async () => {
  await new Promise((r) => setTimeout(r, 300));
  await new Promise((r) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'; s.onload = r; document.head.appendChild(s); });
  const res = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
  return res.violations.map((v) => `${v.impact} ${v.id} [${v.nodes.length}] ${v.nodes[0].target.join(' ')} :: ${(v.nodes[0].failureSummary||'').split('\n')[1]?.trim()}`);
})()
