import { TriangleAlert } from 'lucide-react'

export const lucideIconPreview = (icon?: string | null) => {
  if (!icon) {
    return <TriangleAlert size={24} />
  }

  return <span>{icon.slice(0, 2).toUpperCase()}</span>
}
