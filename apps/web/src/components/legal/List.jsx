export const List = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="relative pl-4 before:absolute before:top-[0.7em] before:left-0 before:size-1 before:rounded-full before:bg-muted-foreground/40">
        {item}
      </li>
    ))}
  </ul>
);
