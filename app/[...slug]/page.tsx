import Image from "next/image"
import { notFound } from "next/navigation"

export const dynamicParams = false

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

type JsonApiArticleCollection = {
  data?: {
    attributes?: {
      drupal_internal__nid?: number
      path?: { alias?: string | null }
    }
  }[]
}

export async function generateStaticParams() {
  const allowEmptyExport = process.env.ALLOW_EMPTY_EXPORT === "true"

  try {
    const response = await fetch(
      `${process.env.DRUPAL_BASE_URL}/jsonapi/node/article?filter[status]=1&fields[node--article]=drupal_internal__nid,path`,
      { cache: "force-cache" },
    )
    if (!response.ok) throw new Error(`Drupal respondio con HTTP ${response.status}`)

    const json = (await response.json()) as JsonApiArticleCollection
    const paths = (json.data || [])
      .map((article) => {
        const alias = article.attributes?.path?.alias
        const nid = article.attributes?.drupal_internal__nid
        return alias ? { slug: alias.split("/").filter(Boolean) } : nid ? { slug: ["node", String(nid)] } : null
      })
      .filter((path): path is { slug: string[] } => path !== null)
    if (paths.length || allowEmptyExport) {
      return paths.length ? paths : [{ slug: ["__no-content__"] }]
    }
    throw new Error("Drupal no devolvio articulos para la exportacion estatica")
  } catch {
    if (allowEmptyExport) return [{ slug: ["__no-content__"] }]
    throw new Error("Drupal no esta disponible para la exportacion estatica")
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  if (slug.length === 1 && slug[0] === "__no-content__") notFound()
  const nodeId = slug.length === 2 && slug[0] === "node" ? slug[1] : null
  const articleUrl = new URL(
    `${process.env.DRUPAL_BASE_URL}/jsonapi/node/article`,
  )
  articleUrl.searchParams.set("include", "field_poster")
  if (nodeId && /^\d+$/.test(nodeId)) {
    articleUrl.searchParams.set("filter[drupal_internal__nid]", nodeId)
  } else {
    articleUrl.searchParams.set("filter[path.alias]", `/${slug.join("/")}`)
  }

  const response = await fetch(articleUrl, { cache: "force-cache" })
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