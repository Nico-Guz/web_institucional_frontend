import { drupal } from "@/lib/drupal"

export default async function AcercaDePage() {
  let page: { title: string; body: { processed: string } } | null = null
  const aboutPageUuid = process.env.DRUPAL_ABOUT_PAGE_UUID

  if (!aboutPageUuid) {
    return <p>Contenido no disponible.</p>
  }

  try {
    const result = await drupal.getResource(
      "node--page",
      aboutPageUuid,
      {
        params: { "fields[node--page]": "title,body" },
        next: { revalidate: 3600 },
      }
    )
    
    if (result) {
      page = result as unknown as { title: string; body: { processed: string } }
    }
  } catch {
    // Drupal no disponible en build time
  }

  if (!page) {
    return <p>Contenido no disponible.</p>
  }

  return (
    <article>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.body.processed }} />
    </article>
  )
}