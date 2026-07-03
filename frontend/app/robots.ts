import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/upload/', '/resumes/', '/interview/', '/analysis/'],
    },
    sitemap: 'https://skillmock.vercel.app/sitemap.xml',
  }
}
