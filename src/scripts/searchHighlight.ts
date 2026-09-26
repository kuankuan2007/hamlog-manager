function getTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_SKIP;
      const value = node.nodeValue;
      if (!value) return NodeFilter.FILTER_REJECT;
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  } as NodeFilter);

  const res: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    res.push(current as Text);
    current = walker.nextNode();
  }
  return res;
}

export function highlight(content: string, nodes: Node[], highlightKey: string) {
  if (!content || !nodes || nodes.length === 0) return;
  CSS.highlights.delete(highlightKey);

  const textNodes: Text[] = Array.from(nodes)
    .map((item) => getTextNodes(item))
    .flat();
  const value = content.toUpperCase();
  const ranges: Range[] = [];
  for (const i of textNodes) {
    const text = i.textContent.toUpperCase();
    const indices: number[] = [];
    let now = 0;
    while (now < text.length) {
      const index = text.indexOf(value, now);
      if (index === -1) break;
      indices.push(index);
      now = index + value.length;
    }
    ranges.push(
      ...indices.map((index) => {
        const range = document.createRange();
        range.setStart(i, index);
        range.setEnd(i, index + value.length);
        return range;
      })
    );
  }
  console.log(ranges);
  CSS.highlights.set(highlightKey, new Highlight(...ranges));
}
