import { getSystemStatus } from "@/lib/data";
import StatusDashboard from "./components/StatusDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Home() {
  const data = await getSystemStatus();

  return <StatusDashboard data={data} />;
}
