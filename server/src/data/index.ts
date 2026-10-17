export const users = [
  // Managers
  {
    fullName: "John Manager",
    email: "manager1@example.com",
    password: "Manager@123",
    role: "manager" as const,
    phone: "01710000001",
    dateOfBirth: "1990-05-10",
    status: "active" as const,
  },
  {
    fullName: "Sarah Manager",
    email: "manager2@example.com",
    password: "Manager@123",
    role: "manager" as const,
    phone: "01710000002",
    dateOfBirth: "1992-08-15",
    status: "active" as const,
  },

  // Employees
  {
    fullName: "Michael Employee",
    email: "employee1@example.com",
    password: "Employee@123",
    role: "employee" as const,
    phone: "01710000003",
    dateOfBirth: "1998-03-20",
    status: "active" as const,
  },
  {
    fullName: "Emily Employee",
    email: "employee2@example.com",
    password: "Employee@123",
    role: "employee" as const,
    phone: "01710000004",
    dateOfBirth: "1999-07-12",
    status: "active" as const,
  },
  {
    fullName: "David Employee",
    email: "employee3@example.com",
    password: "Employee@123",
    role: "employee" as const,
    phone: "01710000005",
    dateOfBirth: "2001-11-25",
    status: "active" as const,
  },
];

export const seedCategories = [
  {
    name: "Industrial Valves",
    slug: "industrial-valves",
    description: "High-pressure, stainless steel, and bronze industrial valves",
    color: "#7E22CE", // Purple
  },
  {
    name: "Electronics & Sensors",
    slug: "electronics-sensors",
    description: "Micro-controllers, IoT telemetry sensors, and circuit boards",
    color: "#0D9488", // Teal
  },
  {
    name: "Fasteners & Hardware",
    slug: "fasteners-hardware",
    description: "Bolts, industrial screws, brackets, and structural nuts",
    color: "#2563EB", // Blue
  },
  {
    name: "Hydraulics & Pneumatics",
    slug: "hydraulics-pneumatics",
    description: "Pressure hoses, pneumatic fittings, and seals",
    color: "#D97706", // Amber
  },
  {
    name: "Power Tools & Accessories",
    slug: "power-tools-accessories",
    description: "Heavy-duty drills, diamond bits, and safety gear",
    color: "#E11D48", // Rose
  },
];

export const seedProducts = [
  {
    name: "Industrial Valve v4 (3/4 inch)",
    sku: "HW-VLV-004",
    barcode: "8901234567890",
    categorySlug: "industrial-valves",
    description: "Heavy-duty forged stainless steel 3-way ball valve",
    costPrice: 28.0,
    sellingPrice: 45.0,
    quantity: 4, // Low stock on purpose
    lowStockThreshold: 10,
    unit: "pcs",
    status: "low_stock" as const,
  },
  {
    name: "Micro Controller V3 Embedded",
    sku: "EL-MCU-003",
    barcode: "8901234567891",
    categorySlug: "electronics-sensors",
    description: "32-bit dual-core microcontroller with integrated Wi-Fi and Bluetooth",
    costPrice: 11.2,
    sellingPrice: 18.5,
    quantity: 0, // Out of stock on purpose
    lowStockThreshold: 15,
    unit: "pcs",
    status: "out_of_stock" as const,
  },
  {
    name: "Hydraulic Hose 2m (High Pressure)",
    sku: "HW-HSE-002",
    barcode: "8901234567892",
    categorySlug: "hydraulics-pneumatics",
    description: "Reinforced 4-wire spiral steel wire high pressure hydraulic hose",
    costPrice: 34.0,
    sellingPrice: 58.0,
    quantity: 42,
    lowStockThreshold: 8,
    unit: "pcs",
    status: "in_stock" as const,
  },
  {
    name: "Brass Hex Nut M8 (Pack of 100)",
    sku: "HW-NUT-012",
    barcode: "8901234567893",
    categorySlug: "fasteners-hardware",
    description: "Corrosion-resistant marine grade solid brass metric hex nuts",
    costPrice: 6.5,
    sellingPrice: 12.0,
    quantity: 120,
    lowStockThreshold: 20,
    unit: "box",
    status: "in_stock" as const,
  },
  {
    name: "Heavy Duty Mounting Bracket 90°",
    sku: "HW-BRK-001",
    barcode: "8901234567894",
    categorySlug: "fasteners-hardware",
    description: "Zinc-plated structural reinforcement corner angle bracket",
    costPrice: 3.8,
    sellingPrice: 8.0,
    quantity: 14,
    lowStockThreshold: 10,
    unit: "pcs",
    status: "in_stock" as const,
  },
  {
    name: "Cobalt Drill Bit Set (13 Pcs)",
    sku: "TL-BIT-013",
    barcode: "8901234567895",
    categorySlug: "power-tools-accessories",
    description: "M35 grade cobalt steel drill bits for hardened metal drilling",
    costPrice: 18.0,
    sellingPrice: 32.5,
    quantity: 2, // Low stock on purpose
    lowStockThreshold: 5,
    unit: "box",
    status: "low_stock" as const,
  },
  {
    name: "Digital Temperature & Humidity Sensor",
    sku: "EL-SNR-009",
    barcode: "8901234567896",
    categorySlug: "electronics-sensors",
    description: "Calibrated digital output relative humidity and temperature sensor",
    costPrice: 4.5,
    sellingPrice: 9.99,
    quantity: 85,
    lowStockThreshold: 15,
    unit: "pcs",
    status: "in_stock" as const,
  },
];
