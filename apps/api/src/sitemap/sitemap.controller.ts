import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

const FRONTEND_URL = process.env['FRONTEND_URL'] || 'https://majstr.app';

@SkipThrottle()
@Controller()
export class SitemapController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('sitemap.xml')
  async getSitemap(@Res() res: Response) {
    // Load dynamic slugs in parallel
    const [masters, categories] = await Promise.all([
      this.prisma.masterProfile.findMany({
        where: { user: { services: { some: {} } } }, // only masters with services
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.serviceCategory.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const today = new Date().toISOString().split('T')[0];

    interface UrlEntry {
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
    }

    const staticUrls: UrlEntry[] = [
      { loc: '/',                 changefreq: 'daily',   priority: '1.0', lastmod: today },
      { loc: '/categories',       changefreq: 'weekly',  priority: '0.9', lastmod: today },
      { loc: '/masters',          changefreq: 'daily',   priority: '0.8', lastmod: today },
      { loc: '/auth/login',       changefreq: 'monthly', priority: '0.5' },
      { loc: '/auth/register',    changefreq: 'monthly', priority: '0.5' },
      { loc: '/terms',            changefreq: 'yearly',  priority: '0.3' },
      { loc: '/privacy',          changefreq: 'yearly',  priority: '0.3' },
    ];

    const categoryUrls: UrlEntry[] = categories.map(c => ({
      loc: `/categories/${c.slug}`,
      lastmod: c.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    }));

    const masterUrls: UrlEntry[] = masters.map(m => ({
      loc: `/masters/${m.slug}`,
      lastmod: m.updatedAt.toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.6',
    }));

    const allUrls = [...staticUrls, ...categoryUrls, ...masterUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    u => `  <url>
    <loc>${FRONTEND_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1h
    res.send(xml);
  }
}
