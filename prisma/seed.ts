import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Permissions
  const permissionsList = [
    { name: 'auth:manage', description: 'Manage authentication configurations' },
    { name: 'users:create', description: 'Create staff users' },
    { name: 'users:read', description: 'View staff users' },
    { name: 'users:update', description: 'Update staff users' },
    { name: 'users:delete', description: 'Delete staff users' },
    { name: 'guests:manage', description: 'Manage guests CRUD' },
    { name: 'rooms:manage', description: 'Manage rooms and room types' },
    { name: 'bookings:create', description: 'Create bookings' },
    { name: 'bookings:read', description: 'View bookings' },
    { name: 'bookings:update', description: 'Modify or update bookings' },
    { name: 'bookings:delete', description: 'Delete bookings' },
    { name: 'pricing:manage', description: 'Manage seasonal and special pricing' },
    { name: 'experiences:manage', description: 'Manage resort experiences and bookings' },
    { name: 'dining:manage', description: 'Manage dining menu and categories' },
    { name: 'blogs:manage', description: 'Manage blogs and articles' },
    { name: 'gallery:manage', description: 'Manage gallery media uploads' },
    { name: 'reviews:manage', description: 'Approve and feature reviews' },
    { name: 'offers:manage', description: 'Manage discount offers and promo codes' },
    { name: 'cms:manage', description: 'Manage CMS sections and landing page settings' },
    { name: 'settings:manage', description: 'Manage system and resort configurations' },
    { name: 'reports:read', description: 'Access revenue and occupancy reports' },
    { name: 'audit-logs:read', description: 'View system audit logs' },
  ];

  const permissions: any[] = [];
  for (const perm of permissionsList) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    permissions.push(p);
  }
  console.log(`Seeded ${permissions.length} permissions.`);

  // 2. Seed Roles
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'Full access to all modules and configurations' },
    { name: 'MANAGER', description: 'Manage resort operations, staff, bookings, and pricing' },
    { name: 'FRONT_DESK', description: 'Manage bookings, guests, and room allocations' },
    { name: 'BOOKING_AGENT', description: 'View room availability and create bookings' },
    { name: 'FINANCE', description: 'Access revenue reports, payments, and refunds' },
    { name: 'CONTENT_EDITOR', description: 'Manage CMS, blogs, gallery, and menu items' },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesList) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[r.name] = role;
  }
  console.log(`Seeded ${Object.keys(roles).length} roles.`);

  // 3. Associate Permissions to Roles (RolePermission)
  // SUPER_ADMIN gets all permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles['SUPER_ADMIN'].id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: roles['SUPER_ADMIN'].id,
        permissionId: perm.id,
      },
    });
  }

  // MANAGER permissions
  const managerPerms = permissions.filter(p => 
    !['users:delete', 'audit-logs:read'].includes(p.name)
  );
  for (const perm of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['MANAGER'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles['MANAGER'].id, permissionId: perm.id },
    });
  }

  // FRONT_DESK permissions
  const frontDeskPerms = permissions.filter(p => 
    ['guests:manage', 'bookings:create', 'bookings:read', 'bookings:update', 'rooms:manage', 'experiences:manage'].includes(p.name)
  );
  for (const perm of frontDeskPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['FRONT_DESK'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles['FRONT_DESK'].id, permissionId: perm.id },
    });
  }

  // CONTENT_EDITOR permissions
  const editorPerms = permissions.filter(p => 
    ['cms:manage', 'blogs:manage', 'gallery:manage', 'dining:manage', 'reviews:manage'].includes(p.name)
  );
  for (const perm of editorPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles['CONTENT_EDITOR'].id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles['CONTENT_EDITOR'].id, permissionId: perm.id },
    });
  }

  console.log('Seeded Role-Permission mappings.');

  // 4. Create Super Admin User
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@wayanadretreat.com' },
    update: { passwordHash: adminPasswordHash, roleId: roles['SUPER_ADMIN'].id },
    create: {
      firstName: 'Akhil',
      lastName: 'M K',
      email: 'admin@wayanadretreat.com',
      phone: '+919876543210',
      passwordHash: adminPasswordHash,
      roleId: roles['SUPER_ADMIN'].id,
      status: 'ACTIVE',
    },
  });

  // Assign user roles join table entry
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: roles['SUPER_ADMIN'].id } },
    update: {},
    create: { userId: superAdmin.id, roleId: roles['SUPER_ADMIN'].id },
  });

  console.log(`Seeded Super Admin user: ${superAdmin.email}`);

  // 5. Seed Room Types
  const roomTypesData = [
    {
      name: 'Premium Valley View Villa',
      slug: 'premium-valley-view-villa',
      description: 'Perched on the edge of the hill, this villa offers a spectacular, unobstructed view of the mist-laden Wayanad valleys. Features a private balcony and premium bath amenities.',
      basePrice: 15000.00,
      maxAdults: 3,
      maxChildren: 2,
      maxOccupancy: 4,
      sizeSqft: 850,
      viewType: 'Valley View',
      extraBedAllowed: true,
      status: 'ACTIVE',
    },
    {
      name: 'Luxury Plantation Villa',
      slug: 'luxury-plantation-villa',
      description: 'Nestled amidst lush coffee and spice plantations, this villa offers serene nature vibes and a rustic interior with luxury details.',
      basePrice: 12000.00,
      maxAdults: 3,
      maxChildren: 2,
      maxOccupancy: 4,
      sizeSqft: 750,
      viewType: 'Plantation View',
      extraBedAllowed: true,
      status: 'ACTIVE',
    },
    {
      name: 'Deluxe Tree House',
      slug: 'deluxe-tree-house',
      description: 'Elevated high in the forest canopy, this eco-friendly tree house offers a unique stay with a birds-eye view of the wilderness. Perfect for couples.',
      basePrice: 18000.00,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 2,
      sizeSqft: 500,
      viewType: 'Forest View',
      extraBedAllowed: false,
      status: 'ACTIVE',
    },
    {
      name: 'Forest View Cottage',
      slug: 'forest-view-cottage',
      description: 'Charming stone cottages opening directly into the verdant reserve forests of Wayanad. Relaxing and close to nature.',
      basePrice: 9000.00,
      maxAdults: 2,
      maxChildren: 2,
      maxOccupancy: 4,
      sizeSqft: 600,
      viewType: 'Forest View',
      extraBedAllowed: true,
      status: 'ACTIVE',
    },
    {
      name: 'Honeymoon Suite',
      slug: 'honeymoon-suite',
      description: 'Exquisite suite designed for newlyweds, complete with a private jacuzzi, panoramic mountain view deck, and elegant romantic setup.',
      basePrice: 20000.00,
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      sizeSqft: 900,
      viewType: 'Panoramic Valley View',
      extraBedAllowed: false,
      status: 'ACTIVE',
    },
  ];

  const roomTypes: Record<string, any> = {};
  for (const rt of roomTypesData) {
    const roomType = await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: rt,
      create: rt,
    });
    roomTypes[rt.slug] = roomType;
  }
  console.log(`Seeded ${Object.keys(roomTypes).length} room types.`);

  // 6. Seed Rooms
  const roomsData = [
    { roomNumber: 'VV-101', roomTypeId: roomTypes['premium-valley-view-villa'].id, floor: 'First Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'VV-102', roomTypeId: roomTypes['premium-valley-view-villa'].id, floor: 'First Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'PV-201', roomTypeId: roomTypes['luxury-plantation-villa'].id, floor: 'Ground Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'PV-202', roomTypeId: roomTypes['luxury-plantation-villa'].id, floor: 'Ground Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'TH-301', roomTypeId: roomTypes['deluxe-tree-house'].id, floor: 'Elevated Canopy', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'TH-302', roomTypeId: roomTypes['deluxe-tree-house'].id, floor: 'Elevated Canopy', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'FC-401', roomTypeId: roomTypes['forest-view-cottage'].id, floor: 'Ground Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'FC-402', roomTypeId: roomTypes['forest-view-cottage'].id, floor: 'Ground Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
    { roomNumber: 'HS-501', roomTypeId: roomTypes['honeymoon-suite'].id, floor: 'Top Floor', status: 'AVAILABLE', maintenanceStatus: 'OPERATIONAL' },
  ];

  for (const rm of roomsData) {
    await prisma.room.upsert({
      where: { roomNumber: rm.roomNumber },
      update: rm,
      create: rm,
    });
  }
  console.log(`Seeded ${roomsData.length} rooms.`);

  // 7. Seed Settings
  await prisma.setting.create({
    data: {
      resortName: 'Wayanad Retreat',
      email: 'info@wayanadretreat.com',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43211',
      address: 'Lakkidi, Wayanad, Kerala 673576, India',
      googleMapUrl: 'https://maps.google.com/?q=Lakkidi+Wayanad+Kerala',
      facebook: 'https://facebook.com/wayanadretreat',
      instagram: 'https://instagram.com/wayanadretreat',
      youtube: 'https://youtube.com/wayanadretreat',
      seoTitle: 'Wayanad Retreat | Luxury Eco-Resort in Lakkidi, Kerala',
      seoDescription: 'Experience pure luxury in the heart of nature. Stay in luxury valley villas, private treehouses, and plantation cottages in mist-laden Lakkidi, Wayanad.',
    },
  });
  console.log('Seeded resort settings.');

  // 8. Seed Experiences
  const experiencesData = [
    { name: 'Misty Peak Jeep Safari', description: 'An adventurous off-road jeep safari to the highest peaks of Wayanad, catching spectacular sunrise views.', duration: '3 Hours', capacity: 6, price: 3500.00, status: 'ACTIVE' },
    { name: 'Plantation Walk & Coffee Tasting', description: 'Take a guided walk through our organic coffee and spice plantations, and conclude with fresh, single-origin coffee tasting.', duration: '1.5 Hours', capacity: 15, price: 750.00, status: 'ACTIVE' },
    { name: 'Forest Canopy Trekking', description: 'A scenic and moderately challenging trek through the protected reserve forests surrounding the resort.', duration: '4 Hours', capacity: 10, price: 1500.00, status: 'ACTIVE' },
    { name: 'Campfire with Bamboo Music', description: 'Relax by a crackling campfire under the starry sky, accompanied by traditional tribal bamboo music and local snacks.', duration: '2 Hours', capacity: 30, price: 1200.00, status: 'ACTIVE' },
    { name: 'Bird Watching Walk', description: 'Join our resident naturalist to spot rare, endemic birds of the Western Ghats early in the morning.', duration: '2 Hours', capacity: 8, price: 500.00, status: 'ACTIVE' },
  ];

  for (const exp of experiencesData) {
    await prisma.experience.create({ data: exp });
  }
  console.log('Seeded experiences.');

  // 9. Seed Dining Categories & Menu Items
  const categories = [
    { name: 'Traditional Kerala Delicacies' },
    { name: 'Continental Cuisine' },
    { name: 'Beverages & Mocktails' },
  ];

  for (const cat of categories) {
    const category = await prisma.menuCategory.create({ data: cat });
    if (cat.name === 'Traditional Kerala Delicacies') {
      await prisma.menuItem.createMany({
        data: [
          { categoryId: category.id, name: 'Malabar Fish Curry', description: 'Seer fish cooked in spicy coconut milk gravy with green chili and raw mango.', price: 480.00 },
          { categoryId: category.id, name: 'Kuruva Rice & Chicken Varutharathu', description: 'Traditional Wayanadan red rice served with chicken cooked in roasted coconut gravy.', price: 420.00 },
          { categoryId: category.id, name: 'Appam with Vegetable Stew', description: 'Soft, lacy rice hoppers served with a mild, aromatic coconut milk-based stew.', price: 280.00 },
        ],
      });
    } else if (cat.name === 'Continental Cuisine') {
      await prisma.menuItem.createMany({
        data: [
          { categoryId: category.id, name: 'Grilled Herb Chicken', description: 'Tender chicken breast marinated in local fresh herbs, served with mashed potato and sautéed greens.', price: 520.00 },
          { categoryId: category.id, name: 'Forest Mushroom Risotto', description: 'Creamy Arborio rice slow-cooked with fresh local wild mushrooms and Parmesan cheese.', price: 450.00 },
        ],
      });
    } else {
      await prisma.menuItem.createMany({
        data: [
          { categoryId: category.id, name: 'Fresh Wayanad Passion Fruit Mojito', description: 'Zesty lime, mint leaves, and fresh local passion fruit pulp topped with soda.', price: 180.00 },
          { categoryId: category.id, name: 'Spiced Filter Coffee', description: 'Resort plantation coffee brewed with cardamoms and served hot in traditional brass tumbler.', price: 120.00 },
        ],
      });
    }
  }
  console.log('Seeded dining menu.');

  // 10. Seed CMS Sections
  const cmsSectionsData = [
    {
      page: 'home',
      sectionKey: 'homepage_hero',
      title: 'Escape into the Mist of Wayanad',
      subtitle: 'A Luxury Eco-Resort Floating Above the Clouds',
      content: 'Wayanad Retreat offers an immersive escape into the pristine wilderness of Kerala. Discover hand-crafted luxury villas, panoramic valley views, and curated eco-adventures.',
      mediaUrl: 'https://supabase.co/storage/v1/object/public/cms/hero_video.mp4',
      displayOrder: 1,
      enabled: true,
      settingsJson: { ctaText: 'Explore Rooms', ctaLink: '/rooms' },
    },
    {
      page: 'home',
      sectionKey: 'homepage_rooms',
      title: 'Our Sanctuaries',
      subtitle: 'Villas & Treehouses Designed for Serenity',
      content: 'Each space features hand-finished stone, rich local wood, and wide-span glazing that frames Wayanad’s dramatic topography.',
      mediaUrl: 'https://supabase.co/storage/v1/object/public/cms/rooms_preview.jpg',
      displayOrder: 2,
      enabled: true,
    },
    {
      page: 'home',
      sectionKey: 'homepage_experiences',
      title: 'Wayanad Adventures',
      subtitle: 'Curated Local Experiences',
      content: 'From sunrise peak safaris and plantation walks to bamboo music under the stars, connect deeply with local culture and nature.',
      mediaUrl: 'https://supabase.co/storage/v1/object/public/cms/experiences.jpg',
      displayOrder: 3,
      enabled: true,
    },
  ];

  for (const sec of cmsSectionsData) {
    await prisma.cmsSection.create({ data: sec });
  }
  console.log('Seeded CMS sections.');

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
