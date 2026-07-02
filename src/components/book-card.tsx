import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { money } from "@/lib/format";

export type BookCardData = {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover_url: string | null;
  price: number | string;
  rating_avg: number | string;
};

export function BookCard({ book }: { book: BookCardData }) {
  return (
    <Link
      to="/books/$slug"
      params={{ slug: book.slug }}
      className="group block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted shadow-card ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elegant">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted-foreground">No cover</div>
        )}
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug group-hover:text-emerald">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-brand">{money(book.price)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-gold text-gold" />
            {Number(book.rating_avg).toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}
