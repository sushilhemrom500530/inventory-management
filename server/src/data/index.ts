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
