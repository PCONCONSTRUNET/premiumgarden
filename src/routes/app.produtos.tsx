import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/produtos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/produtos"!</div>
}
