import { drupal } from "@/lib/drupal";
import { DrupalNode } from "next-drupal";

export const dynamic = "force-dynamic";

export default async function Home() {
  let articles: DrupalNode[] = [];

  try {
    articles = await drupal.getResourceCollection<DrupalNode[]>("node--article", {
      params: {
        "filter[status]": "1",
        sort: "-created",
        "fields[node--article]": "title,path,created",
      },
      next: { revalidate: 0 },
    });
  } catch (error) {
    console.error("Error next-drupal:", error instanceof Error ? error.message : error);
    articles = [];
  }

  if (!articles.length) return <p>No hay artículos publicados aún.</p>;

  return (
    <main>
      <h1>Artículos</h1>
      <ul>
        {articles.map((article) => (
          <li key={article.id}>
            <a href={article.path.alias}>{article.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}