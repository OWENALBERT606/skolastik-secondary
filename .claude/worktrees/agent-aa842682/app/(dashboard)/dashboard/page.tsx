
import DashboardMain from "@/components/dashboard/DashboardMain";
import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard";
import OverViewCard from "@/components/OverViewCard";
import { DashboardWelcome } from "@/components/WelcomeBanner";
import { getAuthenticatedUser } from "@/config/useAuth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const user = await getAuthenticatedUser();

  console.log(user)
  return (
    <main>
      <SuperAdminDashboard/>
    </main>
  );
}
