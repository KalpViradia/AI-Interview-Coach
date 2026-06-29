import ResumeChatSkeleton from "@/components/skeletons/ResumeChatSkeleton";
import SidebarLayout from "@/components/SidebarLayout";

export default function Loading() {
  return (
    <SidebarLayout>
      <ResumeChatSkeleton />
    </SidebarLayout>
  );
}
