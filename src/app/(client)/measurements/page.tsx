import { redirect } from 'next/navigation'

/** Body measurements moved in with the rest of the standing profile facts. */
export default function MeasurementsPage() {
  redirect('/profile#measurements')
}
