import type { Tag } from '../../domain/types';

interface TagListProps {
  tags: Tag[];
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return <p className="tags__empty">La IA no reconoció contenido en esta imagen.</p>;
  }

  return (
    <section aria-label="Etiquetas detectadas">
      <h2 className="tags__title">Contenido detectado</h2>
      <ul className="tags">
        {tags.map((tag) => (
          <li key={tag.label} className="tags__item">
            <span className="tags__label">{tag.label}</span>
            <span className="tags__meter" aria-hidden="true">
              <span className="tags__meter-fill" style={{ width: `${tag.confidence * 100}%` }} />
            </span>
            <span className="tags__confidence">{Math.round(tag.confidence * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
