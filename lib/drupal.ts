import { NextDrupal } from "next-drupal"

export const drupal = new NextDrupal(
  process.env.DRUPAL_BASE_URL || 'http://backend:80',
  { withAuth: false }
)