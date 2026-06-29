import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import SidebarLayout from "@/components/SidebarLayout";

export default function Loading() {
  return (
    <SidebarLayout>
      <DashboardSkeleton />
    </SidebarLayout>
  );
}
