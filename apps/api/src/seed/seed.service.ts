import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../masters/utils/slug.util';

const CATEGORIES = [
  { name: 'Inštalatérstvo',              slug: 'instalaterstvo',    icon: 'plumbing' },
  { name: 'Elektrikár',                  slug: 'elektrikar',        icon: 'electrical_services' },
  { name: 'Maľovanie',                   slug: 'malovanie',         icon: 'format_paint' },
  { name: 'Tesárstvo',                   slug: 'tesarstvo',         icon: 'carpenter' },
  { name: 'Upratovanie',                 slug: 'upratovanie',       icon: 'cleaning_services' },
  { name: 'Sťahovanie',                  slug: 'stahovanie',        icon: 'local_shipping' },
  { name: 'Rekonštrukcia',               slug: 'rekonstrukcia',     icon: 'construction' },
  { name: 'Záhradníctvo',                slug: 'zahradnictvo',      icon: 'yard' },
  { name: 'Zámočníctvo',                 slug: 'zamocnictvo',       icon: 'lock' },
  { name: 'Oprava spotrebičov',          slug: 'oprava-spotrebicov', icon: 'home_repair_service' },
  { name: 'Murárstvo',                   slug: 'murarstvo',         icon: 'foundation' },
  { name: 'Kúrenár / Plynár',            slug: 'kurenar',           icon: 'local_fire_department' },
  { name: 'Klampiarstvo / Pokrývačstvo', slug: 'klampiarstvo',      icon: 'roofing' },
  { name: 'Montáž nábytku',             slug: 'montaz-nabytku',    icon: 'chair_alt' },
  // Removed: IT a počítače — not relevant for craftsmen platform
  // Removed: Starostlivosť o zvieratá, Opatrovateľstvo, Doučovanie — not relevant for craftsmen platform
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedCategories();
    await this.seedMasterProfiles();
  }

  /**
   * Backfill MasterProfile for any MASTER user who doesn't have one yet.
   * Runs on every startup — idempotent (skips masters who already have a profile).
   */
  private async seedMasterProfiles() {
    try {
      const mastersWithoutProfile = await this.prisma.user.findMany({
        where: { role: 'MASTER', masterProfile: null },
        select: { id: true, firstName: true, lastName: true },
      });

      if (mastersWithoutProfile.length === 0) {
        this.logger.log('All masters already have profiles — skipping seed');
        return;
      }

      // Load all existing slugs up-front to avoid collisions within this batch
      const existing = await this.prisma.masterProfile.findMany({
        select: { slug: true },
      });
      const existingSlugs = existing.map((p) => p.slug);

      for (const master of mastersWithoutProfile) {
        const slug = generateSlug(master.firstName, master.lastName, existingSlugs);
        existingSlugs.push(slug); // reserve for next iteration

        await this.prisma.masterProfile.create({
          data: { userId: master.id, slug },
        });
        this.logger.log(`Created MasterProfile for user ${master.id}: slug="${slug}"`);
      }

      this.logger.log(
        `Seeded MasterProfile for ${mastersWithoutProfile.length} master(s)`,
      );
    } catch (err) {
      this.logger.error('Failed to seed master profiles', err);
    }
  }

  private async seedCategories() {
    try {
      for (const category of CATEGORIES) {
        await this.prisma.serviceCategory.upsert({
          where: { slug: category.slug },
          update: { name: category.name, icon: category.icon },
          create: category,
        });
      }
      this.logger.log(`Seeded ${CATEGORIES.length} categories`);
    } catch (err) {
      this.logger.error('Failed to seed categories', err);
    }
  }
}
