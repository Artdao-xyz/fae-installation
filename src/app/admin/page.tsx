import { AdminPanel } from "./AdminPanel";

export const metadata = {
  title: "Installation admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
