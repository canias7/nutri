import { PageSkeleton } from '@/components/skeleton'

export default function Loading() {
  // The diary is a long page of sections; a taller skeleton keeps the scroll
  // position from lurching when the real thing arrives.
  return <PageSkeleton rows={6} />
}
