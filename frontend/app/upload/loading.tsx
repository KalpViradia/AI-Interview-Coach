import UploadSkeleton from "@/components/skeletons/UploadSkeleton";
import SidebarLayout from "@/components/SidebarLayout";

export default function Loading() {
  return (
    <SidebarLayout>
      <UploadSkeleton />
    </SidebarLayout>
  );
}
