import { drupal } from "@/lib/drupal"
import Image from "next/image"
import { notFound } from "next/navigation"

export const dynamicParams = true
export const dynamic = "force-dynamic"

type JsonApiArticleResponse = {
  data?: {
    attributes: {
      title: string
      body?: { processed: string }
      created: string
    }
    relationships?: {
      field_poster?: {
        data?: { id: string; meta?: { alt?: string } }
      }
    }
  }[]
  included?: {
    type: string
    id: string
    attributes?: { uri?: { url?: string } }
  }[]
}

export async function generateStaticParams() {
  try {
    const articles = await drupal.getResourceCollectionPathSegments("node--article")
    return articles.map((article) => ({ slug: article.segments }))
  } catch {
    return []
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const nodeId = slug.length === 2 && slug[0] === "node" ? slug[1] : null

  if (!nodeId || !/^\d+$/.test(nodeId)) notFound()

  const response = await fetch(
    `${process.env.DRUPAL_BASE_URL}/jsonapi/node/article?filter[drupal_internal__nid]=${nodeId}&include=field_poster`,
    { cache: "no-store" },
  )
  if (!response.ok) notFound()

  const json = (await response.json()) as JsonApiArticleResponse
  const resource = json.data?.[0]
  if (!resource) notFound()

  const posterReference = resource.relationships?.field_poster?.data
  const posterPath = json.included?.find(
    (item) => item.type === "file--file" && item.id === posterReference?.id,
  )?.attributes?.uri?.url
  const posterUrl = posterPath
    ? new URL(
        posterPath,
        process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || process.env.DRUPAL_BASE_URL,
      ).toString()
    : null

  return (
    <article>
      <h1>{resource.attributes.title}</h1>
      <time>{new Date(resource.attributes.created).toLocaleDateString("es-CO")}</time>

      {posterUrl && (
        <div className="relative aspect-video w-full">
          <Image
            src={posterUrl}
            alt={posterReference?.meta?.alt || resource.attributes.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized
          />
        </div>
      )}

      {resource.attributes.body?.processed && (
        <div dangerouslySetInnerHTML={{ __html: resource.attributes.body.processed }} />
      )}
    </article>
  )
}